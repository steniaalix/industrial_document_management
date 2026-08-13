const path = require('path');
const fs = require('fs');
const documentVersionService = require('../services/documentVersionService');

/**
 * Controller to handle HTTP requests for the Document Version module.
 */
class DocumentVersionController {
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
   * Handles POST /api/documents/:id/versions
   * Uploads a new document version.
   */
  uploadVersion = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { uploaded_by } = req.body;

      // 1. Validate document ID
      if (!this.isPositiveInteger(id)) {
        return res.status(400).json({
          success: false,
          message: 'Document ID must be a positive integer'
        });
      }

      // 2. Validate uploaded_by
      if (uploaded_by === undefined || uploaded_by === null) {
        return res.status(400).json({
          success: false,
          message: 'Uploader User ID (uploaded_by) is required in req.body'
        });
      }
      if (!this.isPositiveInteger(uploaded_by)) {
        return res.status(400).json({
          success: false,
          message: 'Uploader User ID (uploaded_by) must be a positive integer'
        });
      }

      // 3. Verify file was uploaded
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file provided. Please upload a file with field name "file"'
        });
      }

      const docId = Number(id);
      const uploadedBy = Number(uploaded_by);

      // 4. Delegate to Service
      const newVersion = await documentVersionService.createVersion(docId, uploadedBy, req.file);

      // 5. Send Success Response
      return res.status(201).json({
        success: true,
        message: 'Document version uploaded successfully',
        data: newVersion
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Handles GET /api/documents/:id/versions
   * Retrieves all versions for a specific document.
   */
  getVersions = async (req, res, next) => {
    try {
      const { id } = req.params;

      // Validate document ID
      if (!this.isPositiveInteger(id)) {
        return res.status(400).json({
          success: false,
          message: 'Document ID must be a positive integer'
        });
      }

      const docId = Number(id);

      // Fetch versions from Service (throws 404 if document doesn't exist)
      const versions = await documentVersionService.getVersionsByDocumentId(docId);

      return res.status(200).json({
        success: true,
        count: versions.length,
        data: versions
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Handles GET /api/documents/:id/versions/:versionId
   * Retrieves a specific version belonging to a specific document.
   */
  getVersionById = async (req, res, next) => {
    try {
      const { id, versionId } = req.params;

      // Validate both IDs
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

      // Retrieve from Service
      const version = await documentVersionService.getVersionById(docId, verId);

      if (!version) {
        return res.status(404).json({
          success: false,
          message: `Document version with ID ${versionId} not found for document with ID ${id}`
        });
      }

      return res.status(200).json({
        success: true,
        data: version
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Handles GET /api/documents/:id/versions/:versionId/download
   * Downloads the physical file for a specific document version.
   */
  downloadVersion = async (req, res, next) => {
    try {
      const { id, versionId } = req.params;

      // 1. Validate document ID
      if (!this.isPositiveInteger(id)) {
        return res.status(400).json({
          success: false,
          message: 'Document ID must be a positive integer'
        });
      }

      // 2. Validate version ID
      if (!this.isPositiveInteger(versionId)) {
        return res.status(400).json({
          success: false,
          message: 'Version ID must be a positive integer'
        });
      }

      const docId = Number(id);
      const verId = Number(versionId);

      // 3. Query the service for the file details
      const version = await documentVersionService.getVersionFile(docId, verId);

      // Case 2: Document/version does not exist
      if (!version) {
        return res.status(404).json({
          success: false,
          message: 'Document version not found'
        });
      }

      // 4. Resolve absolute path and prevent path traversal
      const uploadDir = path.resolve(__dirname, '../../uploads');
      const filename = path.basename(version.file_path);
      const resolvedPath = path.resolve(uploadDir, filename);

      // Guard check: verify the file is strictly within the uploads folder
      if (!resolvedPath.startsWith(uploadDir)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: Invalid file path path'
        });
      }

      // Case 3: Database record exists but physical file is missing
      if (!fs.existsSync(resolvedPath)) {
        return res.status(404).json({
          success: false,
          message: 'Physical file could not be found on the server'
        });
      }

      // Case 1: Document/version exists and physical file exists
      return res.download(resolvedPath, version.file_name, (err) => {
        if (err) {
          if (res.headersSent) {
            return next(err);
          }
          next(err);
        }
      });
    } catch (error) {
      next(error);
    }
  };
}

module.exports = new DocumentVersionController();
