const categoryService = require('../services/categoryService');

/**
 * Controller to handle HTTP requests for the Category module.
 */
class CategoryController {
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
   * Handles GET /api/categories
   * Retrieves all categories, including their document count.
   */
  getAllCategories = async (req, res, next) => {
    try {
      const categories = await categoryService.getAllCategories();
      return res.status(200).json({
        success: true,
        message: 'Categories retrieved successfully',
        data: categories
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Handles GET /api/categories/:id
   * Retrieves a single category by ID.
   */
  getCategoryById = async (req, res, next) => {
    try {
      const { id } = req.params;

      if (!this.isPositiveInteger(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid category ID format. Must be a positive integer'
        });
      }

      const category = await categoryService.getCategoryById(Number(id));
      return res.status(200).json({
        success: true,
        message: 'Category retrieved successfully',
        data: category
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Handles POST /api/categories
   * Creates a new category.
   */
  createCategory = async (req, res, next) => {
    try {
      const { category_name, name, description } = req.body;
      const nameToUse = category_name !== undefined ? category_name : name;

      // Validate required fields
      if (nameToUse === undefined || nameToUse === null || typeof nameToUse !== 'string' || nameToUse.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Category name is required, must be a string, and cannot be empty'
        });
      }

      const newCategory = await categoryService.createCategory({
        name: nameToUse,
        description
      });

      return res.status(201).json({
        success: true,
        message: 'Category created successfully',
        data: newCategory
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Handles PUT /api/categories/:id
   * Updates category details.
   */
  updateCategory = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { category_name, name, description } = req.body;
      const nameToUse = category_name !== undefined ? category_name : name;

      if (!this.isPositiveInteger(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid category ID format. Must be a positive integer'
        });
      }

      const updatedCategory = await categoryService.updateCategory(Number(id), {
        name: nameToUse,
        description
      });

      return res.status(200).json({
        success: true,
        message: 'Category updated successfully',
        data: updatedCategory
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Handles DELETE /api/categories/:id
   * Deletes a category by ID.
   */
  deleteCategory = async (req, res, next) => {
    try {
      const { id } = req.params;

      if (!this.isPositiveInteger(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid category ID format. Must be a positive integer'
        });
      }

      await categoryService.deleteCategory(Number(id));

      return res.status(200).json({
        success: true,
        message: `Category with ID ${id} was deleted successfully`
      });
    } catch (error) {
      next(error);
    }
  };
}

module.exports = new CategoryController();
