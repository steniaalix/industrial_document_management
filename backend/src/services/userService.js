const { pool } = require('../config/db');

/**
 * Service to handle business logic and database queries for the User module.
 */
class UserService {
  /**
   * Retrieves all users from the database, sorted by user_id ascending.
   * Joins departments table to fetch department_name. Excludes password field.
   * @returns {Promise<Array>} List of user objects
   */
  async getAllUsers() {
    const query = `
      SELECT 
        u.user_id,
        u.name,
        u.email,
        u.role,
        u.department_id,
        d.name AS department_name,
        u.created_at
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.department_id
      ORDER BY u.user_id ASC
    `;
    const [rows] = await pool.query(query);
    return rows;
  }

  /**
   * Retrieves a single user by ID. Excludes password field.
   * @param {number} userId - The ID of the user to retrieve
   * @returns {Promise<object>} The user object
   */
  async getUserById(userId) {
    const query = `
      SELECT 
        u.user_id,
        u.name,
        u.email,
        u.role,
        u.department_id,
        d.name AS department_name,
        u.created_at
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.department_id
      WHERE u.user_id = ?
    `;
    const [rows] = await pool.query(query, [userId]);
    
    if (rows.length === 0) {
      const err = new Error(`User with ID ${userId} not found`);
      err.status = 404;
      throw err;
    }
    
    return rows[0];
  }

  /**
   * Creates a new user in the database.
   * @param {object} userData - The fields to create the user with
   * @returns {Promise<object>} The newly created user object (excluding password)
   */
  async createUser({ name, email, password, role, department_id = null }) {
    // 1. Validation
    if (!name || typeof name !== 'string' || name.trim() === '') {
      const err = new Error('Name is required and must be a non-empty string');
      err.status = 400;
      throw err;
    }
    if (!email || typeof email !== 'string' || email.trim() === '') {
      const err = new Error('Email is required and must be a non-empty string');
      err.status = 400;
      throw err;
    }
    if (!password || typeof password !== 'string' || password.trim() === '') {
      const err = new Error('Password is required and must be a non-empty string');
      err.status = 400;
      throw err;
    }
    const allowedRoles = ['EMPLOYEE', 'REVIEWER', 'ADMIN'];
    if (!role || !allowedRoles.includes(role)) {
      const err = new Error('Role must be exactly one of: EMPLOYEE, REVIEWER, ADMIN');
      err.status = 400;
      throw err;
    }

    const query = `
      INSERT INTO users (name, email, password, role, department_id)
      VALUES (?, ?, ?, ?, ?)
    `;

    try {
      const [result] = await pool.query(query, [
        name.trim(),
        email.trim().toLowerCase(),
        password, // plaintext for this demo
        role,
        department_id || null
      ]);

      return await this.getUserById(result.insertId);
    } catch (error) {
      // Catch unique constraint violation (duplicate email)
      if (error.errno === 1062 || error.code === 'ER_DUP_ENTRY') {
        const err = new Error('Email is already registered');
        err.status = 400;
        throw err;
      }
      // Catch foreign key constraint violation (invalid department_id)
      if (error.errno === 1452 || error.code === 'ER_NO_REFERENCED_ROW_2') {
        const err = new Error('Department does not exist');
        err.status = 400;
        throw err;
      }
      throw error;
    }
  }

  /**
   * Updates an existing user's details.
   * @param {number} userId - The ID of the user to update
   * @param {object} userData - The fields to update
   * @returns {Promise<object>} The updated user object (excluding password)
   */
  async updateUser(userId, userData) {
    // Verify user exists first
    const existingUser = await this.getUserById(userId);

    const { name, email, password, role, department_id } = userData;

    // Build update query dynamically
    const fields = [];
    const values = [];

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim() === '') {
        const err = new Error('Name must be a non-empty string');
        err.status = 400;
        throw err;
      }
      fields.push('name = ?');
      values.push(name.trim());
    }

    if (email !== undefined) {
      if (typeof email !== 'string' || email.trim() === '') {
        const err = new Error('Email must be a non-empty string');
        err.status = 400;
        throw err;
      }
      fields.push('email = ?');
      values.push(email.trim().toLowerCase());
    }

    // Only update password if a new non-empty password is explicitly supplied
    if (password !== undefined && password !== null && password.trim() !== '') {
      fields.push('password = ?');
      values.push(password);
    }

    if (role !== undefined) {
      const allowedRoles = ['EMPLOYEE', 'REVIEWER', 'ADMIN'];
      if (!allowedRoles.includes(role)) {
        const err = new Error('Role must be exactly one of: EMPLOYEE, REVIEWER, ADMIN');
        err.status = 400;
        throw err;
      }
      fields.push('role = ?');
      values.push(role);
    }

    if (department_id !== undefined) {
      fields.push('department_id = ?');
      values.push(department_id || null);
    }

    // If nothing to update
    if (fields.length === 0) {
      return existingUser;
    }

    const query = `UPDATE users SET ${fields.join(', ')} WHERE user_id = ?`;
    values.push(userId);

    try {
      await pool.query(query, values);
      return await this.getUserById(userId);
    } catch (error) {
      if (error.errno === 1062 || error.code === 'ER_DUP_ENTRY') {
        const err = new Error('Email is already registered');
        err.status = 400;
        throw err;
      }
      if (error.errno === 1452 || error.code === 'ER_NO_REFERENCED_ROW_2') {
        const err = new Error('Department does not exist');
        err.status = 400;
        throw err;
      }
      throw error;
    }
  }

  /**
   * Deletes a user by ID.
   * @param {number} userId - The ID of the user to delete
   * @returns {Promise<boolean>} True if deleted
   */
  async deleteUser(userId) {
    // Verify user exists first
    await this.getUserById(userId);

    const query = 'DELETE FROM users WHERE user_id = ?';
    
    try {
      const [result] = await pool.query(query, [userId]);
      return result.affectedRows > 0;
    } catch (error) {
      // Check for foreign key constraint violation (ER_ROW_IS_REFERENCED_2 / errno 1451)
      if (error.errno === 1451 || error.code === 'ER_ROW_IS_REFERENCED_2') {
        const err = new Error('User cannot be deleted because they are referenced by existing documents or document versions.');
        err.status = 400;
        throw err;
      }
      throw error;
    }
  }
}

module.exports = new UserService();
