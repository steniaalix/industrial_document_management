const documentService = require('../services/documentService');

/**
 * Controller to handle HTTP requests for the Document module.
 */
class DocumentController {
  /**
   * Helper to validate that a string is a positive integer.
   * @param {*} val - Value to test
   * @returns {boolean} True if it is a positive integer
   */
  isPositiveInteger(val) {
    const num = Number(val);
    return Number.isInteger(num) && num > 0;
  }

  /**
   * Helper to validate status value against the database ENUM.
   * @param {string} status - The status string to check
   * @returns {boolean} True if valid status
   */
  isValidStatus(status) {
    const validStatuses = ['DRAFT', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'ARCHIVED'];
    return validStatuses.includes(status);
  }

  /**
   * Handles POST /api/documents
   * Creates a new document.
   */
  createDocument = async (req, res, next) => {
    try {
      const { title, description, category_id, department_id, owner_id, status } = req.body;

      // 1. Validation for Required Fields
      if (title === undefined || title === null || typeof title !== 'string' || title.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Title is required, must be a string, and cannot be empty'
        });
      }
      if (title.length > 200) {
        return res.status(400).json({
          success: false,
          message: 'Title cannot exceed 200 characters'
        });
      }

      if (owner_id === undefined || owner_id === null) {
        return res.status(400).json({
          success: false,
          message: 'Owner ID (owner_id) is required'
        });
      }
      if (!this.isPositiveInteger(owner_id)) {
        return res.status(400).json({
          success: false,
          message: 'Owner ID must be a positive integer'
        });
      }

      // 2. Validation for Optional Fields (if provided)
      if (category_id !== undefined && category_id !== null && !this.isPositiveInteger(category_id)) {
        return res.status(400).json({
          success: false,
          message: 'Category ID must be a positive integer or null'
        });
      }

      if (department_id !== undefined && department_id !== null && !this.isPositiveInteger(department_id)) {
        return res.status(400).json({
          success: false,
          message: 'Department ID must be a positive integer or null'
        });
      }

      if (status !== undefined && status !== null && !this.isValidStatus(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status value. Must be one of: DRAFT, UNDER_REVIEW, APPROVED, REJECTED, ARCHIVED'
        });
      }

      // 3. Call Service
      const newDoc = await documentService.createDocument({
        title: title.trim(),
        description: description ? description.trim() : null,
        category_id: category_id || null,
        department_id: department_id || null,
        owner_id,
        status: status || 'DRAFT'
      });

      // 4. Return Response
      return res.status(201).json({
        success: true,
        message: 'Document created successfully',
        data: newDoc
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Handles GET /api/documents
   * Retrieves all documents.
   */
  getAllDocuments = async (req, res, next) => {
    try {
      const documents = await documentService.getAllDocuments();
      return res.status(200).json({
        success: true,
        count: documents.length,
        data: documents
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Handles GET /api/documents/:id
   * Retrieves a specific document by its ID.
   */
  getDocumentById = async (req, res, next) => {
    try {
      const { id } = req.params;

      if (!this.isPositiveInteger(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid document ID format. Must be a positive integer'
        });
      }

      const document = await documentService.getDocumentById(Number(id));
      if (!document) {
        return res.status(404).json({
          success: false,
          message: `Document with ID ${id} not found`
        });
      }

      return res.status(200).json({
        success: true,
        data: document
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Handles PUT /api/documents/:id
   * Updates only the basic fields of a document.
   */
  updateDocument = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { title, description, category_id, department_id, owner_id, status } = req.body;

      // 1. Validate ID
      if (!this.isPositiveInteger(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid document ID format. Must be a positive integer'
        });
      }

      const docId = Number(id);

      // Check if document exists first
      const existingDoc = await documentService.getDocumentById(docId);
      if (!existingDoc) {
        return res.status(404).json({
          success: false,
          message: `Document with ID ${id} not found`
        });
      }

      // 2. Validate update fields (if provided)
      const updates = {};

      if (title !== undefined) {
        if (title === null || typeof title !== 'string' || title.trim() === '') {
          return res.status(400).json({
            success: false,
            message: 'Title must be a non-empty string'
          });
        }
        if (title.length > 200) {
          return res.status(400).json({
            success: false,
            message: 'Title cannot exceed 200 characters'
          });
        }
        updates.title = title.trim();
      }

      if (description !== undefined) {
        updates.description = description ? description.trim() : null;
      }

      if (category_id !== undefined) {
        if (category_id !== null && !this.isPositiveInteger(category_id)) {
          return res.status(400).json({
            success: false,
            message: 'Category ID must be a positive integer or null'
          });
        }
        updates.category_id = category_id;
      }

      if (department_id !== undefined) {
        if (department_id !== null && !this.isPositiveInteger(department_id)) {
          return res.status(400).json({
            success: false,
            message: 'Department ID must be a positive integer or null'
          });
        }
        updates.department_id = department_id;
      }

      if (owner_id !== undefined) {
        if (!this.isPositiveInteger(owner_id)) {
          return res.status(400).json({
            success: false,
            message: 'Owner ID must be a positive integer'
          });
        }
        updates.owner_id = owner_id;
      }

      if (status !== undefined) {
        if (status === null || !this.isValidStatus(status)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid status value. Must be one of: DRAFT, UNDER_REVIEW, APPROVED, REJECTED, ARCHIVED'
          });
        }
        updates.status = status;
      }

      // 3. Call Service
      const updatedDoc = await documentService.updateDocument(docId, updates);

      return res.status(200).json({
        success: true,
        message: 'Document updated successfully',
        data: updatedDoc
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Handles DELETE /api/documents/:id
   * Deletes a document by ID (database foreign keys cascade deletes automatically).
   */
  deleteDocument = async (req, res, next) => {
    try {
      const { id } = req.params;

      if (!this.isPositiveInteger(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid document ID format. Must be a positive integer'
        });
      }

      const docId = Number(id);

      // Check if document exists first
      const existingDoc = await documentService.getDocumentById(docId);
      if (!existingDoc) {
        return res.status(404).json({
          success: false,
          message: `Document with ID ${id} not found`
        });
      }

      // Execute delete operation
      await documentService.deleteDocument(docId);

      return res.status(200).json({
        success: true,
        message: `Document with ID ${id} was deleted successfully`
      });
    } catch (error) {
      next(error);
    }
  };
}

module.exports = new DocumentController();
