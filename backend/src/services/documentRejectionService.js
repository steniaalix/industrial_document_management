const { pool } = require('../config/db');

/**
 * Service to handle business logic and database queries for the Document Rejection module.
 */
class DocumentRejectionService {
  /**
   * Check whether a document exists in the database
   * @param {number} docId 
   * @returns {Promise<boolean>}
   */
  async documentExists(docId) {
    const query = 'SELECT doc_id FROM documents WHERE doc_id = ?';
    const [rows] = await pool.query(query, [docId]);
    return rows.length > 0;
  }

  /**
   * Check whether a version exists and belongs to the specified document
   * @param {number} docId 
   * @param {number} versionId 
   * @returns {Promise<boolean>}
   */
  async versionBelongsToDocument(docId, versionId) {
    const query = 'SELECT version_id FROM document_versions WHERE doc_id = ? AND version_id = ?';
    const [rows] = await pool.query(query, [docId, versionId]);
    return rows.length > 0;
  }

  /**
   * Check whether a user exists in the database
   * @param {number} userId 
   * @returns {Promise<boolean>}
   */
  async userExists(userId) {
    const query = 'SELECT user_id FROM users WHERE user_id = ?';
    const [rows] = await pool.query(query, [userId]);
    return rows.length > 0;
  }

  /**
   * Creates a rejection record for a specific document version
   * @param {number} docId 
   * @param {number} versionId 
   * @param {number} rejectedBy 
   * @param {string} reason 
   * @returns {Promise<object>} The newly created rejection record details
   */
  async createRejection(docId, versionId, rejectedBy, reason) {
    // 1. Fetch document status and verify existence
    const [docRows] = await pool.query('SELECT status FROM documents WHERE doc_id = ?', [docId]);
    if (docRows.length === 0) {
      const err = new Error(`Document with ID ${docId} not found`);
      err.status = 404;
      throw err;
    }
    const currentStatus = docRows[0].status;
    if (currentStatus !== 'UNDER_REVIEW') {
      const err = new Error('Only documents with UNDER_REVIEW status can be rejected');
      err.status = 400;
      throw err;
    }

    // 2. Verify version belongs to document
    const verBelongs = await this.versionBelongsToDocument(docId, versionId);
    if (!verBelongs) {
      const err = new Error(`Document version with ID ${versionId} not found for document with ID ${docId}`);
      err.status = 404;
      throw err;
    }

    // 3. Verify user exists and check their role
    const [userRows] = await pool.query('SELECT role FROM users WHERE user_id = ?', [rejectedBy]);
    if (userRows.length === 0) {
      const err = new Error(`User with ID ${rejectedBy} not found`);
      err.status = 404;
      throw err;
    }
    if (userRows[0].role !== 'REVIEWER') {
      const err = new Error('Only REVIEWER users can reject documents');
      err.status = 403;
      throw err;
    }

    // 4. Atomically insert rejection and update document status using a transaction
    const connection = await pool.getConnection();
    let rejectionId;
    try {
      await connection.beginTransaction();

      // Insert rejection
      const insertQuery = `
        INSERT INTO document_rejections (version_id, rejected_by, reason)
        VALUES (?, ?, ?)
      `;
      const [result] = await connection.query(insertQuery, [versionId, rejectedBy, reason]);
      rejectionId = result.insertId;

      // Update document status to REJECTED
      const updateQuery = `
        UPDATE documents 
        SET status = 'REJECTED' 
        WHERE doc_id = ?
      `;
      await connection.query(updateQuery, [docId]);

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    // 5. Retrieve newly created rejection
    return await this.getRejectionById(rejectionId);
  }

  /**
   * Helper to retrieve a single rejection by its ID with uploader's name
   * @param {number} rejectionId 
   * @returns {Promise<object|null>}
   */
  async getRejectionById(rejectionId) {
    const query = `
      SELECT 
        r.rejection_id, 
        r.version_id, 
        r.rejected_by, 
        u.name AS rejected_by_name, 
        r.reason, 
        r.rejected_at
      FROM document_rejections r
      LEFT JOIN users u ON r.rejected_by = u.user_id
      WHERE r.rejection_id = ?
    `;
    const [rows] = await pool.query(query, [rejectionId]);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Retrieves all rejection history records for a specific document version
   * @param {number} docId 
   * @param {number} versionId 
   * @returns {Promise<Array>} List of rejection records
   */
  async getRejectionsByVersion(docId, versionId) {
    // 1. Verify document exists
    const docExists = await this.documentExists(docId);
    if (!docExists) {
      const err = new Error(`Document with ID ${docId} not found`);
      err.status = 404;
      throw err;
    }

    // 2. Verify version belongs to document
    const verBelongs = await this.versionBelongsToDocument(docId, versionId);
    if (!verBelongs) {
      const err = new Error(`Document version with ID ${versionId} not found for document with ID ${docId}`);
      err.status = 404;
      throw err;
    }

    // 3. Fetch rejection records
    const query = `
      SELECT 
        r.rejection_id, 
        r.version_id, 
        r.rejected_by, 
        u.name AS rejected_by_name, 
        r.reason, 
        r.rejected_at
      FROM document_rejections r
      LEFT JOIN users u ON r.rejected_by = u.user_id
      WHERE r.version_id = ?
      ORDER BY r.rejected_at DESC
    `;
    const [rows] = await pool.query(query, [versionId]);
    return rows;
  }
}

module.exports = new DocumentRejectionService();
