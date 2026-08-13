const { pool } = require('../config/db');

/**
 * Service to handle business logic and database queries for the Document Version module.
 */
class DocumentVersionService {
  /**
   * Helper to verify if a document exists in the database
   * @param {number} docId 
   * @returns {Promise<boolean>}
   */
  async documentExists(docId) {
    const query = 'SELECT doc_id FROM documents WHERE doc_id = ?';
    const [rows] = await pool.query(query, [docId]);
    return rows.length > 0;
  }

  /**
   * Creates a new document version, automatically calculating the next version number
   * @param {number} docId - The ID of the document
   * @param {number} uploadedBy - The ID of the user uploading the version
   * @param {object} file - The Multer file object
   * @returns {Promise<object>} The newly created version with uploader details
   */
  async createVersion(docId, uploadedBy, file) {
    // 1. Verify that the document exists
    const exists = await this.documentExists(docId);
    if (!exists) {
      const err = new Error(`Document with ID ${docId} not found`);
      err.status = 404;
      throw err;
    }

    // 2. Determine the next version number using MAX(version_number) + 1
    const verQuery = `
      SELECT COALESCE(MAX(version_number), 0) AS max_ver 
      FROM document_versions 
      WHERE doc_id = ?
    `;
    const [verRows] = await pool.query(verQuery, [docId]);
    const nextVersionNumber = verRows[0].max_ver + 1;

    // 3. Obtain relative path (e.g. 'uploads/file-12345.pdf')
    const relativePath = 'uploads/' + file.filename;

    // 4. Insert into the database
    const insertQuery = `
      INSERT INTO document_versions (doc_id, version_number, file_name, file_path, uploaded_by)
      VALUES (?, ?, ?, ?, ?)
    `;

    try {
      const [result] = await pool.query(insertQuery, [
        docId,
        nextVersionNumber,
        file.originalname,
        relativePath,
        uploadedBy
      ]);

      // 5. Fetch and return the newly created version
      return await this.getVersionById(docId, result.insertId);
    } catch (error) {
      // Map MySQL foreign key constraint errors to clear, user-friendly messages
      if (error.errno === 1452 || error.code === 'ER_NO_REFERENCED_ROW_2') {
        const message = error.message;
        if (message.includes('fk_versions_uploader')) {
          const err = new Error('Uploader user does not exist');
          err.status = 400;
          throw err;
        }
      }
      // Handle potential duplicate version number races
      if (error.errno === 1062 || error.code === 'ER_DUP_ENTRY') {
        const err = new Error('A version with this version number already exists for the document');
        err.status = 409; // Conflict
        throw err;
      }
      throw error;
    }
  }

  /**
   * Retrieves all versions of a document, ordered newest first (version_number DESC)
   * @param {number} docId - The ID of the document
   * @returns {Promise<Array>} List of document versions
   */
  async getVersionsByDocumentId(docId) {
    // Verify document exists first
    const exists = await this.documentExists(docId);
    if (!exists) {
      const err = new Error(`Document with ID ${docId} not found`);
      err.status = 404;
      throw err;
    }

    const query = `
      SELECT 
        v.version_id, 
        v.doc_id, 
        v.version_number, 
        v.file_name, 
        v.file_path, 
        v.uploaded_by, 
        u.name AS uploader_name,
        v.created_at
      FROM document_versions v
      LEFT JOIN users u ON v.uploaded_by = u.user_id
      WHERE v.doc_id = ?
      ORDER BY v.version_number DESC
    `;
    const [rows] = await pool.query(query, [docId]);
    return rows;
  }

  /**
   * Retrieves a single document version by doc_id and version_id
   * @param {number} docId - The ID of the document
   * @param {number} versionId - The ID of the version
   * @returns {Promise<object|null>} The version object or null if not found
   */
  async getVersionById(docId, versionId) {
    const query = `
      SELECT 
        v.version_id, 
        v.doc_id, 
        v.version_number, 
        v.file_name, 
        v.file_path, 
        v.uploaded_by, 
        u.name AS uploader_name,
        v.created_at
      FROM document_versions v
      LEFT JOIN users u ON v.uploaded_by = u.user_id
      WHERE v.doc_id = ? AND v.version_id = ?
    `;
    const [rows] = await pool.query(query, [docId, versionId]);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Retrieves a single document version's file details by doc_id and version_id
   * @param {number} docId - The ID of the document
   * @param {number} versionId - The ID of the version
   * @returns {Promise<object|null>} The version file object or null if not found
   */
  async getVersionFile(docId, versionId) {
    const query = `
      SELECT 
        version_id, 
        doc_id, 
        version_number, 
        file_name, 
        file_path
      FROM document_versions
      WHERE doc_id = ? AND version_id = ?
    `;
    const [rows] = await pool.query(query, [docId, versionId]);
    return rows.length > 0 ? rows[0] : null;
  }
}

module.exports = new DocumentVersionService();
