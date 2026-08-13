const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure that the uploads directory exists
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage Configuration: defines destination directory and unique filename generation
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate a unique suffix using timestamp and random number
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    // Extract the original file extension (e.g. '.pdf' or '.docx')
    const ext = path.extname(file.originalname).toLowerCase();
    // Combine to form a unique filename (e.g. 'file-1672531199000-836283921.pdf')
    cb(null, `file-${uniqueSuffix}${ext}`);
  }
});

// File Filter Configuration: restricts uploads only to PDF and DOCX formats
const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.pdf', '.docx'];
  const allowedMimeTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  const ext = path.extname(file.originalname).toLowerCase();
  const mimeType = file.mimetype;

  if (allowedExtensions.includes(ext) && allowedMimeTypes.includes(mimeType)) {
    // File accepted
    cb(null, true);
  } else {
    // Create a client-friendly 400 Bad Request error
    const error = new Error('Invalid file type. Only PDF and DOCX files are allowed.');
    error.status = 400;
    cb(error, false);
  }
};

// Initialize Multer instance with the configured storage, file filter, and size limits
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10 MB limit in bytes
  }
});

module.exports = upload;
