const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/departmentController');

// Route definitions for the Department Management module

// GET /api/departments - Retrieve all departments
router.get('/', departmentController.getAllDepartments);

// GET /api/departments/:id - Retrieve a single department by ID
router.get('/:id', departmentController.getDepartmentById);

// POST /api/departments - Create a new department
router.post('/', departmentController.createDepartment);

// PUT /api/departments/:id - Update department details
router.put('/:id', departmentController.updateDepartment);

// DELETE /api/departments/:id - Delete a department by ID
router.delete('/:id', departmentController.deleteDepartment);

module.exports = router;
