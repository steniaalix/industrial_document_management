const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const documentVersionController = require('../controllers/documentVersionController');

// POST /api/documents/:id/versions - Upload a new document version (expects multipart/form-data with a 'file' field)
router.post('/:id/versions', upload.single('file'), documentVersionController.uploadVersion);

// GET /api/documents/:id/versions - Retrieve all versions for a document, sorted newest first
router.get('/:id/versions', documentVersionController.getVersions);

// GET /api/documents/:id/versions/:versionId - Retrieve details of a specific version of a document
router.get('/:id/versions/:versionId', documentVersionController.getVersionById);

// GET /api/documents/:id/versions/:versionId/download - Download the physical file of a specific document version
router.get('/:id/versions/:versionId/download', documentVersionController.downloadVersion);

module.exports = router;
