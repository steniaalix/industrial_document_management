const { pool } = require('../config/db');
const documentService = require('./documentService');

/**
 * Service to handle business logic and database queries for the Document Approval module.
 */
class DocumentApprovalService {
  /**
   * Approves a document under review and archives it atomically.
   * @param {number} docId - The ID of the document to approve
   * @param {number} approvedBy - The user_id of the approving REVIEWER
   * @returns {Promise<object>} The updated document information
   */
  async approveDocument(docId, approvedBy) {
    // 1. Verify approving user exists and check their role
    const [userRows] = await pool.query('SELECT role FROM users WHERE user_id = ?', [approvedBy]);
    if (userRows.length === 0) {
      const err = new Error('Approving user not found');
      err.status = 404;
      throw err;
    }
    if (userRows[0].role !== 'REVIEWER') {
      const err = new Error('Only REVIEWER users can approve documents');
      err.status = 403;
      throw err;
    }

    // 2. Verify document exists and check its current status
    const [docRows] = await pool.query('SELECT status FROM documents WHERE doc_id = ?', [docId]);
    if (docRows.length === 0) {
      const err = new Error('Document not found');
      err.status = 404;
      throw err;
    }
    if (docRows[0].status !== 'UNDER_REVIEW') {
      const err = new Error('Only documents with UNDER_REVIEW status can be approved');
      err.status = 400;
      throw err;
    }

    // 3. Atomically perform status transition (UNDER_REVIEW -> APPROVED -> ARCHIVED)
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Transition 1: UNDER_REVIEW -> APPROVED
      await connection.query("UPDATE documents SET status = 'APPROVED' WHERE doc_id = ?", [docId]);

      // Transition 2: APPROVED -> ARCHIVED
      await connection.query("UPDATE documents SET status = 'ARCHIVED' WHERE doc_id = ?", [docId]);

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    // 4. Retrieve and return the updated document details
    return await documentService.getDocumentById(docId);
  }
}

module.exports = new DocumentApprovalService();
