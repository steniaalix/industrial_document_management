const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');

// Route definitions for the Document module

// POST /api/documents - Create a new document
router.post('/', documentController.createDocument);

// GET /api/documents - Retrieve all documents
router.get('/', documentController.getAllDocuments);

// GET /api/documents/:id - Retrieve a single document by ID
router.get('/:id', documentController.getDocumentById);

// PUT /api/documents/:id - Update basic fields of a document by ID
router.put('/:id', documentController.updateDocument);

// DELETE /api/documents/:id - Delete a document by ID
router.delete('/:id', documentController.deleteDocument);

module.exports = router;
