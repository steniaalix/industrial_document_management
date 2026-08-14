// Base URL configuration for the backend Express server
export const API_BASE_URL = 'http://localhost:5000/api';

/**
 * Utility to fetch all documents from the backend API.
 * @returns {Promise<Array>} A promise that resolves to the list of documents.
 */
export async function fetchDocuments() {
  const response = await fetch(`${API_BASE_URL}/documents`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch documents: ${response.status} ${response.statusText}`);
  }
  
  const result = await response.json();
  
  // The backend returns an object with structure: { success: true, data: [...] }
  if (result && result.success && Array.isArray(result.data)) {
    return result.data;
  }
  
  throw new Error('Invalid response structure received from server');
}

/**
 * Utility to fetch a single document by its ID from the backend API.
 * @param {number|string} id - The document ID.
 * @returns {Promise<object>} A promise that resolves to the document details object.
 */
export async function fetchDocumentById(id) {
  const response = await fetch(`${API_BASE_URL}/documents/${id}`);
  
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Document with ID ${id} not found`);
    }
    throw new Error(`Failed to fetch document details: ${response.status} ${response.statusText}`);
  }
  
  const result = await response.json();
  
  if (result && result.success && result.data) {
    return result.data;
  }
  
  throw new Error('Invalid response structure received from server');
}

/**
 * Utility to fetch the version history for a specific document.
 * @param {number|string} id - The document ID.
 * @returns {Promise<Array>} A promise that resolves to the array of document versions.
 */
export async function fetchDocumentVersions(id) {
  const response = await fetch(`${API_BASE_URL}/documents/${id}/versions`);
  
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Versions for document ID ${id} not found`);
    }
    throw new Error(`Failed to fetch document versions: ${response.status} ${response.statusText}`);
  }
  
  const result = await response.json();
  
  if (result && result.success && Array.isArray(result.data)) {
    return result.data;
  }
  
  throw new Error('Invalid response structure received from server');
}

/**
 * Utility to upload a new document version to the backend.
 * @param {number|string} docId - The ID of the document.
 * @param {number|string} uploadedBy - The ID of the uploader user.
 * @param {File} file - The native browser File object to upload.
 * @returns {Promise<object>} The newly created version object returned by the server.
 */
export async function uploadDocumentVersion(docId, uploadedBy, file) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('uploaded_by', uploadedBy);

  const response = await fetch(`${API_BASE_URL}/documents/${docId}/versions`, {
    method: 'POST',
    body: formData
    // CRITICAL: Do NOT set Content-Type header. Let the browser append it automatically with the boundary.
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || `Upload failed: ${response.status} ${response.statusText}`);
  }

  if (result && result.success && result.data) {
    return result.data;
  }

  throw new Error('Invalid response structure received from server');
}

/**
 * Utility to submit a document for review.
 * @param {number|string} docId - The ID of the document to submit.
 * @returns {Promise<object>} The updated document details from the backend.
 */
export async function submitDocumentForReview(docId) {
  const response = await fetch(`${API_BASE_URL}/documents/${docId}/submit-review`, {
    method: 'POST'
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || `Review submission failed: ${response.status} ${response.statusText}`);
  }

  if (result && result.success && result.data) {
    return result.data;
  }

  throw new Error('Invalid response structure received from server');
}

/**
 * Utility to create a new document in the backend.
 * @param {object} docData - The fields { title, description, category_id, department_id, owner_id, status }
 * @returns {Promise<object>} The newly created document details from the backend.
 */
export async function createDocument(docData) {
  const response = await fetch(`${API_BASE_URL}/documents`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(docData)
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || `Document creation failed: ${response.status} ${response.statusText}`);
  }

  if (result && result.success && result.data) {
    return result.data;
  }

  throw new Error('Invalid response structure received from server');
}

/**
 * Utility to authenticate a user.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<object>} The authenticated user object { user_id, name, email, role }.
 */
export async function loginUser(email, password) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || `Login failed: ${response.status} ${response.statusText}`);
  }

  if (result && result.success && result.data) {
    return result.data;
  }

  throw new Error('Invalid response structure received from server');
}

/**
 * Utility to approve a document.
 * @param {number|string} docId - The ID of the document.
 * @param {number} approvedBy - The user ID of the reviewer approving it.
 * @returns {Promise<object>} The updated document object.
 */
export async function approveDocument(docId, approvedBy) {
  const response = await fetch(`${API_BASE_URL}/documents/${docId}/approve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ approved_by: approvedBy })
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || `Approval failed: ${response.status} ${response.statusText}`);
  }

  if (result && result.success && result.data) {
    return result.data;
  }

  throw new Error('Invalid response structure received from server');
}

/**
 * Utility to reject a document version.
 * @param {number|string} docId - The ID of the document.
 * @param {number|string} versionId - The ID of the version being rejected.
 * @param {number} rejectedBy - The user ID of the reviewer rejecting it.
 * @param {string} reason - The reason for rejection.
 * @returns {Promise<object>} The newly created rejection record details.
 */
export async function rejectDocumentVersion(docId, versionId, rejectedBy, reason) {
  const response = await fetch(`${API_BASE_URL}/documents/${docId}/versions/${versionId}/reject`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ rejected_by: rejectedBy, reason })
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || `Rejection failed: ${response.status} ${response.statusText}`);
  }

  if (result && result.success && result.data) {
    return result.data;
  }

  throw new Error('Invalid response structure received from server');
}

/**
 * Utility to fetch rejection history logs for a specific document version.
 * @param {number|string} docId
 * @param {number|string} versionId
 * @returns {Promise<Array>} List of rejection records.
 */
export async function fetchVersionRejections(docId, versionId) {
  const response = await fetch(`${API_BASE_URL}/documents/${docId}/versions/${versionId}/rejections`);

  if (!response.ok) {
    throw new Error(`Failed to fetch version rejections: ${response.status} ${response.statusText}`);
  }

  const result = await response.json();

  if (result && result.success && Array.isArray(result.data)) {
    return result.data;
  }

  throw new Error('Invalid response structure received from server');
}

/**
 * Utility to fetch all users from the backend API.
 * @returns {Promise<Array>} List of user objects
 */
export async function fetchUsers() {
  const response = await fetch(`${API_BASE_URL}/users`);

  const payload = await response.json();

  if (!response.ok || !payload.success) {
    throw new Error(payload.message || 'Failed to fetch users');
  }

  return payload.data;
}

/**
 * Utility to create a new user in the backend API.
 * @param {object} userData - User fields: { name, email, password, role, department_id }
 * @returns {Promise<object>} The newly created user details from the backend.
 */
export async function createUser(userData) {
  const response = await fetch(`${API_BASE_URL}/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(userData)
  });

  const payload = await response.json();

  if (!response.ok || !payload.success) {
    throw new Error(payload.message || 'Failed to create user');
  }

  return payload.data;
}

/**
 * Utility to update an existing user by ID in the backend API.
 * @param {number|string} id - The user ID.
 * @param {object} userData - User fields to update.
 * @returns {Promise<object>} The updated user details from the backend.
 */
export async function updateUser(id, userData) {
  const response = await fetch(`${API_BASE_URL}/users/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(userData)
  });

  const payload = await response.json();

  if (!response.ok || !payload.success) {
    throw new Error(payload.message || 'Failed to update user');
  }

  return payload.data;
}

/**
 * Utility to delete a user by ID in the backend API.
 * @param {number|string} id - The user ID.
 * @returns {Promise<object>} The deleted user metadata from the backend.
 */
export async function deleteUser(id) {
  const response = await fetch(`${API_BASE_URL}/users/${id}`, {
    method: 'DELETE'
  });

  const payload = await response.json();

  if (!response.ok || !payload.success) {
    throw new Error(payload.message || 'Failed to delete user');
  }

  return payload.data;
}

/**
 * Fetch all categories from the API.
 * @returns {Promise<Array>} List of category objects.
 */
export async function fetchCategories() {
  const response = await fetch(`${API_BASE_URL}/categories`);
  const payload = await response.json();

  if (!response.ok || !payload.success) {
    throw new Error(payload.message || 'Failed to fetch categories');
  }

  return payload.data;
}

/**
 * Fetch a single category by its ID.
 * @param {number|string} id - The category ID.
 * @returns {Promise<object>} Category data.
 */
export async function fetchCategoryById(id) {
  const response = await fetch(`${API_BASE_URL}/categories/${id}`);
  const payload = await response.json();

  if (!response.ok || !payload.success) {
    throw new Error(payload.message || 'Failed to fetch category');
  }

  return payload.data;
}

/**
 * Create a new category.
 * @param {object} categoryData - Data to create the category (category_name, description).
 * @returns {Promise<object>} The newly created category.
 */
export async function createCategory(categoryData) {
  const response = await fetch(`${API_BASE_URL}/categories`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(categoryData)
  });

  const payload = await response.json();

  if (!response.ok || !payload.success) {
    throw new Error(payload.message || 'Failed to create category');
  }

  return payload.data;
}

/**
 * Update an existing category.
 * @param {number|string} id - Category ID.
 * @param {object} categoryData - Data to update (category_name, description).
 * @returns {Promise<object>} The updated category.
 */
export async function updateCategory(id, categoryData) {
  const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(categoryData)
  });

  const payload = await response.json();

  if (!response.ok || !payload.success) {
    throw new Error(payload.message || 'Failed to update category');
  }

  return payload.data;
}

/**
 * Delete a category.
 * @param {number|string} id - Category ID.
 * @returns {Promise<object>} Deletion confirmation metadata.
 */
export async function deleteCategory(id) {
  const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
    method: 'DELETE'
  });

  const payload = await response.json();

  if (!response.ok || !payload.success) {
    throw new Error(payload.message || 'Failed to delete category');
  }

  return payload.data;
}

/**
 * Fetch all departments from the API.
 * @returns {Promise<Array>} List of department objects.
 */
export async function fetchDepartments() {
  const response = await fetch(`${API_BASE_URL}/departments`);
  const payload = await response.json();

  if (!response.ok || !payload.success) {
    throw new Error(payload.message || 'Failed to fetch departments');
  }

  return payload.data;
}

/**
 * Fetch a single department by its ID.
 * @param {number|string} id - The department ID.
 * @returns {Promise<object>} Department data.
 */
export async function fetchDepartmentById(id) {
  const response = await fetch(`${API_BASE_URL}/departments/${id}`);
  const payload = await response.json();

  if (!response.ok || !payload.success) {
    throw new Error(payload.message || 'Failed to fetch department');
  }

  return payload.data;
}

/**
 * Create a new department.
 * @param {object} departmentData - Data to create the department (name, description).
 * @returns {Promise<object>} The newly created department.
 */
export async function createDepartment(departmentData) {
  const response = await fetch(`${API_BASE_URL}/departments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(departmentData)
  });

  const payload = await response.json();

  if (!response.ok || !payload.success) {
    throw new Error(payload.message || 'Failed to create department');
  }

  return payload.data;
}

/**
 * Update an existing department.
 * @param {number|string} id - Department ID.
 * @param {object} departmentData - Data to update (name, description).
 * @returns {Promise<object>} The updated department.
 */
export async function updateDepartment(id, departmentData) {
  const response = await fetch(`${API_BASE_URL}/departments/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(departmentData)
  });

  const payload = await response.json();

  if (!response.ok || !payload.success) {
    throw new Error(payload.message || 'Failed to update department');
  }

  return payload.data;
}

/**
 * Delete a department.
 * @param {number|string} id - Department ID.
 * @returns {Promise<object>} Deletion confirmation metadata.
 */
export async function deleteDepartment(id) {
  const response = await fetch(`${API_BASE_URL}/departments/${id}`, {
    method: 'DELETE'
  });

  const payload = await response.json();

  if (!response.ok || !payload.success) {
    throw new Error(payload.message || 'Failed to delete department');
  }

  return payload.data;
}
