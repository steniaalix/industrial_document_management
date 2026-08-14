const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');

// Route definitions for the Category Management module

// GET /api/categories - Retrieve all categories
router.get('/', categoryController.getAllCategories);

// GET /api/categories/:id - Retrieve a single category by ID
router.get('/:id', categoryController.getCategoryById);

// POST /api/categories - Create a new category
router.post('/', categoryController.createCategory);

// PUT /api/categories/:id - Update category details
router.put('/:id', categoryController.updateCategory);

// DELETE /api/categories/:id - Delete a category by ID
router.delete('/:id', categoryController.deleteCategory);

module.exports = router;
