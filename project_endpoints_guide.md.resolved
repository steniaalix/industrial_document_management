# Industrial Document Management API Route Reference

This guide details all HTTP routes, methods, and requirement details implemented inside the backend codebase.

---

## 1. Summary of All Routes

Here is the master table of all registered API endpoints, organized by module.

| Module | Method | Endpoint Path | Description |
| :--- | :--- | :--- | :--- |
| **System** | `GET` | `/api/health` | Health check for Express API server |
| | `GET` | `/api/health/db` | Health check for MySQL Database connection |
| **Documents** | `POST` | `/api/documents` | Create a new document |
| | `GET` | `/api/documents` | Retrieve all documents |
| | `GET` | `/api/documents/:id` | Retrieve a specific document |
| | `PUT` | `/api/documents/:id` | Update document details |
| | `DELETE` | `/api/documents/:id` | Delete a document and its resources |
| **Versions** | `POST` | `/api/documents/:id/versions` | Upload a new document version |
| | `GET` | `/api/documents/:id/versions` | Retrieve version history for a document |
| | `GET` | `/api/documents/:id/versions/:versionId` | Retrieve details of a specific version |
| | `GET` | `/api/documents/:id/versions/:versionId/download` | Download a physical document file |
| **Review** | `POST` | `/api/documents/:id/submit-review` | Submit a draft document for review |
| **Approval** | `POST` | `/api/documents/:id/approve` | Approve a document and change status |
| **Rejections** | `POST` | `/api/documents/:id/versions/:versionId/reject` | Log a rejection for a document version |
| | `GET` | `/api/documents/:id/versions/:versionId/rejections` | Get rejection history for a version |

---

## 2. Detailed Route Requirements

### System Endpoints
#### `GET /api/health`
* **Description**: Verifies the backend server is running.
* **Requirements**: None.
* **Response Status**: `200 OK`.

#### `GET /api/health/db`
* **Description**: Verifies the MySQL connection is healthy by executing a quick query.
* **Requirements**: Active database server.
* **Response Status**: `200 OK` (Healthy), `500 Internal Server Error` (Disconnected).

---

### Document CRUD Endpoints
#### `POST /api/documents`
* **Description**: Creates a new document in the database.
* **Headers**: `Content-Type: application/json`
* **Request Body (JSON)**:
  ```json
  {
    "title": "Document Title",       // Required, String (1-200 chars)
    "description": "Optional text",  // Optional, String/Null
    "category_id": 1,                // Optional, Positive Integer/Null
    "department_id": 2,              // Optional, Positive Integer/Null
    "owner_id": 3,                   // Required, Positive Integer
    "status": "DRAFT"                // Optional, Default: 'DRAFT'. Values: DRAFT, UNDER_REVIEW, APPROVED, REJECTED, ARCHIVED
  }
  ```
* **Response Status**: `201 Created` (Success), `400 Bad Request` (Validation errors).

#### `GET /api/documents`
* **Description**: Retrieves a list of all documents.
* **Requirements**: None.
* **Response Status**: `200 OK`.

#### `GET /api/documents/:id`
* **Description**: Retrieves a specific document by its ID.
* **URL Params**: `id` (Required, Positive Integer).
* **Response Status**: `200 OK` (Success), `400 Bad Request` (Invalid ID), `404 Not Found`.

#### `PUT /api/documents/:id`
* **Description**: Updates basic information of a document.
* **URL Params**: `id` (Required, Positive Integer).
* **Headers**: `Content-Type: application/json`
* **Request Body (JSON)**: *All properties are optional.*
  ```json
  {
    "title": "Updated Title",
    "description": "Updated Description",
    "category_id": 1,
    "department_id": 2,
    "owner_id": 3,
    "status": "UNDER_REVIEW"
  }
  ```
* **Response Status**: `200 OK` (Success), `400 Bad Request` (Validation errors), `404 Not Found`.

#### `DELETE /api/documents/:id`
* **Description**: Deletes a document by ID (database foreign keys cascade deletes automatically).
* **URL Params**: `id` (Required, Positive Integer).
* **Response Status**: `200 OK` (Success), `400 Bad Request` (Invalid ID), `404 Not Found`.

---

### Document Version Endpoints
#### `POST /api/documents/:id/versions`
* **Description**: Uploads a new physical file as a version of the document.
* **URL Params**: `id` (Required, Positive Integer).
* **Headers**: `Content-Type: multipart/form-data`
* **Request Body (Form-Data)**:
  * `uploaded_by`: (Required, Positive Integer) ID of the user uploading the file.
  * `file`: (Required, File) The physical PDF, DOCX, or other industrial file.
* **Response Status**: `201 Created` (Success), `400 Bad Request` (No file or missing fields), `404 Not Found` (Document not found), `409 Conflict` (Duplicate version number due to parallel uploads).

#### `GET /api/documents/:id/versions`
* **Description**: Lists all uploaded versions of a document, sorted from newest to oldest.
* **URL Params**: `id` (Required, Positive Integer).
* **Response Status**: `200 OK` (Success), `404 Not Found` (Document not found).

#### `GET /api/documents/:id/versions/:versionId`
* **Description**: Retrieves details about a specific version.
* **URL Params**:
  * `id`: Document ID
  * `versionId`: Version ID
* **Response Status**: `200 OK` (Success), `404 Not Found` (Version doesn't exist for the document).

#### `GET /api/documents/:id/versions/:versionId/download`
* **Description**: Securely downloads the physical file associated with a version.
* **URL Params**:
  * `id`: Document ID
  * `versionId`: Version ID
* **Response Status**: `200 OK` (Initiates file transfer), `403 Forbidden` (Path traversal/security guard), `404 Not Found` (Database record or physical file missing).

---

### Review & Approval Endpoints
#### `POST /api/documents/:id/submit-review`
* **Description**: Submits a document from `DRAFT` or `REJECTED` status into review mode.
* **URL Params**: `id` (Required, Positive Integer).
* **Requirements**:
  * Document must currently be in `DRAFT` or `REJECTED` status.
  * Document must contain at least 1 version.
* **Response Status**: `200 OK` (Status updated to `UNDER_REVIEW`), `400 Bad Request` (Invalid status / no versions uploaded), `404 Not Found`.

#### `POST /api/documents/:id/approve`
* **Description**: Approves a document, transitioning its status to `APPROVED`.
* **URL Params**: `id` (Required, Positive Integer).
* **Headers**: `Content-Type: application/json`
* **Request Body (JSON)**:
  ```json
  {
    "approved_by": 2 // Required, Positive Integer
  }
  ```
* **Requirements**:
  * Document must currently be in `UNDER_REVIEW` status.
* **Response Status**: `200 OK` (Success), `400 Bad Request` (Invalid status / validation failed), `404 Not Found`.

---

### Rejection Endpoints
#### `POST /api/documents/:id/versions/:versionId/reject`
* **Description**: Rejects a specific version of a document, transitioning the document status to `REJECTED`.
* **URL Params**:
  * `id`: Document ID
  * `versionId`: Version ID
* **Headers**: `Content-Type: application/json`
* **Request Body (JSON)**:
  ```json
  {
    "rejected_by": 2,                 // Required, Positive Integer
    "reason": "Incorrect formatting"  // Required, String (1-1000 chars)
  }
  ```
* **Requirements**:
  * Document must currently be in `UNDER_REVIEW` status.
* **Response Status**: `201 Created` (Log created and status updated to `REJECTED`), `400 Bad Request` (Fails state rules / validation), `404 Not Found`.

#### `GET /api/documents/:id/versions/:versionId/rejections`
* **Description**: Retrieves history logs of all rejections for a specific version.
* **URL Params**:
  * `id`: Document ID
  * `versionId`: Version ID
* **Response Status**: `200 OK`, `400 Bad Request`, `404 Not Found`.
