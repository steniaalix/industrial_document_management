const documentReviewService = require('../services/documentReviewService');

/**
 * Controller to handle HTTP requests for submitting documents for review.
 */
class DocumentReviewController {
  /**
   * Helper to validate that a string/number is a positive integer.
   * @param {*} val - Value to test
   * @returns {boolean} True if it is a positive integer
   */
  isPositiveInteger(val) {
    const num = Number(val);
    return Number.isInteger(num) && num > 0;
  }

  /**
   * Handles POST /api/documents/:id/submit-review
   * Submits a DRAFT document for review.
   */
  submitForReview = async (req, res, next) => {
    try {
      const { id } = req.params;

      // 1. Validate Document ID
      if (!this.isPositiveInteger(id)) {
        return res.status(400).json({
          success: false,
          message: 'Document ID must be a positive integer'
        });
      }

      const docId = Number(id);

      // 2. Delegate to Service
      const updatedDoc = await documentReviewService.submitForReview(docId);

      // 3. Return Success Response
      return res.status(200).json({
        success: true,
        message: 'Document submitted for review successfully',
        data: updatedDoc
      });
    } catch (error) {
      next(error);
    }
  };
}

module.exports = new DocumentReviewController();
