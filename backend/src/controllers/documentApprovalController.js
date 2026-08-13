const documentApprovalService = require('../services/documentApprovalService');

/**
 * Controller to handle HTTP requests for the Document Approval module.
 */
class DocumentApprovalController {
  /**
   * Helper to validate that a value is a positive integer.
   * @param {*} val - Value to test
   * @returns {boolean} True if it is a positive integer
   */
  isPositiveInteger(val) {
    const num = Number(val);
    return Number.isInteger(num) && num > 0;
  }

  /**
   * Handles POST /api/documents/:id/approve
   * Approves a document and transitions its status.
   */
  approveDocument = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { approved_by } = req.body;

      // 1. Validate Document ID
      if (!this.isPositiveInteger(id)) {
        return res.status(400).json({
          success: false,
          message: 'Document ID must be a positive integer'
        });
      }

      // 2. Validate approved_by
      if (approved_by === undefined || approved_by === null) {
        return res.status(400).json({
          success: false,
          message: 'Approving User ID (approved_by) is required'
        });
      }
      if (!this.isPositiveInteger(approved_by)) {
        return res.status(400).json({
          success: false,
          message: 'Approving User ID (approved_by) must be a positive integer'
        });
      }

      const docId = Number(id);
      const approvedById = Number(approved_by);

      // 3. Delegate business logic and status transition to service
      const updatedDoc = await documentApprovalService.approveDocument(docId, approvedById);

      // 4. Return success response
      return res.status(200).json({
        success: true,
        message: 'Document approved and archived successfully',
        data: updatedDoc
      });
    } catch (error) {
      next(error);
    }
  };
}

module.exports = new DocumentApprovalController();
