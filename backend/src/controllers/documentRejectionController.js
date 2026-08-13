const documentRejectionService = require('../services/documentRejectionService');

/**
 * Controller to handle HTTP requests for the Document Rejection module.
 */
class DocumentRejectionController {
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
   * Handles POST /api/documents/:id/versions/:versionId/reject
   * Rejects a specific document version.
   */
  createRejection = async (req, res, next) => {
    try {
      const { id, versionId } = req.params;
      const { rejected_by, reason } = req.body;

      // 1. Validate URL Parameters
      if (!this.isPositiveInteger(id)) {
        return res.status(400).json({
          success: false,
          message: 'Document ID must be a positive integer'
        });
      }
      if (!this.isPositiveInteger(versionId)) {
        return res.status(400).json({
          success: false,
          message: 'Version ID must be a positive integer'
        });
      }

      // 2. Validate rejected_by
      if (rejected_by === undefined || rejected_by === null) {
        return res.status(400).json({
          success: false,
          message: 'Rejecter User ID (rejected_by) is required'
        });
      }
      if (!this.isPositiveInteger(rejected_by)) {
        return res.status(400).json({
          success: false,
          message: 'Rejecter User ID (rejected_by) must be a positive integer'
        });
      }

      // 3. Validate reason
      if (reason === undefined || reason === null) {
        return res.status(400).json({
          success: false,
          message: 'Rejection reason is required'
        });
      }
      if (typeof reason !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Rejection reason must be a string'
        });
      }
      
      const trimmedReason = reason.trim();
      if (trimmedReason === '') {
        return res.status(400).json({
          success: false,
          message: 'Rejection reason cannot be empty'
        });
      }
      if (trimmedReason.length > 1000) {
        return res.status(400).json({
          success: false,
          message: 'Rejection reason cannot exceed 1000 characters'
        });
      }

      const docId = Number(id);
      const verId = Number(versionId);
      const rejectedById = Number(rejected_by);

      // 4. Delegate to Service
      const rejection = await documentRejectionService.createRejection(
        docId,
        verId,
        rejectedById,
        trimmedReason
      );

      // 5. Send Response
      return res.status(201).json({
        success: true,
        message: 'Document version rejected successfully',
        data: rejection
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Handles GET /api/documents/:id/versions/:versionId/rejections
   * Retrieves all rejection logs for a specific document version.
   */
  getRejections = async (req, res, next) => {
    try {
      const { id, versionId } = req.params;

      // 1. Validate URL Parameters
      if (!this.isPositiveInteger(id)) {
        return res.status(400).json({
          success: false,
          message: 'Document ID must be a positive integer'
        });
      }
      if (!this.isPositiveInteger(versionId)) {
        return res.status(400).json({
          success: false,
          message: 'Version ID must be a positive integer'
        });
      }

      const docId = Number(id);
      const verId = Number(versionId);

      // 2. Fetch rejections from Service
      const rejections = await documentRejectionService.getRejectionsByVersion(docId, verId);

      // 3. Send Response
      return res.status(200).json({
        success: true,
        count: rejections.length,
        data: rejections
      });
    } catch (error) {
      next(error);
    }
  };
}

module.exports = new DocumentRejectionController();
