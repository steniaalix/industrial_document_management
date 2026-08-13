const { pool } = require('../config/db');

/**
 * Service to handle business logic and database queries for the Document module.
 */
class DocumentService {
  /**
   * Helper to retrieve a document with fully joined tables (owner, category, department)
   * @param {number} docId - The ID of the document to retrieve
   * @returns {Promise<object|null>} The document object or null if not found
   */
  async getDocumentById(docId) {
    const query = `
      SELECT 
        d.doc_id, 
        d.title, 
        d.description, 
        d.category_id, 
        c.name AS category_name,
        d.department_id, 
        dept.name AS department_name,
        d.owner_id, 
        u.name AS owner_name,
        d.status, 
        d.created_at, 
        d.updated_at
      FROM documents d
      LEFT JOIN categories c ON d.category_id = c.category_id
      LEFT JOIN departments dept ON d.department_id = dept.department_id
      LEFT JOIN users u ON d.owner_id = u.user_id
      WHERE d.doc_id = ?
    `;
    const [rows] = await pool.query(query, [docId]);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Retrieves all documents from the database
   * @returns {Promise<Array>} A list of all documents
   */
  async getAllDocuments() {
    const query = `
      SELECT 
        d.doc_id, 
        d.title, 
        d.description, 
        d.category_id, 
        c.name AS category_name,
        d.department_id, 
        dept.name AS department_name,
        d.owner_id, 
        u.name AS owner_name,
        d.status, 
        d.created_at, 
        d.updated_at
      FROM documents d
      LEFT JOIN categories c ON d.category_id = c.category_id
      LEFT JOIN departments dept ON d.department_id = dept.department_id
      LEFT JOIN users u ON d.owner_id = u.user_id
      ORDER BY d.created_at DESC
    `;
    const [rows] = await pool.query(query);
    return rows;
  }

  /**
   * Inserts a new document into the database
   * @param {object} docData - The document fields
   * @returns {Promise<object>} The newly created document
   */
  async createDocument({ title, description = null, category_id = null, department_id = null, owner_id, status = 'DRAFT' }) {
    const query = `
      INSERT INTO documents (title, description, category_id, department_id, owner_id, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    try {
      const [result] = await pool.query(query, [
        title,
        description,
        category_id,
        department_id,
        owner_id,
        status
      ]);
      
      // Fetch and return the newly created document
      return await this.getDocumentById(result.insertId);
    } catch (error) {
      // Map MySQL foreign key constraint errors to helpful error messages
      if (error.errno === 1452 || error.code === 'ER_NO_REFERENCED_ROW_2') {
        const message = error.message;
        if (message.includes('fk_documents_owner')) {
          const err = new Error('Owner user does not exist');
          err.status = 400;
          throw err;
        }
        if (message.includes('fk_documents_category')) {
          const err = new Error('Category does not exist');
          err.status = 400;
          throw err;
        }
        if (message.includes('fk_documents_department')) {
          const err = new Error('Department does not exist');
          err.status = 400;
          throw err;
        }
      }
      throw error;
    }
  }

  /**
   * Updates only basic fields of an existing document
   * @param {number} docId - The ID of the document to update
   * @param {object} updates - Key-value pairs of fields to update
   * @returns {Promise<object>} The updated document
   */
  async updateDocument(docId, updates) {
    // Exclude unexpected fields and verify update payload is not empty
    const allowedKeys = ['title', 'description', 'category_id', 'department_id', 'owner_id', 'status'];
    const fieldsToSet = [];
    const values = [];

    for (const key of allowedKeys) {
      if (updates[key] !== undefined) {
        fieldsToSet.push(`${key} = ?`);
        values.push(updates[key]);
      }
    }

    if (fieldsToSet.length === 0) {
      // Nothing to update, just return the document
      return await this.getDocumentById(docId);
    }

    const query = `
      UPDATE documents 
      SET ${fieldsToSet.join(', ')}
      WHERE doc_id = ?
    `;
    
    // Add docId to values list for WHERE clause
    values.push(docId);

    try {
      await pool.query(query, values);
      return await this.getDocumentById(docId);
    } catch (error) {
      // Map MySQL foreign key constraint errors to helpful error messages
      if (error.errno === 1452 || error.code === 'ER_NO_REFERENCED_ROW_2') {
        const message = error.message;
        if (message.includes('fk_documents_owner')) {
          const err = new Error('Owner user does not exist');
          err.status = 400;
          throw err;
        }
        if (message.includes('fk_documents_category')) {
          const err = new Error('Category does not exist');
          err.status = 400;
          throw err;
        }
        if (message.includes('fk_documents_department')) {
          const err = new Error('Department does not exist');
          err.status = 400;
          throw err;
        }
      }
      throw error;
    }
  }

  /**
   * Deletes a document from the database (foreign key cascade is handled by MySQL)
   * @param {number} docId - The ID of the document to delete
   * @returns {Promise<boolean>} True if the document was found and deleted, false otherwise
   */
  async deleteDocument(docId) {
    const query = 'DELETE FROM documents WHERE doc_id = ?';
    const [result] = await pool.query(query, [docId]);
    return result.affectedRows > 0;
  }
}

module.exports = new DocumentService();
