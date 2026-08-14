const { pool } = require('../config/db');

/**
 * Service to handle business logic and database queries for the Category module.
 */
class CategoryService {
  /**
   * Retrieves all categories from the database, sorted by category_id ascending.
   * Calculates the document count associated with each category.
   * @returns {Promise<Array>} List of category objects
   */
  async getAllCategories() {
    const query = `
      SELECT 
        c.category_id,
        c.name AS category_name,
        c.description,
        COUNT(d.doc_id) AS document_count
      FROM categories c
      LEFT JOIN documents d ON c.category_id = d.category_id
      GROUP BY c.category_id, c.name, c.description
      ORDER BY c.category_id ASC
    `;
    const [rows] = await pool.query(query);
    return rows;
  }

  /**
   * Retrieves a single category by ID, including its document count.
   * @param {number} categoryId - The ID of the category to retrieve
   * @returns {Promise<object>} The category object
   */
  async getCategoryById(categoryId) {
    const query = `
      SELECT 
        c.category_id,
        c.name AS category_name,
        c.description,
        COUNT(d.doc_id) AS document_count
      FROM categories c
      LEFT JOIN documents d ON c.category_id = d.category_id
      WHERE c.category_id = ?
      GROUP BY c.category_id, c.name, c.description
    `;
    const [rows] = await pool.query(query, [categoryId]);

    if (rows.length === 0 || rows[0].category_id === null) {
      const err = new Error(`Category with ID ${categoryId} not found`);
      err.status = 404;
      throw err;
    }

    return rows[0];
  }

  /**
   * Creates a new category in the database.
   * @param {object} categoryData - The fields to create the category with
   * @returns {Promise<object>} The newly created category object
   */
  async createCategory({ name, description = null }) {
    if (!name || typeof name !== 'string' || name.trim() === '') {
      const err = new Error('Category name is required and cannot be empty');
      err.status = 400;
      throw err;
    }

    const trimmedName = name.trim();

    if (trimmedName.length > 100) {
      const err = new Error('Category name cannot exceed 100 characters');
      err.status = 400;
      throw err;
    }

    const query = `
      INSERT INTO categories (name, description)
      VALUES (?, ?)
    `;

    try {
      const [result] = await pool.query(query, [
        trimmedName,
        description !== undefined && description !== null ? description.trim() : null
      ]);

      return await this.getCategoryById(result.insertId);
    } catch (error) {
      // Catch unique constraint violation (duplicate category name)
      if (error.errno === 1062 || error.code === 'ER_DUP_ENTRY') {
        const err = new Error('Category name is already registered');
        err.status = 400;
        throw err;
      }
      throw error;
    }
  }

  /**
   * Updates an existing category's details.
   * @param {number} categoryId - The ID of the category to update
   * @param {object} categoryData - The fields to update
   * @returns {Promise<object>} The updated category object
   */
  async updateCategory(categoryId, { name, description }) {
    // Verify category exists first
    const existingCategory = await this.getCategoryById(categoryId);

    const fields = [];
    const values = [];

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim() === '') {
        const err = new Error('Category name is required and cannot be empty');
        err.status = 400;
        throw err;
      }

      const trimmedName = name.trim();

      if (trimmedName.length > 100) {
        const err = new Error('Category name cannot exceed 100 characters');
        err.status = 400;
        throw err;
      }

      fields.push('name = ?');
      values.push(trimmedName);
    }

    if (description !== undefined) {
      fields.push('description = ?');
      values.push(description !== null ? description.trim() : null);
    }

    // If nothing to update
    if (fields.length === 0) {
      return existingCategory;
    }

    const query = `UPDATE categories SET ${fields.join(', ')} WHERE category_id = ?`;
    values.push(categoryId);

    try {
      await pool.query(query, values);
      return await this.getCategoryById(categoryId);
    } catch (error) {
      if (error.errno === 1062 || error.code === 'ER_DUP_ENTRY') {
        const err = new Error('Category name is already registered');
        err.status = 400;
        throw err;
      }
      throw error;
    }
  }

  /**
   * Deletes a category by ID. Reject if referenced by documents.
   * @param {number} categoryId - The ID of the category to delete
   * @returns {Promise<boolean>} True if deleted successfully
   */
  async deleteCategory(categoryId) {
    // Verify category exists first
    await this.getCategoryById(categoryId);

    // Explicit check for existing documents referencing this category
    const checkQuery = 'SELECT COUNT(*) AS count FROM documents WHERE category_id = ?';
    const [checkRows] = await pool.query(checkQuery, [categoryId]);

    if (checkRows[0].count > 0) {
      const err = new Error('Category cannot be deleted because it is being used by existing documents.');
      err.status = 400;
      throw err;
    }

    const deleteQuery = 'DELETE FROM categories WHERE category_id = ?';
    const [result] = await pool.query(deleteQuery, [categoryId]);
    return result.affectedRows > 0;
  }
}

module.exports = new CategoryService();
