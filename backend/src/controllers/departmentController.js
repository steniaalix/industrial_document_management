const departmentService = require('../services/departmentService');

/**
 * Controller to handle HTTP requests for the Department module.
 */
class DepartmentController {
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
   * Handles GET /api/departments
   * Retrieves all departments, including user and document counts.
   */
  getAllDepartments = async (req, res, next) => {
    try {
      const departments = await departmentService.getAllDepartments();
      return res.status(200).json({
        success: true,
        message: 'Departments retrieved successfully',
        data: departments
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Handles GET /api/departments/:id
   * Retrieves a single department by ID.
   */
  getDepartmentById = async (req, res, next) => {
    try {
      const { id } = req.params;

      if (!this.isPositiveInteger(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid department ID format. Must be a positive integer'
        });
      }

      const department = await departmentService.getDepartmentById(Number(id));
      return res.status(200).json({
        success: true,
        message: 'Department retrieved successfully',
        data: department
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Handles POST /api/departments
   * Creates a new department.
   */
  createDepartment = async (req, res, next) => {
    try {
      const { name, description } = req.body;

      // Validate required fields
      if (name === undefined || name === null || typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Department name is required, must be a string, and cannot be empty'
        });
      }

      const newDept = await departmentService.createDepartment({
        name,
        description
      });

      return res.status(201).json({
        success: true,
        message: 'Department created successfully',
        data: newDept
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Handles PUT /api/departments/:id
   * Updates department details.
   */
  updateDepartment = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { name, description } = req.body;

      if (!this.isPositiveInteger(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid department ID format. Must be a positive integer'
        });
      }

      // If name is passed but is invalid
      if (name !== undefined && (name === null || typeof name !== 'string' || name.trim() === '')) {
        return res.status(400).json({
          success: false,
          message: 'Department name is required, must be a string, and cannot be empty'
        });
      }

      const updatedDept = await departmentService.updateDepartment(Number(id), {
        name,
        description
      });

      return res.status(200).json({
        success: true,
        message: 'Department updated successfully',
        data: updatedDept
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Handles DELETE /api/departments/:id
   * Deletes a department by ID.
   */
  deleteDepartment = async (req, res, next) => {
    try {
      const { id } = req.params;

      if (!this.isPositiveInteger(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid department ID format. Must be a positive integer'
        });
      }

      await departmentService.deleteDepartment(Number(id));

      return res.status(200).json({
        success: true,
        message: 'Department deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  };
}

module.exports = new DepartmentController();
