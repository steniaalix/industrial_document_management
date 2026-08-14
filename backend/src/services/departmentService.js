const { pool } = require('../config/db');

/**
 * Service to handle business logic and database queries for the Department module.
 */
class DepartmentService {
  /**
   * Retrieves all departments from the database, sorted by department_id ascending.
   * Calculates distinct users and documents associated with each department.
   * @returns {Promise<Array>} List of department objects
   */
  async getAllDepartments() {
    const query = `
      SELECT 
        d.department_id,
        d.name,
        d.description,
        COUNT(DISTINCT u.user_id) AS user_count,
        COUNT(DISTINCT doc.doc_id) AS document_count
      FROM departments d
      LEFT JOIN users u ON d.department_id = u.department_id
      LEFT JOIN documents doc ON d.department_id = doc.department_id
      GROUP BY d.department_id, d.name, d.description
      ORDER BY d.department_id ASC
    `;
    const [rows] = await pool.query(query);
    return rows;
  }

  /**
   * Retrieves a single department by ID, including its user and document counts.
   * @param {number} departmentId - The ID of the department to retrieve
   * @returns {Promise<object>} The department object
   */
  async getDepartmentById(departmentId) {
    const query = `
      SELECT 
        d.department_id,
        d.name,
        d.description,
        COUNT(DISTINCT u.user_id) AS user_count,
        COUNT(DISTINCT doc.doc_id) AS document_count
      FROM departments d
      LEFT JOIN users u ON d.department_id = u.department_id
      LEFT JOIN documents doc ON d.department_id = doc.department_id
      WHERE d.department_id = ?
      GROUP BY d.department_id, d.name, d.description
    `;
    const [rows] = await pool.query(query, [departmentId]);

    // Group count and left join returns a single row with null department_id if no match found
    if (rows.length === 0 || rows[0].department_id === null) {
      const err = new Error(`Department with ID ${departmentId} not found`);
      err.status = 404;
      throw err;
    }

    return rows[0];
  }

  /**
   * Creates a new department in the database.
   * @param {object} departmentData - The fields to create the department with
   * @returns {Promise<object>} The newly created department object
   */
  async createDepartment({ name, description = null }) {
    if (!name || typeof name !== 'string' || name.trim() === '') {
      const err = new Error('Department name is required and cannot be empty');
      err.status = 400;
      throw err;
    }

    const trimmedName = name.trim();

    if (trimmedName.length > 100) {
      const err = new Error('Department name cannot exceed 100 characters');
      err.status = 400;
      throw err;
    }

    const query = `
      INSERT INTO departments (name, description)
      VALUES (?, ?)
    `;

    try {
      const [result] = await pool.query(query, [
        trimmedName,
        description !== undefined && description !== null ? description.trim() : null
      ]);

      return await this.getDepartmentById(result.insertId);
    } catch (error) {
      // Catch unique constraint violation (duplicate department name)
      if (error.errno === 1062 || error.code === 'ER_DUP_ENTRY') {
        const err = new Error('Department name is already registered');
        err.status = 400;
        throw err;
      }
      throw error;
    }
  }

  /**
   * Updates an existing department's details.
   * @param {number} departmentId - The ID of the department to update
   * @param {object} departmentData - The fields to update
   * @returns {Promise<object>} The updated department object
   */
  async updateDepartment(departmentId, { name, description }) {
    // Verify department exists first
    const existingDept = await this.getDepartmentById(departmentId);

    const fields = [];
    const values = [];

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim() === '') {
        const err = new Error('Department name is required and cannot be empty');
        err.status = 400;
        throw err;
      }

      const trimmedName = name.trim();

      if (trimmedName.length > 100) {
        const err = new Error('Department name cannot exceed 100 characters');
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

    // If nothing to update, return the existing department
    if (fields.length === 0) {
      return existingDept;
    }

    const query = `UPDATE departments SET ${fields.join(', ')} WHERE department_id = ?`;
    values.push(departmentId);

    try {
      await pool.query(query, values);
      return await this.getDepartmentById(departmentId);
    } catch (error) {
      if (error.errno === 1062 || error.code === 'ER_DUP_ENTRY') {
        const err = new Error('Department name is already registered');
        err.status = 400;
        throw err;
      }
      throw error;
    }
  }

  /**
   * Deletes a department by ID.
   * @param {number} departmentId - The ID of the department to delete
   * @returns {Promise<boolean>} True if deleted successfully
   */
  async deleteDepartment(departmentId) {
    // Verify department exists first
    await this.getDepartmentById(departmentId);

    const deleteQuery = 'DELETE FROM departments WHERE department_id = ?';
    const [result] = await pool.query(deleteQuery, [departmentId]);
    return result.affectedRows > 0;
  }
}

module.exports = new DepartmentService();
