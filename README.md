# InduDocs — Industrial Document Management System

InduDocs is a role-based **Industrial Document Management System** designed to manage operational documents through a controlled document lifecycle.

The system allows employees to create and submit documents, reviewers to inspect and approve/reject submitted documents, and administrators to manage users, categories, departments, and inspect the complete document registry.

The application implements document versioning, review history, role-based access control, workflow validation, relational data integrity, and a modern React-based interface.

---

## Features

### Authentication & Roles

InduDocs supports three primary roles:

| Role         | Responsibilities                                                                         |
| ------------ | ---------------------------------------------------------------------------------------- |
| **EMPLOYEE** | Create documents, upload versions, submit/resubmit documents for review                  |
| **REVIEWER** | Review submitted documents, reject documents with reasons, approve and archive documents |
| **ADMIN**    | Manage users, categories and departments; inspect all documents in read-only mode        |

Each user has a unique database `user_id`, which is displayed throughout the interface.

Example:

```text
John Doe (#4) · Employee
Bob Reviewer (#2) · Reviewer
Alice Admin (#1) · Admin
```

---

## Document Lifecycle

A document follows a controlled workflow:

```text
DRAFT
  │
  │ Submit for Review
  ▼
UNDER_REVIEW
  │
  ├───────────────┐
  │               │
  │ Reject        │ Approve
  ▼               ▼
REJECTED       ARCHIVED
  │
  │ Upload Revision
  │
  ▼
UNDER_REVIEW
```

### Typical workflow

1. Employee creates a document.
2. Employee uploads Version 1.
3. Employee submits the document for review.
4. Reviewer examines the document.
5. Reviewer either:

   * Rejects it with a reason, or
   * Approves and archives it.
6. If rejected, the employee uploads a new version.
7. Employee resubmits the document.
8. Reviewer reviews the new version.
9. Approved documents become archived.

---

## Core Features

### Employee

* Create documents
* View owned documents
* Upload document versions
* Submit documents for review
* View rejection reasons
* Upload revisions
* Resubmit rejected documents
* View complete version history

### Reviewer

* View documents awaiting review
* Inspect document metadata
* Download document versions
* View version history
* Reject documents with a reason
* Approve and archive documents

### Administrator

* Dashboard with system metrics
* User management

  * Create users
  * Edit users
  * Delete users
  * Search users
  * Assign roles
  * Assign departments
* Category management

  * Create
  * Edit
  * Delete
  * Search
* Department management

  * Create
  * Edit
  * Delete
  * View user/document counts
* Complete document registry
* Search and filtering
* Read-only document inspection
* User/document/category/department relationship visibility

---

## Version Management

Documents support multiple versions.

For example:

```text
Document: Ventilation Safety Audit

V2
 └── Uploaded by John Doe (#4)

V1
 ├── Uploaded by John Doe (#4)
 └── Rejected by Bob Reviewer (#2)
      Reason: Missing approval signatures
```

Previous versions are preserved rather than overwritten.

This allows reviewers and administrators to understand how a document evolved through the review process.

---

## Validation & Business Rules

The backend enforces important workflow rules rather than relying only on frontend button visibility.

Examples:

### Version requirement

A document cannot be submitted for review without at least one uploaded version.

```text
DRAFT + 0 versions
        ↓
     HTTP 400
```

### Review requirement

A reviewer cannot approve or reject a document that does not contain a valid document version.

### Workflow state validation

Invalid transitions are rejected by the backend.

Examples:

```text
ARCHIVED → APPROVE       ❌
ARCHIVED → REJECT        ❌
DRAFT → APPROVE          ❌
DRAFT → REJECT           ❌
DRAFT → SUBMIT (no V1)   ❌
```

### Role authorization

Protected workflow operations are restricted by role.

For example:

```text
EMPLOYEE → Approve       ❌ HTTP 403
EMPLOYEE → Reject        ❌ HTTP 403

REVIEWER → Approve       ✓
REVIEWER → Reject        ✓

ADMIN → Inspect          ✓
ADMIN → Approve          ❌
ADMIN → Reject           ❌
```

The Admin document interface is intentionally read-only.

---

## Technology Stack

### Frontend

* React
* Vite
* JavaScript
* CSS
* Fetch-based API communication

### Backend

* Node.js
* Express.js
* JavaScript
* MySQL
* REST APIs

### Database

* MySQL
* Relational schema
* Foreign keys
* ENUM-based role/status constraints
* Referential integrity

### Development

* npm
* Vite development server
* Express development server
* Browser-based E2E testing

---

## System Architecture

At a high level:

```text
┌──────────────────────────────┐
│          Browser             │
│                              │
│       React Frontend         │
│       Vite Development       │
└──────────────┬───────────────┘
               │
               │ HTTP / REST
               ▼
┌──────────────────────────────┐
│       Express Backend        │
│                              │
│ Routes                       │
│    ↓                         │
│ Controllers                  │
│    ↓                         │
│ Services                     │
│    ↓                         │
│ Database Queries             │
└──────────────┬───────────────┘
               │
               │ SQL
               ▼
┌──────────────────────────────┐
│          MySQL               │
│                              │
│ users                        │
│ documents                    │
│ document_versions            │
│ categories                   │
│ departments                  │
│ review/history data          │
└──────────────────────────────┘
```

For a detailed explanation, see:

`docs/ARCHITECTURE.md`

---

## Backend Structure

The backend follows a lightweight layered architecture:

```text
backend/
└── src/
    ├── app.js
    ├── routes/
    │   ├── userRoutes.js
    │   ├── departmentRoutes.js
    │   └── ...
    │
    ├── controllers/
    │   ├── userController.js
    │   ├── departmentController.js
    │   └── ...
    │
    └── services/
        ├── userService.js
        ├── departmentService.js
        ├── documentReviewService.js
        ├── documentApprovalService.js
        └── ...
```

The basic request flow is:

```text
HTTP Request
     ↓
Route
     ↓
Controller
     ↓
Service
     ↓
MySQL
     ↓
Service
     ↓
Controller
     ↓
JSON Response
```

---

## Frontend Structure

The frontend is implemented using React.

Conceptually:

```text
frontend/
├── src/
│   ├── App.jsx
│   ├── api.js
│   └── ...
│
├── package.json
└── vite.config.js
```

`App.jsx` currently manages the major application views and role-specific interfaces, while `api.js` provides reusable communication with the backend.

---

## API Overview

### Authentication

```http
POST /api/auth/login
```

Used for local development authentication.

---

### Users

```http
GET    /api/users
GET    /api/users/:id
POST   /api/users
PUT    /api/users/:id
DELETE /api/users/:id
```

---

### Departments

```http
GET    /api/departments
GET    /api/departments/:id
POST   /api/departments
PUT    /api/departments/:id
DELETE /api/departments/:id
```

---

### Documents

The document API supports operations for:

* Creating documents
* Retrieving documents
* Uploading versions
* Submitting for review
* Rejecting versions
* Approving documents
* Archiving documents

The exact endpoint definitions are maintained in the backend route modules.

---

## Database Relationships

The database uses relational foreign keys to maintain consistency.

Important relationships include:

```text
departments
     │
     ├──────── users
     │
     └──────── documents

users
  │
  ├──────── documents
  │
  └──────── document_versions

documents
     │
     └──────── document_versions

categories
     │
     └──────── documents
```

Department deletion uses:

```sql
ON DELETE SET NULL
```

Therefore deleting a department does not delete its users or documents.

Instead:

```text
department_id → NULL
```

The frontend displays such relationships as:

```text
Unassigned
```

---

## Installation

### Prerequisites

Install:

* Node.js
* npm
* MySQL

Verify:

```bash
node --version
npm --version
mysql --version
```

---

## Backend Setup

Navigate to the backend:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Configure the database connection using the project's environment configuration.

Then start the backend:

```bash
npm run dev
```

The backend runs locally on:

```text
http://localhost:5000
```

---

## Frontend Setup

Open another terminal:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Vite will provide the local frontend URL, typically:

```text
http://localhost:5173
```

---

## Production Build

To create a production frontend build:

```bash
cd frontend
npm run build
```

A successful build produces the `dist/` directory.

---

## Demo Accounts

The current local development database contains these demo accounts:

| User             | Email                 | Role     | ID |
| ---------------- | --------------------- | -------- | -: |
| Alice Admin      | `alice@example.com`   | ADMIN    |  1 |
| Bob Reviewer     | `bob@indudocs.com`    | REVIEWER |  2 |
| Charlie Employee | `charlie@example.com` | EMPLOYEE |  3 |
| John Doe         | `john@indudocs.com`   | EMPLOYEE |  4 |

These credentials are intended for the local demonstration environment.

---

## Testing

The system has been tested through:

### Functional testing

* User CRUD
* Category CRUD
* Department CRUD
* Document creation
* Version upload
* Review submission
* Rejection
* Resubmission
* Approval
* Archive

### Role testing

* Admin
* Reviewer
* Employee

### Workflow testing

The complete lifecycle was tested:

```text
Employee
   ↓
Create
   ↓
Upload V1
   ↓
Submit
   ↓
Reviewer
   ↓
Reject
   ↓
Employee
   ↓
Upload V2
   ↓
Resubmit
   ↓
Reviewer
   ↓
Approve
   ↓
Archive
   ↓
Admin Inspection
```

### API validation

Invalid state transitions and unauthorized operations were tested.

Examples include:

```text
HTTP 400 — Invalid workflow transition
HTTP 400 — Missing required document version
HTTP 403 — Unauthorized role
HTTP 404 — Resource not found
```

### Build verification

The production frontend build has been successfully verified using:

```bash
npm run build
```

---

## Security Considerations

This project is currently designed primarily as a **local development / academic demonstration system**.

The current authentication implementation uses local credentials and is intentionally simplified.

For production deployment, the following should be implemented:

* Password hashing using Argon2 or bcrypt
* JWT or secure server-side sessions
* HTTP-only secure cookies where appropriate
* CSRF protection
* Rate limiting
* Strong password policies
* Input sanitization
* HTTPS
* Secret management
* Audit logging
* Production-grade file storage
* File type/content validation
* Malware scanning for uploaded documents
* Fine-grained authorization middleware

Passwords must never be stored as plaintext in a production system.

---

## Future Improvements

Potential future improvements include:

* JWT/session-based authentication
* Password hashing
* Password reset
* Email notifications
* Advanced audit logs
* Full-text document search
* Document preview
* PDF viewer
* Digital signatures
* Approval chains
* Multi-level review workflows
* File storage using S3-compatible storage
* Document retention policies
* Activity dashboard
* Advanced reporting
* Automated document expiry
* Docker deployment
* CI/CD pipeline
* Automated unit/integration tests

---

## Project Goals

The primary goals of InduDocs are:

1. Centralize industrial documentation.
2. Provide controlled document workflows.
3. Maintain document version history.
4. Separate employee, reviewer, and administrator responsibilities.
5. Preserve relational data integrity.
6. Prevent invalid workflow transitions.
7. Provide administrators with complete system visibility.
8. Provide a foundation that can be extended into a production document-management platform.

---

## Project Status

**Current status: Functional local development / academic project**

The core workflow and role-based functionality have been implemented and end-to-end tested.

```text
Authentication             ✓
Role-based UI              ✓
Document management        ✓
Document versioning        ✓
Review workflow             ✓
Rejection/resubmission      ✓
Approval/archive            ✓
User management             ✓
Category management         ✓
Department management       ✓
Admin registry              ✓
API validation              ✓
E2E workflow testing        ✓
Production build            ✓
```

---

## License

This project is currently intended for educational and demonstration purposes.
