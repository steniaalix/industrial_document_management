const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Route definitions for the User Management module

// GET /api/users - Retrieve all users (excluding passwords)
router.get('/', userController.getAllUsers);

// GET /api/users/:id - Retrieve a single user by ID (excluding password)
router.get('/:id', userController.getUserById);

// POST /api/users - Create a new user
router.post('/', userController.createUser);

// PUT /api/users/:id - Update user details
router.put('/:id', userController.updateUser);

// DELETE /api/users/:id - Delete a user by ID
router.delete('/:id', userController.deleteUser);

module.exports = router;
