const express = require('express');
const router = express.Router();
const documentRejectionController = require('../controllers/documentRejectionController');

// POST /api/documents/:id/versions/:versionId/reject - Log a rejection for a specific version
router.post('/:id/versions/:versionId/reject', documentRejectionController.createRejection);

// GET /api/documents/:id/versions/:versionId/rejections - Retrieve rejection history for a version
router.get('/:id/versions/:versionId/rejections', documentRejectionController.getRejections);

module.exports = router;
