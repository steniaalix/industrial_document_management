const { pool } = require('../config/db');
const documentService = require('./documentService');

/**
 * Service to handle business logic and database queries for submitting documents for review.
 */
class DocumentReviewService {
  /**
   * Submits a DRAFT document for review, changing its status to UNDER_REVIEW
   * @param {number} docId - The ID of the document to submit
   * @returns {Promise<object>} The updated document details
   */
  async submitForReview(docId) {
    // 1. Verify document exists and retrieve its current status
    const [docRows] = await pool.query('SELECT status FROM documents WHERE doc_id = ?', [docId]);
    if (docRows.length === 0) {
      const err = new Error('Document not found');
      err.status = 404;
      throw err;
    }

    const currentStatus = docRows[0].status;

    // 2. Enforce transition rule: Only DRAFT or REJECTED -> UNDER_REVIEW
    if (currentStatus !== 'DRAFT' && currentStatus !== 'REJECTED') {
      const err = new Error(`Only documents in DRAFT or REJECTED status can be submitted for review. Current status is: ${currentStatus}`);
      err.status = 400;
      throw err;
    }

    // 3. For REJECTED documents, ensure a new version has been uploaded since the last rejection
    if (currentStatus === 'REJECTED') {
      const [versionRows] = await pool.query(
        `SELECT 
          (SELECT MAX(version_number) FROM document_versions WHERE doc_id = ?) AS max_version,
          (SELECT MAX(v.version_number) 
           FROM document_rejections r 
           JOIN document_versions v ON r.version_id = v.version_id 
           WHERE v.doc_id = ?) AS max_rejected_version`,
        [docId, docId]
      );

      const maxVer = versionRows[0].max_version;
      const maxRejectedVer = versionRows[0].max_rejected_version;

      if (maxVer === null || maxRejectedVer === null || maxVer <= maxRejectedVer) {
        const err = new Error('A new version must be uploaded before resubmitting the rejected document for review');
        err.status = 400;
        throw err;
      }
    }

    // 4. Update document status to UNDER_REVIEW
    await pool.query("UPDATE documents SET status = 'UNDER_REVIEW' WHERE doc_id = ?", [docId]);

    // 5. Retrieve and return updated document information
    return await documentService.getDocumentById(docId);
  }
}

module.exports = new DocumentReviewService();
