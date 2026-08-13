const express = require('express');
const router = express.Router();
const documentApprovalController = require('../controllers/documentApprovalController');

// POST /api/documents/:id/approve - Approves and archives a document under review
router.post('/:id/approve', documentApprovalController.approveDocument);

module.exports = router;
