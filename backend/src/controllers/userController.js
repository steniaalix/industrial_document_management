const userService = require('../services/userService');

/**
 * Controller to handle HTTP requests for the User module.
 */
class UserController {
  /**
   * Helper to validate that a value is a positive integer.
   * @param {*} val - Value to test
   * @returns {boolean} True if it is a positive integer
   */
  isPositiveInteger(val) {
    const num = Number(val);
    return Number.isInteger(num) && num > 0;
  }

  /**
   * Handles GET /api/users
   * Retrieves all users (without passwords).
   */
  getAllUsers = async (req, res, next) => {
    try {
      const users = await userService.getAllUsers();
      return res.status(200).json({
        success: true,
        message: 'Users retrieved successfully',
        data: users
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Handles GET /api/users/:id
   * Retrieves a single user by ID.
   */
  getUserById = async (req, res, next) => {
    try {
      const { id } = req.params;

      if (!this.isPositiveInteger(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid user ID format. Must be a positive integer'
        });
      }

      const user = await userService.getUserById(Number(id));
      return res.status(200).json({
        success: true,
        message: 'User retrieved successfully',
        data: user
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Handles POST /api/users
   * Creates a new user.
   */
  createUser = async (req, res, next) => {
    try {
      const { name, email, password, role, department_id } = req.body;

      // Validate required fields
      if (name === undefined || name === null || typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Name is required, must be a string, and cannot be empty'
        });
      }
      if (email === undefined || email === null || typeof email !== 'string' || email.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Email is required, must be a string, and cannot be empty'
        });
      }
      if (password === undefined || password === null || typeof password !== 'string' || password.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Password is required, must be a string, and cannot be empty'
        });
      }

      // Check optional department_id format if provided
      if (department_id !== undefined && department_id !== null && !this.isPositiveInteger(department_id)) {
        return res.status(400).json({
          success: false,
          message: 'Department ID must be a positive integer or null'
        });
      }

      const newUser = await userService.createUser({
        name,
        email,
        password,
        role,
        department_id
      });

      return res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: newUser
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Handles PUT /api/users/:id
   * Updates user details.
   */
  updateUser = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { name, email, password, role, department_id } = req.body;

      if (!this.isPositiveInteger(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid user ID format. Must be a positive integer'
        });
      }

      // Check optional department_id format if provided
      if (department_id !== undefined && department_id !== null && !this.isPositiveInteger(department_id)) {
        return res.status(400).json({
          success: false,
          message: 'Department ID must be a positive integer or null'
        });
      }

      const updatedUser = await userService.updateUser(Number(id), {
        name,
        email,
        password,
        role,
        department_id
      });

      return res.status(200).json({
        success: true,
        message: 'User updated successfully',
        data: updatedUser
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Handles DELETE /api/users/:id
   * Deletes a user by ID.
   */
  deleteUser = async (req, res, next) => {
    try {
      const { id } = req.params;

      if (!this.isPositiveInteger(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid user ID format. Must be a positive integer'
        });
      }

      await userService.deleteUser(Number(id));

      return res.status(200).json({
        success: true,
        message: `User with ID ${id} was deleted successfully`
      });
    } catch (error) {
      next(error);
    }
  };
}

module.exports = new UserController();
