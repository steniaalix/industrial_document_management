const express = require('express');
const router = express.Router();
const documentReviewController = require('../controllers/documentReviewController');

// POST /api/documents/:id/submit-review - Submits a DRAFT document to UNDER_REVIEW
router.post('/:id/submit-review', documentReviewController.submitForReview);

module.exports = router;
