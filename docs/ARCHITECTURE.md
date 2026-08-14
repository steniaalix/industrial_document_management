# InduDocs System Architecture

## 1. Overview

InduDocs is a web-based Industrial Document Management System built around a three-layer application architecture:

```text
Presentation Layer
       ↓
Application/API Layer
       ↓
Data Layer
```

The system consists of:

* React frontend
* Express.js backend
* MySQL database

The architecture is designed to separate user-interface concerns from business logic and database operations.

---

# 2. High-Level Architecture

```text
                         ┌─────────────────────┐
                         │       USERS         │
                         │                     │
                         │ Admin / Reviewer /  │
                         │ Employee            │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │      Browser        │
                         │                     │
                         │   React Frontend    │
                         │       + Vite        │
                         └──────────┬──────────┘
                                    │
                              HTTP / JSON
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │   Express Backend   │
                         │                     │
                         │       Routes        │
                         │          ↓          │
                         │     Controllers     │
                         │          ↓          │
                         │       Services      │
                         └──────────┬──────────┘
                                    │
                                   SQL
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │       MySQL         │
                         │                     │
                         │ Users               │
                         │ Documents           │
                         │ Versions            │
                         │ Categories          │
                         │ Departments         │
                         │ Review information  │
                         └─────────────────────┘
```

---

# 3. Frontend Architecture

The frontend is responsible for:

* Rendering application views.
* Maintaining UI state.
* Displaying role-specific interfaces.
* Collecting user input.
* Calling backend APIs.
* Displaying success/error states.
* Filtering and searching data locally where appropriate.

The major frontend components are currently organized around the main React application.

```text
frontend/
│
├── src/
│   ├── App.jsx
│   ├── api.js
│   └── ...
│
├── package.json
└── vite.config.js
```

---

# 4. React Application

`App.jsx` acts as the main application shell.

It manages concepts such as:

```text
currentUser
currentView
documents
users
categories
departments
loading states
error states
form states
modal states
```

The current view is determined by application state.

Conceptually:

```javascript
currentView
     │
     ├── dashboard
     ├── documents
     ├── document_details
     ├── create_document
     ├── users
     ├── categories
     └── departments
```

Role-specific rendering determines which views and actions are available.

---

# 5. Role-Based Frontend Architecture

The three roles have different responsibilities.

```text
                    InduDocs
                       │
          ┌────────────┼────────────┐
          │            │            │
       EMPLOYEE     REVIEWER       ADMIN
          │            │            │
          ▼            ▼            ▼
      Documents      Review       Management
      Creation       Queue        Dashboard
      Upload         Approve      Users
      Submit         Reject       Categories
      Resubmit       Archive      Departments
                                  Documents
                                  Read-only
```

---

# 6. Employee Architecture

Employees are responsible for document creation and submission.

```text
Employee
   │
   ├── Create Document
   │
   ├── Upload Version
   │
   ├── Submit for Review
   │
   ├── View Review Result
   │
   ├── Upload Revision
   │
   └── Resubmit
```

Employees cannot approve or reject documents.

---

# 7. Reviewer Architecture

Reviewers handle submitted documents.

```text
Reviewer
   │
   ├── View Review Queue
   │
   ├── Open Document
   │
   ├── Inspect Versions
   │
   ├── Download Version
   │
   ├── Reject
   │     └── Reason
   │
   └── Approve & Archive
```

The reviewer cannot perform administrative CRUD operations.

---

# 8. Administrator Architecture

Administrators provide system-level management and inspection.

```text
Admin
 │
 ├── Dashboard
 │    ├── User metrics
 │    ├── Document metrics
 │    ├── Recent activity
 │    └── Status distribution
 │
 ├── Users
 │    ├── Create
 │    ├── Search
 │    ├── Edit
 │    └── Delete
 │
 ├── Categories
 │    ├── Create
 │    ├── Search
 │    ├── Edit
 │    └── Delete
 │
 ├── Departments
 │    ├── Create
 │    ├── Search
 │    ├── Edit
 │    └── Delete
 │
 └── Documents
      ├── Search
      ├── Filter
      └── Read-only inspection
```

Administrators intentionally cannot approve, reject, submit, or upload document versions.

---

# 9. API Layer

The backend exposes REST APIs.

The request pipeline follows:

```text
HTTP Request
     │
     ▼
Route
     │
     ▼
Controller
     │
     ▼
Service
     │
     ▼
Database
```

The response travels in the opposite direction:

```text
Database
     │
     ▼
Service
     │
     ▼
Controller
     │
     ▼
JSON Response
     │
     ▼
React Frontend
```

---

# 10. Route Layer

Routes define the HTTP interface.

Examples:

```text
/api/auth
/api/users
/api/departments
/api/documents
```

Example:

```http
GET /api/users
```

is mapped to a user controller function.

The route layer should remain thin and should not contain significant business logic.

---

# 11. Controller Layer

Controllers handle HTTP-specific concerns.

Responsibilities include:

* Reading request parameters.
* Reading request bodies.
* Validating basic request structure.
* Calling services.
* Returning HTTP status codes.
* Formatting JSON responses.

Example flow:

```text
POST /api/users
       │
       ▼
userController.createUser()
       │
       ▼
userService.createUser()
```

Controllers should not contain large amounts of SQL/business logic.

---

# 12. Service Layer

Services contain application/business logic.

Examples:

```text
userService.js
departmentService.js
documentReviewService.js
documentApprovalService.js
```

The service layer is responsible for rules such as:

```text
Can this user be deleted?

Does this department exist?

Can this document be submitted?

Does this document have a version?

Can this reviewer approve this document?

Is this workflow transition valid?
```

This separation makes business rules easier to test and maintain.

---

# 13. Database Architecture

MySQL provides persistent storage.

The major conceptual entities are:

```text
USER
DOCUMENT
DOCUMENT_VERSION
CATEGORY
DEPARTMENT
REVIEW / WORKFLOW DATA
```

---

# 14. Entity Relationships

A simplified relationship model is:

```text
                 ┌──────────────┐
                 │ DEPARTMENT   │
                 └──────┬───────┘
                        │
              ┌─────────┴─────────┐
              │                   │
              ▼                   ▼
        ┌───────────┐       ┌────────────┐
        │   USERS   │       │ DOCUMENTS  │
        └─────┬─────┘       └──────┬─────┘
              │                    │
              │                    │
              │                    ▼
              │            ┌──────────────────┐
              │            │ DOCUMENT_VERSIONS│
              │            └──────────────────┘
              │
              │
              └─────────────── ownership /
                              upload relationships


        ┌────────────┐
        │ CATEGORIES │
        └──────┬─────┘
               │
               ▼
          DOCUMENTS
```

---

# 15. User Entity

Users contain information such as:

```text
user_id
name
email
password
role
department_id
```

Roles are restricted to:

```text
EMPLOYEE
REVIEWER
ADMIN
```

The `user_id` uniquely identifies each account.

The UI exposes this ID to make relationships explicit.

Example:

```text
John Doe (#4)
Bob Reviewer (#2)
Alice Admin (#1)
```

---

# 16. Department Relationship

Users and documents may belong to departments.

Conceptually:

```text
Department 1
Engineering
     │
     ├── User
     ├── User
     └── Document
```

The database uses referential integrity.

When a department is deleted:

```sql
ON DELETE SET NULL
```

is applied.

Therefore:

```text
Engineering (#1)
       ↓ DELETE

User.department_id
       ↓
NULL

Document.department_id
       ↓
NULL
```

The actual user/document records remain.

The frontend displays:

```text
Unassigned
```

---

# 17. Category Relationship

Documents may belong to categories.

```text
Category
   │
   ├── Document
   ├── Document
   └── Document
```

Categories can be managed by administrators.

If a category cannot be deleted because existing documents reference it, the backend returns a controlled error instead of allowing an invalid database state.

---

# 18. Document Entity

A document represents the logical document record.

Conceptually:

```text
document_id
title
description
category_id
department_id
owner_id
status
created_at
updated_at
```

The document itself does not represent a specific uploaded file version.

Instead, versions are stored separately.

---

# 19. Document Version Architecture

A document can have multiple versions.

```text
Document #10
     │
     ├── Version 1
     │      ├── uploader
     │      ├── file
     │      └── review information
     │
     ├── Version 2
     │      ├── uploader
     │      ├── file
     │      └── review information
     │
     └── Version 3
            └── ...
```

This design prevents a new upload from destroying historical information.

---

# 20. Document State Machine

The document workflow can be represented as a finite state machine.

```text
              ┌─────────────┐
              │    DRAFT    │
              └──────┬──────┘
                     │
              Submit for Review
                     │
                     ▼
             ┌────────────────┐
             │  UNDER_REVIEW  │
             └───────┬────────┘
                     │
              ┌──────┴──────┐
              │             │
           Reject         Approve
              │             │
              ▼             ▼
       ┌────────────┐   ┌───────────┐
       │  REJECTED  │   │ ARCHIVED  │
       └─────┬──────┘   └───────────┘
             │
        Upload Revision
             │
             ▼
       UNDER_REVIEW
```

This state machine is enforced by the backend.

---

# 21. Workflow Validation

The backend does not trust the frontend.

For example, hiding the:

```text
Approve
```

button is not sufficient security.

The backend independently verifies:

```text
Current user role
       +
Document state
       +
Document version
       +
Requested operation
```

before performing the operation.

Therefore:

```text
Frontend restriction
        +
Backend authorization
        +
Backend state validation
```

provides the actual workflow protection.

---

# 22. Example: Submit for Review

The process is:

```text
Employee clicks Submit
          │
          ▼
POST /api/documents/:id/submit-review
          │
          ▼
Backend checks user permission
          │
          ▼
Backend checks document state
          │
          ▼
Backend checks document version
          │
          ├── No version → HTTP 400
          │
          ▼
Database update
          │
          ▼
DRAFT → UNDER_REVIEW
```

---

# 23. Example: Rejection

```text
Reviewer
   │
   ▼
Reject Document
   │
   ▼
POST /api/documents/:id/versions/:versionId/reject
   │
   ▼
Backend authorization
   │
   ▼
Version validation
   │
   ▼
Rejection reason
   │
   ▼
Database update
   │
   ▼
UNDER_REVIEW → REJECTED
```

The reviewer identity is preserved.

Example:

```text
Rejected by Bob Reviewer (#2)
Reason:
Missing approval signatures
```

---

# 24. Example: Approval

```text
Reviewer
   │
   ▼
Approve & Archive
   │
   ▼
Backend authorization
   │
   ▼
State validation
   │
   ▼
Version validation
   │
   ▼
Database transaction
   │
   ▼
UNDER_REVIEW → ARCHIVED
```

Once archived, the normal employee/reviewer workflow cannot continue.

---

# 25. Error Handling

The system uses HTTP status codes to communicate failures.

Common responses include:

```text
200 OK
201 Created
400 Bad Request
403 Forbidden
404 Not Found
500 Internal Server Error
```

Examples:

### Invalid input

```text
400 Bad Request
```

### Unauthorized role

```text
403 Forbidden
```

### Missing resource

```text
404 Not Found
```

The frontend converts these API errors into user-friendly UI messages.

---

# 26. Frontend State Synchronization

The frontend maintains local state for entities such as:

```text
users
documents
categories
departments
currentUser
```

When an administrator modifies related data, the application synchronizes dependent state.

Example:

```text
Delete Department
       │
       ▼
Backend sets department_id = NULL
       │
       ▼
Frontend updates:
       │
       ├── users
       └── documents
```

This prevents stale information from remaining visible after a database relationship changes.

---

# 27. Search & Filtering

Several views perform client-side filtering.

### Users

Search can match:

```text
Name
Email
Role
Department
User ID
```

### Documents

Search/filtering can use:

```text
Document ID
Title
Owner
Category
Department
Status
```

Multiple document filters can be combined.

---

# 28. Authentication Architecture

The current authentication system is intentionally simplified for local development.

The flow is:

```text
Login Form
    │
    ▼
POST /api/auth/login
    │
    ▼
Backend validates credentials
    │
    ▼
User information returned
    │
    ▼
React stores current user
    │
    ▼
Role-specific UI rendered
```

The frontend persists the local user state using browser storage.

### Important limitation

The current implementation does not yet use production-grade:

* JWT authentication
* HTTP-only session cookies
* Password hashing
* Refresh tokens
* Authentication middleware

Therefore this architecture should be considered suitable for the **local academic/demo environment**, not as a production authentication design.

---

# 29. Security Boundary

The intended authorization model is:

```text
                 ┌───────────────┐
                 │ Authentication│
                 └───────┬───────┘
                         │
                         ▼
                 ┌───────────────┐
                 │    User Role  │
                 └───────┬───────┘
                         │
             ┌───────────┼───────────┐
             ▼           ▼           ▼
         EMPLOYEE     REVIEWER      ADMIN
             │           │           │
             ▼           ▼           ▼
          Employee     Review      Management
          actions      actions      actions
```

The frontend controls what the user sees.

The backend must control what the user is actually allowed to execute.

---

# 30. Complete Request Example

Consider an employee submitting a document.

```text
┌──────────────────────────┐
│ Employee React UI        │
│                          │
│ Submit for Review        │
└────────────┬─────────────┘
             │
             │ POST
             ▼
┌──────────────────────────┐
│ Express Route            │
│                          │
│ /documents/:id/          │
│ submit-review            │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│ Controller               │
│                          │
│ Validate request         │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│ Review Service           │
│                          │
│ Check role               │
│ Check state              │
│ Check version            │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│ MySQL                    │
│                          │
│ Update document status   │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│ JSON Response            │
│                          │
│ success: true            │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│ React                    │
│                          │
│ Status → UNDER_REVIEW    │
└──────────────────────────┘
```

---

# 31. Why This Architecture?

The architecture was selected to keep the project understandable while still following common full-stack application patterns.

### React

Provides:

* Component-based UI
* State management
* Conditional rendering
* Interactive forms
* Role-specific interfaces

### Express

Provides:

* REST API
* HTTP routing
* Request/response handling
* Business-service integration

### Service Layer

Separates business rules from HTTP handling.

### MySQL

Provides:

* Structured relational storage
* Foreign keys
* Referential integrity
* Persistent data

---

# 32. Current Strengths

The current architecture provides:

* Clear separation between frontend and backend.
* Role-specific workflows.
* Backend workflow validation.
* Relational data integrity.
* Document version preservation.
* Controlled document state transitions.
* Administrative management.
* Read-only administrative inspection.
* User identification through database IDs.
* API error handling.
* Frontend state synchronization.

---

# 33. Current Limitations

The current architecture is not yet production hardened.

Important limitations include:

1. Local/demo authentication.
2. Plaintext password storage in the current development database.
3. No JWT/session-based authentication.
4. No dedicated authentication middleware.
5. Limited automated unit/integration test coverage.
6. Local development file handling.
7. No dedicated object-storage layer.
8. No malware scanning for uploaded files.
9. No comprehensive audit-log subsystem.
10. Limited deployment automation.

These should be addressed before production deployment.

---

# 34. Recommended Production Architecture

A future production version could evolve into:

```text
                         ┌───────────────┐
                         │    Browser    │
                         └───────┬───────┘
                                 │ HTTPS
                                 ▼
                         ┌───────────────┐
                         │ Reverse Proxy │
                         │ Nginx / LB    │
                         └───────┬───────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
                    ▼                         ▼
             ┌─────────────┐           ┌─────────────┐
             │ React App   │           │ API Server  │
             └─────────────┘           │ Express     │
                                       └──────┬──────┘
                                              │
                         ┌────────────────────┼──────────────────┐
                         │                    │                  │
                         ▼                    ▼                  ▼
                  ┌────────────┐       ┌────────────┐    ┌────────────┐
                  │ MySQL      │       │ Object     │    │ Audit Log  │
                  │ Database   │       │ Storage    │    │ Service    │
                  └────────────┘       │ S3/etc.    │    └────────────┘
                                       └────────────┘
```

Additional production services could include:

```text
Authentication
     ↓
JWT / Secure Sessions
     ↓
Authorization Middleware
     ↓
Application Services
```

---

# 35. Deployment Model

For local development:

```text
Frontend
localhost:5173
       │
       ▼
Backend
localhost:5000
       │
       ▼
MySQL
localhost:3306
```

For production, these services should be separated and protected behind HTTPS.

---

# 36. Final Architecture Summary

InduDocs follows a layered full-stack architecture:

```text
┌──────────────────────────────────────────┐
│                FRONTEND                  │
│                                          │
│ React + Vite                             │
│ Role-specific UI                         │
│ Forms / Search / State                   │
└───────────────────┬──────────────────────┘
                    │
                  REST
                    │
┌───────────────────▼──────────────────────┐
│                BACKEND                   │
│                                          │
│ Express                                  │
│   ↓                                      │
│ Routes                                   │
│   ↓                                      │
│ Controllers                              │
│   ↓                                      │
│ Services                                 │
│   ↓                                      │
│ Business Rules                           │
└───────────────────┬──────────────────────┘
                    │
                   SQL
                    │
┌───────────────────▼──────────────────────┐
│                 MYSQL                    │
│                                          │
│ Users                                    │
│ Documents                                │
│ Versions                                 │
│ Categories                               │
│ Departments                              │
│ Relationships                            │
└──────────────────────────────────────────┘
```

The central architectural principle is:

> **The frontend controls presentation, the backend controls business rules, and the database controls persistent relational integrity.**

This separation is particularly important for the document-review workflow because UI restrictions alone cannot guarantee that invalid operations are prevented.
