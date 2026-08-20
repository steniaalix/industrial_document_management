import { useState, useEffect, useRef } from 'react';
import { 
  fetchDocuments, 
  fetchDocumentById, 
  fetchDocumentVersions, 
  uploadDocumentVersion, 
  submitDocumentForReview, 
  createDocument,
  loginUser,
  approveDocument,
  rejectDocumentVersion,
  fetchVersionRejections,
  fetchUsers,
  createUser,
  updateUser,
  deleteUser,
  fetchCategories,
  fetchCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  fetchDepartments,
  fetchDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  askAI
} from './utils/api';
import './App.css';

// Reusable user ID formatting helpers
const renderUserName = (name, id) => {
  if (!name) return null;
  if (id === undefined || id === null) return name;
  return (
    <span>
      {name}{' '}
      <span style={{ fontSize: '0.85em', color: 'var(--text-secondary)', fontWeight: 'normal' }}>
        (#{id})
      </span>
    </span>
  );
};

const formatUserNameString = (name, id) => {
  if (!name) return '';
  if (id === undefined || id === null) return name;
  return `${name} (#${id})`;
};

function AdminDashboard({
  documents,
  isLoading,
  error,
  adminTotalUsers,
  totalDocs,
  underReviewDocs,
  adminArchivedDocs,
  adminDraftDocs,
  rejectedDocs
}) {
  return (
    <div>
      <div className="section-header" style={{ marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', color: 'var(--text-primary)' }}>Admin Dashboard</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>System overview and administration</p>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="card-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper indigo">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Users</span>
            <span className="stat-value">{adminTotalUsers}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper indigo">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Documents</span>
            <span className="stat-value">{totalDocs}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper cyan">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div className="stat-info">
            <span className="stat-label">Under Review</span>
            <span className="stat-value">{underReviewDocs}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper emerald">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <div className="stat-info">
            <span className="stat-label">Archived</span>
            <span className="stat-value">{adminArchivedDocs}</span>
          </div>
        </div>
      </div>

      {/* Recent Documents Table */}
      <div className="section-card">
        <div className="section-header" style={{ marginBottom: '16px' }}>
          <h3>Recent Documents</h3>
        </div>

        {isLoading ? (
          <p style={{ color: 'var(--text-secondary)' }}>Loading documents...</p>
        ) : error ? (
          <p style={{ color: 'var(--danger)' }}>{error}</p>
        ) : documents.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No documents available in the system.</p>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Owner</th>
                  <th>Status</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {[...documents]
                  .sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at))
                  .slice(0, 5)
                  .map(doc => (
                    <tr key={doc.doc_id}>
                      <td>#{doc.doc_id}</td>
                      <td style={{ fontWeight: '500' }}>{doc.title}</td>
                      <td>{renderUserName(doc.owner_name, doc.owner_id) || 'System'}</td>
                      <td>
                        <span className={`badge ${doc.status.toLowerCase()}`}>
                          {doc.status}
                        </span>
                      </td>
                      <td>{new Date(doc.updated_at || doc.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Statistics Distribution */}
      <div className="section-card" style={{ marginTop: '24px' }}>
        <div className="section-header" style={{ marginBottom: '16px' }}>
          <h3>Document Status Distribution</h3>
        </div>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '120px', padding: '16px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px', fontWeight: '500' }}>DRAFT</span>
            <span className="badge draft" style={{ fontSize: '1.2rem', padding: '4px 12px' }}>{adminDraftDocs}</span>
          </div>
          <div style={{ flex: 1, minWidth: '120px', padding: '16px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px', fontWeight: '500' }}>UNDER REVIEW</span>
            <span className="badge under_review" style={{ fontSize: '1.2rem', padding: '4px 12px' }}>{underReviewDocs}</span>
          </div>
          <div style={{ flex: 1, minWidth: '120px', padding: '16px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px', fontWeight: '500' }}>REJECTED</span>
            <span className="badge rejected" style={{ fontSize: '1.2rem', padding: '4px 12px' }}>{rejectedDocs}</span>
          </div>
          <div style={{ flex: 1, minWidth: '120px', padding: '16px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px', fontWeight: '500' }}>ARCHIVED</span>
            <span className="badge archived" style={{ fontSize: '1.2rem', padding: '4px 12px' }}>{adminArchivedDocs}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Authenticated user state
  const [currentUser, setCurrentUser] = useState(() => {
    const stored = localStorage.getItem('induDocsUser');
    return stored ? JSON.parse(stored) : null;
  });
  
  // Login form states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // List view states
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // User management states
  const [users, setUsers] = useState([]);
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState(null);
  const [userSearchTerm, setUserSearchTerm] = useState('');

  // Create user form states
  const [userFormName, setUserFormName] = useState('');
  const [userFormEmail, setUserFormEmail] = useState('');
  const [userFormPassword, setUserFormPassword] = useState('');
  const [userFormRole, setUserFormRole] = useState('EMPLOYEE');
  const [userFormDepartmentId, setUserFormDepartmentId] = useState('');
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [createUserError, setCreateUserError] = useState(null);
  const [createUserSuccess, setCreateUserSuccess] = useState(null);

  // Edit user form states
  const [editingUser, setEditingUser] = useState(null);
  const [editUserName, setEditUserName] = useState('');
  const [editUserEmail, setEditUserEmail] = useState('');
  const [editUserPassword, setEditUserPassword] = useState('');
  const [editUserRole, setEditUserRole] = useState('EMPLOYEE');
  const [editUserDepartmentId, setEditUserDepartmentId] = useState('');
  const [isUpdatingUser, setIsUpdatingUser] = useState(false);
  const [editUserError, setEditUserError] = useState(null);
  const [editUserSuccessMessage, setEditUserSuccessMessage] = useState(null);

  // Delete user states
  const [deletingUser, setDeletingUser] = useState(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);
  const [deleteUserError, setDeleteUserError] = useState(null);
  const [deleteUserSuccessMessage, setDeleteUserSuccessMessage] = useState(null);

  // Category management states
  const [categories, setCategories] = useState([]);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState(null);
  const [categorySearchTerm, setCategorySearchTerm] = useState('');

  // Create category form states
  const [categoryFormName, setCategoryFormName] = useState('');
  const [categoryFormDescription, setCategoryFormDescription] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [createCategoryError, setCreateCategoryError] = useState(null);
  const [createCategorySuccess, setCreateCategorySuccess] = useState(null);

  // Edit category form states
  const [editingCategory, setEditingCategory] = useState(null);
  const [editCategoryName, setEditCategoryName] = useState('');
  const [editCategoryDescription, setEditCategoryDescription] = useState('');
  const [isUpdatingCategory, setIsUpdatingCategory] = useState(false);
  const [editCategoryError, setEditCategoryError] = useState(null);
  const [editCategorySuccessMessage, setEditCategorySuccessMessage] = useState(null);

  // Delete category states
  const [deletingCategory, setDeletingCategory] = useState(null);
  const [isDeletingCategory, setIsDeletingCategory] = useState(false);
  const [deleteCategoryError, setDeleteCategoryError] = useState(null);
  const [deleteCategorySuccessMessage, setDeleteCategorySuccessMessage] = useState(null);

  // Department management states
  const [departments, setDepartments] = useState([]);
  const [isDepartmentsLoading, setIsDepartmentsLoading] = useState(false);
  const [departmentsError, setDepartmentsError] = useState(null);
  const [departmentSearchTerm, setDepartmentSearchTerm] = useState('');

  // Create department form states
  const [departmentFormName, setDepartmentFormName] = useState('');
  const [departmentFormDescription, setDepartmentFormDescription] = useState('');
  const [isCreatingDepartment, setIsCreatingDepartment] = useState(false);
  const [createDepartmentError, setCreateDepartmentError] = useState(null);
  const [createDepartmentSuccess, setCreateDepartmentSuccess] = useState(null);

  // Edit department form states
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [editDepartmentName, setEditDepartmentName] = useState('');
  const [editDepartmentDescription, setEditDepartmentDescription] = useState('');
  const [isUpdatingDepartment, setIsUpdatingDepartment] = useState(false);
  const [editDepartmentError, setEditDepartmentError] = useState(null);
  const [editDepartmentSuccessMessage, setEditDepartmentSuccessMessage] = useState(null);

  // Delete department states
  const [deletingDepartment, setDeletingDepartment] = useState(null);
  const [isDeletingDepartment, setIsDeletingDepartment] = useState(false);
  const [deleteDepartmentError, setDeleteDepartmentError] = useState(null);
  const [deleteDepartmentSuccessMessage, setDeleteDepartmentSuccessMessage] = useState(null);

  // Admin Document Registry filter/search states
  const [adminStatusFilter, setAdminStatusFilter] = useState('ALL');
  const [adminCategoryFilter, setAdminCategoryFilter] = useState('ALL');
  const [adminDepartmentFilter, setAdminDepartmentFilter] = useState('ALL');
  const [adminSearchTerm, setAdminSearchTerm] = useState('');

  // Single document details view states
  const [selectedDocId, setSelectedDocId] = useState(null);
  const [selectedDocDetails, setSelectedDocDetails] = useState(null);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState(null);

  // Versions history states
  const [versions, setVersions] = useState([]);
  const [isVersionsLoading, setIsVersionsLoading] = useState(false);
  const [versionsError, setVersionsError] = useState(null);

  // Version upload states
  const [selectedFile, setSelectedFile] = useState(null);
  const [manualFileName, setManualFileName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccessMessage, setUploadSuccessMessage] = useState(null);

  // Review submission states
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [submitReviewError, setSubmitReviewError] = useState(null);
  const [submitReviewSuccessMessage, setSubmitReviewSuccessMessage] = useState(null);

  // Reviewer approval states
  const [isApproveLoading, setIsApproveLoading] = useState(false);
  const [approveError, setApproveError] = useState(null);

  // Reviewer rejection states
  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionError, setRejectionError] = useState(null);

  // Rejections list cache (version_id -> Array of rejections)
  const [versionRejections, setVersionRejections] = useState({});

  // Create document form states
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formDepartmentId, setFormDepartmentId] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState(null);
  const [createSuccessMessage, setCreateSuccessMessage] = useState(null);

  // AI Assistant states
  const [chatMessages, setChatMessages] = useState([
    {
      sender: 'ai',
      text: 'Hello! I am your InduDocs AI Assistant. I can help you search, summarize, and understand industrial procedures, safety policies, or specifications stored in the document repository. What would you like to ask today?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [aiQuestion, setAiQuestion] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  
  // AI Ingestion states (Admin only)
  const [ingestDocId, setIngestDocId] = useState('');
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestResult, setIngestResult] = useState(null);
  const [ingestError, setIngestError] = useState(null);

  // Chat scroll anchor ref
  const messagesEndRef = useRef(null);

  // Scroll to bottom helper
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isAiLoading]);

  // Ask AI handler (Conversational Thread)
  const handleAskAI = async (e) => {
    if (e) e.preventDefault();
    const questionText = aiQuestion.trim();
    if (!questionText) return;

    // 1. Add user message
    const userMsg = {
      sender: 'user',
      text: questionText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setChatMessages(prev => [...prev, userMsg]);
    setAiQuestion('');
    setIsAiLoading(true);
    setAiError(null);

    try {
      // 2. Fetch answer using askAI utility
      const data = await askAI(questionText);
      const aiMsg = {
        sender: 'ai',
        text: data.answer,
        sources: data.sources || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      console.error('AI Ask Error:', err);
      setAiError(err.message || 'Could not connect to the AI backend.');
      
      const errorMsg = {
        sender: 'ai',
        text: `Error: ${err.message || 'Could not connect to the AI backend. Please verify it is running on port 8001.'}`,
        isError: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Clear Chat history handler
  const handleClearChat = () => {
    setChatMessages([
      {
        sender: 'ai',
        text: 'Hello! I am your InduDocs AI Assistant. I can help you search, summarize, and understand industrial procedures, safety policies, or specifications stored in the document repository. What would you like to ask today?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    setAiQuestion('');
    setAiError(null);
  };

  // Ingest Document handler
  const handleIngestDocument = async (e) => {
    if (e) e.preventDefault();
    if (!ingestDocId) return;

    try {
      setIsIngesting(true);
      setIngestError(null);
      setIngestResult(null);

      // Using correct port 8001 for AI service backend
      const response = await fetch(`http://127.0.0.1:8001/api/ai/ingest/${ingestDocId}`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Failed to ingest document.');
      }

      const data = await response.json();
      if (data.already_ingested) {
        setIngestResult(`Document #${ingestDocId} is already indexed (${data.chunks_created} chunks).`);
      } else {
        setIngestResult(`Successfully ingested Document #${ingestDocId} (${data.chunks_created} chunks created).`);
      }
    } catch (err) {
      console.error('AI Ingestion Error:', err);
      setIngestError(err.message || 'Could not connect to the AI backend. Please verify it is running on port 8001.');
    } finally {
      setIsIngesting(false);
    }
  };

  // Helper component to render the AI Assistant
  const renderAIAssistant = () => {
    return (
      <div className="section-card" style={{ animation: 'fadeIn 0.3s ease-out', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Header */}
        <div className="section-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '1.6rem', color: 'var(--text-primary)' }}>Industrial Document AI Assistant</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
              Interact with the plant documentation repository to search procedures, analyze manuals, and retrieve safety guidelines.
            </p>
          </div>
          <button 
            type="button" 
            className="btn btn-secondary"
            onClick={handleClearChat}
            disabled={isAiLoading || chatMessages.length <= 1}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', fontSize: '0.85rem' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>
            Clear Chat
          </button>
        </div>

        {/* Layout Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
          
          {/* Conversational Chat Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '20px' }}>
            
            {/* Scrollable Conversation Stream */}
            <div style={{ 
              height: '420px', 
              overflowY: 'auto', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '16px', 
              paddingRight: '8px'
            }}>
              {chatMessages.map((msg, index) => {
                const isAI = msg.sender === 'ai';
                return (
                  <div 
                    key={index} 
                    style={{ 
                      display: 'flex', 
                      justifyContent: isAI ? 'flex-start' : 'flex-end', 
                      width: '100%',
                      animation: 'fadeIn 0.2s ease-out'
                    }}
                  >
                    <div style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: isAI ? 'flex-start' : 'flex-end',
                      maxWidth: isAI ? '85%' : '70%'
                    }}>
                      {/* Avatar & Sender tag */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600' }}>
                        {isAI ? (
                          <>
                            <div style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center', 
                              width: '20px', 
                              height: '20px', 
                              borderRadius: '50%', 
                              backgroundColor: 'var(--accent-glow)', 
                              color: 'var(--accent-primary)',
                              fontSize: '0.65rem'
                            }}>
                              AI
                            </div>
                            <span>InduDocs AI</span>
                          </>
                        ) : (
                          <>
                            <span>{currentUser.name}</span>
                            <div style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center', 
                              width: '20px', 
                              height: '20px', 
                              borderRadius: '50%', 
                              backgroundColor: 'var(--bg-tertiary)', 
                              color: 'var(--text-primary)',
                              fontSize: '0.65rem'
                            }}>
                              U
                            </div>
                          </>
                        )}
                        <span style={{ color: 'var(--text-muted)', fontWeight: 'normal' }}>· {msg.timestamp}</span>
                      </div>

                      {/* Bubble */}
                      <div style={{ 
                        backgroundColor: isAI ? (msg.isError ? 'var(--danger-glow)' : 'var(--bg-tertiary)') : 'var(--accent-primary)', 
                        color: 'var(--text-primary)', 
                        border: isAI ? `1px solid ${msg.isError ? 'var(--danger)' : 'var(--border-color)'}` : 'none', 
                        borderRadius: 'var(--radius-md)', 
                        padding: '12px 16px', 
                        fontSize: '0.92rem', 
                        lineHeight: '1.55', 
                        whiteSpace: 'pre-wrap',
                        boxShadow: 'var(--shadow-sm)'
                      }}>
                        {msg.text}
                      </div>

                      {/* Sources Citation cards if present */}
                      {isAI && msg.sources && msg.sources.length > 0 && (
                        <div style={{ marginTop: '12px', width: '100%' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                            </svg>
                            Verified Sources
                          </span>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px' }}>
                            {msg.sources.map((source, sIdx) => (
                              <div 
                                key={sIdx} 
                                style={{ 
                                  backgroundColor: 'var(--bg-primary)', 
                                  border: '1px solid var(--border-color)', 
                                  borderRadius: 'var(--radius-sm)', 
                                  padding: '8px 10px',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '4px',
                                  fontSize: '0.8rem',
                                  transition: 'border-color var(--transition-fast)'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
                                onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
                              >
                                <div style={{ fontWeight: '600', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {source.document_title || source.file_name}
                                </div>
                                <div style={{ color: 'var(--text-secondary)', fontSize: '0.72rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  File: {source.file_name} · V{source.version_number}
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                                  <span style={{ fontSize: '0.68rem', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                                    {source.category_name || 'Procedure'}
                                  </span>
                                  <span style={{ fontSize: '0.68rem', backgroundColor: 'var(--accent-glow)', color: 'var(--accent-primary)', padding: '2px 6px', borderRadius: '4px', fontWeight: '600' }}>
                                    Page {source.page}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Typing loader bubble */}
              {isAiLoading && (
                <div style={{ display: 'flex', justifyContent: 'flex-start', width: '100%', animation: 'fadeIn 0.2s ease-out' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', maxWidth: '85%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600' }}>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        width: '20px', 
                        height: '20px', 
                        borderRadius: '50%', 
                        backgroundColor: 'var(--bg-tertiary)', 
                        color: 'var(--text-primary)',
                        fontSize: '0.65rem'
                      }}>
                        AI
                      </div>
                      <span>InduDocs AI</span>
                      <span style={{ color: 'var(--text-muted)', fontWeight: 'normal' }}>· typing...</span>
                    </div>
                    <div style={{ 
                      backgroundColor: 'var(--bg-tertiary)', 
                      color: 'var(--text-primary)', 
                      border: '1px solid var(--border-color)', 
                      borderRadius: 'var(--radius-md)', 
                      padding: '12px 16px', 
                      fontSize: '0.92rem', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px'
                    }}>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <div className="dot" style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--text-secondary)', animation: 'bounce 1.4s infinite ease-in-out both' }}></div>
                        <div className="dot" style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--text-secondary)', animation: 'bounce 1.4s infinite ease-in-out both', animationDelay: '0.2s' }}></div>
                        <div className="dot" style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--text-secondary)', animation: 'bounce 1.4s infinite ease-in-out both', animationDelay: '0.4s' }}></div>
                      </div>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Retrieving knowledge and formatting response...</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Scroll Anchor */}
              <div ref={messagesEndRef} />
            </div>

            {/* Input form */}
            <form onSubmit={handleAskAI} style={{ display: 'flex', gap: '10px', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '8px' }}>
              <input 
                type="text"
                placeholder="Ask about plant regulations, machinery steps, or safety guidelines..."
                value={aiQuestion}
                onChange={(e) => setAiQuestion(e.target.value)}
                disabled={isAiLoading}
                style={{ 
                  flex: 1,
                  backgroundColor: 'var(--bg-primary)', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: 'var(--radius-sm)', 
                  padding: '12px 14px', 
                  color: 'var(--text-primary)', 
                  outline: 'none', 
                  fontSize: '0.9rem',
                  transition: 'border-color var(--transition-fast)'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = 'var(--border-focus)'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
              />
              
              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={isAiLoading || !aiQuestion.trim()}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  padding: '12px 20px', 
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  height: '46px',
                  whiteSpace: 'nowrap'
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
                Send
              </button>
            </form>
          </div>
        </div>

        {/* CSS Animation rules */}
        <style>{`
          @keyframes bounce {
            0%, 80%, 100% { transform: scale(0); }
            40% { transform: scale(1.0); }
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  };

  // Load all documents from the backend on component mount
  const loadDocumentsList = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchDocuments();
      setDocuments(data);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message || 'An unexpected error occurred while fetching documents.');
    } finally {
      setIsLoading(false);
    }
  };

  // Load all categories from the backend
  const loadCategories = async () => {
    try {
      setIsCategoriesLoading(true);
      setCategoriesError(null);
      const data = await fetchCategories();
      setCategories(data);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setCategoriesError(err.message || 'An unexpected error occurred while fetching categories.');
    } finally {
      setIsCategoriesLoading(false);
    }
  };

  // Load all departments from the backend
  const loadDepartments = async () => {
    try {
      setIsDepartmentsLoading(true);
      setDepartmentsError(null);
      const data = await fetchDepartments();
      setDepartments(data);
    } catch (err) {
      console.error('Error fetching departments:', err);
      setDepartmentsError(err.message || 'An unexpected error occurred while fetching departments.');
    } finally {
      setIsDepartmentsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadDocumentsList();
      loadCategories();
      loadDepartments();
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser && currentUser.role === 'ADMIN' && currentView === 'categories') {
      loadCategories();
    }
  }, [currentUser, currentView]);

  useEffect(() => {
    if (currentUser && currentUser.role === 'ADMIN' && currentView === 'departments') {
      loadDepartments();
    }
  }, [currentUser, currentView]);

  useEffect(() => {
    if (currentUser && currentUser.role === 'ADMIN' && currentView === 'documents') {
      loadDocumentsList();
      loadCategories();
      loadDepartments();
    }
  }, [currentUser, currentView]);

  // Load all users from the backend
  const loadUsers = async () => {
    try {
      setIsUsersLoading(true);
      setUsersError(null);
      const data = await fetchUsers();
      setUsers(data);
    } catch (err) {
      console.error('Error fetching users:', err);
      setUsersError(err.message || 'An unexpected error occurred while fetching users.');
    } finally {
      setIsUsersLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser && currentUser.role === 'ADMIN' && (currentView === 'users' || currentView === 'dashboard')) {
      loadUsers();
    }
  }, [currentUser, currentView]);

  // Handle Login submission
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) return;

    try {
      setIsLoggingIn(true);
      setLoginError(null);
      const userData = await loginUser(loginEmail, loginPassword);
      setCurrentUser(userData);
      localStorage.setItem('induDocsUser', JSON.stringify(userData));
      
      // Reset fields
      setLoginEmail('');
      setLoginPassword('');
    } catch (err) {
      console.error('Login error:', err);
      setLoginError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle Logout
  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('induDocsUser');
    setCurrentView('dashboard');
    handleBackToList();
  };

  // Handle Create User form submission
  const handleCreateUserSubmit = async (e) => {
    e.preventDefault();
    setCreateUserError(null);
    setCreateUserSuccess(null);

    const trimmedName = userFormName.trim();
    const trimmedEmail = userFormEmail.trim();
    const trimmedPassword = userFormPassword.trim();

    if (!trimmedName) {
      setCreateUserError('Name is required and cannot be empty');
      return;
    }
    if (!trimmedEmail) {
      setCreateUserError('Email is required');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setCreateUserError('Please enter a valid email address');
      return;
    }
    if (!trimmedPassword) {
      setCreateUserError('Password is required and cannot be empty');
      return;
    }
    if (!['EMPLOYEE', 'REVIEWER', 'ADMIN'].includes(userFormRole)) {
      setCreateUserError('Role must be EMPLOYEE, REVIEWER, or ADMIN');
      return;
    }

    const department_id = userFormDepartmentId ? parseInt(userFormDepartmentId, 10) : null;

    try {
      setIsCreatingUser(true);
      const newUser = await createUser({
        name: trimmedName,
        email: trimmedEmail,
        password: trimmedPassword,
        role: userFormRole,
        department_id
      });

      setUserFormName('');
      setUserFormEmail('');
      setUserFormPassword('');
      setUserFormRole('EMPLOYEE');
      setUserFormDepartmentId('');
      setCreateUserSuccess('User created successfully.');

      // Update local state directly with returned user
      setUsers(prev => [...prev, newUser]);

      setTimeout(() => {
        setCreateUserSuccess(null);
        setCurrentView('users');
      }, 1500);
    } catch (err) {
      console.error('Create user error:', err);
      setCreateUserError(err.message || 'Failed to create user');
    } finally {
      setIsCreatingUser(false);
    }
  };

  // Handle Cancel User Creation
  const handleCancelCreateUser = () => {
    setUserFormName('');
    setUserFormEmail('');
    setUserFormPassword('');
    setUserFormRole('EMPLOYEE');
    setUserFormDepartmentId('');
    setCreateUserError(null);
    setCreateUserSuccess(null);
    setCurrentView('users');
  };

  // Open Edit User view
  const handleEditUser = (user) => {
    setEditingUser(user);
    setEditUserName(user.name || '');
    setEditUserEmail(user.email || '');
    setEditUserRole(user.role || 'EMPLOYEE');
    setEditUserDepartmentId(user.department_id !== null && user.department_id !== undefined ? String(user.department_id) : '');
    setEditUserPassword('');
    setEditUserError(null);
    setEditUserSuccessMessage(null);
    setCurrentView('edit_user');
  };

  // Handle Edit User form submission
  const handleEditUserSubmit = async (e) => {
    e.preventDefault();
    setEditUserError(null);
    setEditUserSuccessMessage(null);

    const trimmedName = editUserName.trim();
    const trimmedEmail = editUserEmail.trim();
    const trimmedPassword = editUserPassword.trim();

    if (!trimmedName) {
      setEditUserError('Name is required and cannot be empty');
      return;
    }
    if (!trimmedEmail) {
      setEditUserError('Email is required');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setEditUserError('Please enter a valid email address');
      return;
    }
    if (!['EMPLOYEE', 'REVIEWER', 'ADMIN'].includes(editUserRole)) {
      setEditUserError('Role must be EMPLOYEE, REVIEWER, or ADMIN');
      return;
    }

    const department_id = editUserDepartmentId ? parseInt(editUserDepartmentId, 10) : null;

    const userData = {
      name: trimmedName,
      email: trimmedEmail,
      role: editUserRole,
      department_id
    };

    if (trimmedPassword) {
      userData.password = trimmedPassword;
    }

    try {
      setIsUpdatingUser(true);
      const updatedUser = await updateUser(editingUser.user_id, userData);

      // Update the local users state immediately
      setUsers(prev =>
        prev.map(user =>
          user.user_id === updatedUser.user_id
            ? updatedUser
            : user
        )
      );

      setEditUserSuccessMessage('User updated successfully.');

      setTimeout(() => {
        setEditUserSuccessMessage(null);
        setEditingUser(null);
        setCurrentView('users');
      }, 1500);
    } catch (err) {
      console.error('Update user error:', err);
      setEditUserError(err.message || 'Failed to update user');
    } finally {
      setIsUpdatingUser(false);
    }
  };

  // Handle Cancel User Editing
  const handleCancelEditUser = () => {
    setEditingUser(null);
    setEditUserName('');
    setEditUserEmail('');
    setEditUserPassword('');
    setEditUserRole('EMPLOYEE');
    setEditUserDepartmentId('');
    setEditUserError(null);
    setEditUserSuccessMessage(null);
    setCurrentView('users');
  };

  // Open Delete User confirmation
  const handleDeleteUser = (user) => {
    setDeletingUser(user);
    setDeleteUserError(null);
    setDeleteUserSuccessMessage(null);
  };

  // Confirm and execute user deletion
  const handleConfirmDeleteUser = async () => {
    if (!deletingUser) return;
    setDeleteUserError(null);
    setDeleteUserSuccessMessage(null);

    try {
      setIsDeletingUser(true);
      await deleteUser(deletingUser.user_id);

      setDeleteUserSuccessMessage('User deleted successfully.');

      // Remove from local list state
      setUsers(prev => prev.filter(u => u.user_id !== deletingUser.user_id));

      setTimeout(() => {
        setDeletingUser(null);
        setDeleteUserSuccessMessage(null);
      }, 1500);
    } catch (err) {
      console.error('Delete user error:', err);
      setDeleteUserError(err.message || 'Failed to delete user');
    } finally {
      setIsDeletingUser(false);
    }
  };

  // Cancel deletion dialog
  const handleCancelDeleteUser = () => {
    setDeletingUser(null);
    setDeleteUserError(null);
    setDeleteUserSuccessMessage(null);
  };

  // --- Category Management Event Handlers ---

  // Handle Create Category form submission
  const handleCreateCategorySubmit = async (e) => {
    e.preventDefault();
    setCreateCategoryError(null);
    setCreateCategorySuccess(null);

    const trimmedName = categoryFormName.trim();

    if (!trimmedName) {
      setCreateCategoryError('Category name is required and cannot be empty');
      return;
    }

    try {
      setIsCreatingCategory(true);
      const newCategory = await createCategory({
        category_name: trimmedName,
        description: categoryFormDescription
      });

      setCreateCategorySuccess('Category created successfully.');
      setCategories(prev => [...prev, newCategory]);

      setTimeout(() => {
        setCategoryFormName('');
        setCategoryFormDescription('');
        setCreateCategorySuccess(null);
        setCurrentView('categories');
      }, 1500);
    } catch (err) {
      console.error('Create category error:', err);
      setCreateCategoryError(err.message || 'Failed to create category');
    } finally {
      setIsCreatingCategory(false);
    }
  };

  // Cancel Create Category
  const handleCancelCreateCategory = () => {
    setCategoryFormName('');
    setCategoryFormDescription('');
    setCreateCategoryError(null);
    setCreateCategorySuccess(null);
    setCurrentView('categories');
  };

  // Start Editing Category
  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setEditCategoryName(category.category_name);
    setEditCategoryDescription(category.description || '');
    setEditCategoryError(null);
    setEditCategorySuccessMessage(null);
    setCurrentView('edit_category');
  };

  // Handle Edit Category submission
  const handleEditCategorySubmit = async (e) => {
    e.preventDefault();
    setEditCategoryError(null);
    setEditCategorySuccessMessage(null);

    const trimmedName = editCategoryName.trim();

    if (!trimmedName) {
      setEditCategoryError('Category name is required and cannot be empty');
      return;
    }

    try {
      setIsUpdatingCategory(true);
      const updated = await updateCategory(editingCategory.category_id, {
        category_name: trimmedName,
        description: editCategoryDescription
      });

      setEditCategorySuccessMessage('Category updated successfully.');

      // Update categories state locally
      setCategories(prev => prev.map(c => c.category_id === updated.category_id ? updated : c));

      // Update documents state locally to reflect the updated category name
      setDocuments(prev => prev.map(doc => doc.category_id === updated.category_id ? { ...doc, category_name: updated.category_name } : doc));

      setTimeout(() => {
        setEditingCategory(null);
        setEditCategoryName('');
        setEditCategoryDescription('');
        setEditCategorySuccessMessage(null);
        setCurrentView('categories');
      }, 1500);
    } catch (err) {
      console.error('Update category error:', err);
      setEditCategoryError(err.message || 'Failed to update category');
    } finally {
      setIsUpdatingCategory(false);
    }
  };

  // Cancel Edit Category
  const handleCancelEditCategory = () => {
    setEditingCategory(null);
    setEditCategoryName('');
    setEditCategoryDescription('');
    setEditCategoryError(null);
    setEditCategorySuccessMessage(null);
    setCurrentView('categories');
  };

  // Open Delete Category confirmation dialog
  const handleDeleteCategory = (category) => {
    setDeletingCategory(category);
    setDeleteCategoryError(null);
    setDeleteCategorySuccessMessage(null);
  };

  // Confirm and execute category deletion
  const handleConfirmDeleteCategory = async () => {
    if (!deletingCategory) return;
    setDeleteCategoryError(null);
    setDeleteCategorySuccessMessage(null);

    try {
      setIsDeletingCategory(true);
      await deleteCategory(deletingCategory.category_id);

      setDeleteCategorySuccessMessage('Category deleted successfully.');

      // Remove from local list state
      setCategories(prev => prev.filter(c => c.category_id !== deletingCategory.category_id));

      // Update local documents' category fields to null since ON DELETE SET NULL was triggered on DB
      setDocuments(prev => prev.map(doc => doc.category_id === deletingCategory.category_id ? { ...doc, category_id: null, category_name: null } : doc));

      setTimeout(() => {
        setDeletingCategory(null);
        setDeleteCategorySuccessMessage(null);
      }, 1500);
    } catch (err) {
      console.error('Delete category error:', err);
      setDeleteCategoryError(err.message || 'Failed to delete category');
    } finally {
      setIsDeletingCategory(false);
    }
  };

  // Cancel Delete Category
  const handleCancelDeleteCategory = () => {
    setDeletingCategory(null);
    setDeleteCategoryError(null);
    setDeleteCategorySuccessMessage(null);
  };

  // --- Department Management Event Handlers ---

  // Handle Create Department form submission
  const handleCreateDepartmentSubmit = async (e) => {
    e.preventDefault();
    setCreateDepartmentError(null);
    setCreateDepartmentSuccess(null);

    const trimmedName = departmentFormName.trim();

    if (!trimmedName) {
      setCreateDepartmentError('Department name is required and cannot be empty');
      return;
    }

    try {
      setIsCreatingDepartment(true);
      const newDepartment = await createDepartment({
        name: trimmedName,
        description: departmentFormDescription
      });

      setCreateDepartmentSuccess('Department created successfully.');
      setDepartments(prev => [newDepartment, ...prev]);

      setTimeout(() => {
        setDepartmentFormName('');
        setDepartmentFormDescription('');
        setCreateDepartmentSuccess(null);
        setCurrentView('departments');
      }, 1500);
    } catch (err) {
      console.error('Create department error:', err);
      setCreateDepartmentError(err.message || 'Failed to create department');
    } finally {
      setIsCreatingDepartment(false);
    }
  };

  // Cancel Create Department
  const handleCancelCreateDepartment = () => {
    setDepartmentFormName('');
    setDepartmentFormDescription('');
    setCreateDepartmentError(null);
    setCreateDepartmentSuccess(null);
    setCurrentView('departments');
  };

  // Start Editing Department
  const handleEditDepartment = (dept) => {
    setEditingDepartment(dept);
    setEditDepartmentName(dept.name);
    setEditDepartmentDescription(dept.description || '');
    setEditDepartmentError(null);
    setEditDepartmentSuccessMessage(null);
    setCurrentView('edit_department');
  };

  // Handle Edit Department submission
  const handleEditDepartmentSubmit = async (e) => {
    e.preventDefault();
    setEditDepartmentError(null);
    setEditDepartmentSuccessMessage(null);

    const trimmedName = editDepartmentName.trim();

    if (!trimmedName) {
      setEditDepartmentError('Department name is required and cannot be empty');
      return;
    }

    try {
      setIsUpdatingDepartment(true);
      const updated = await updateDepartment(editingDepartment.department_id, {
        name: trimmedName,
        description: editDepartmentDescription
      });

      setEditDepartmentSuccessMessage('Department updated successfully.');

      // Update departments state locally
      setDepartments(prev => prev.map(d => d.department_id === updated.department_id ? updated : d));

      // Update users state locally if their department_name changed
      setUsers(prev => prev.map(user => user.department_id === updated.department_id ? { ...user, department_name: updated.name } : user));

      // Update documents state locally if their department_name changed
      setDocuments(prev => prev.map(doc => doc.department_id === updated.department_id ? { ...doc, department_name: updated.name } : doc));

      setTimeout(() => {
        setEditingDepartment(null);
        setEditDepartmentName('');
        setEditDepartmentDescription('');
        setEditDepartmentSuccessMessage(null);
        setCurrentView('departments');
      }, 1500);
    } catch (err) {
      console.error('Update department error:', err);
      setEditDepartmentError(err.message || 'Failed to update department');
    } finally {
      setIsUpdatingDepartment(false);
    }
  };

  // Cancel Edit Department
  const handleCancelEditDepartment = () => {
    setEditingDepartment(null);
    setEditDepartmentName('');
    setEditDepartmentDescription('');
    setEditDepartmentError(null);
    setEditDepartmentSuccessMessage(null);
    setCurrentView('departments');
  };

  // Open Delete Department confirmation dialog
  const handleDeleteDepartment = (dept) => {
    setDeletingDepartment(dept);
    setDeleteDepartmentError(null);
    setDeleteDepartmentSuccessMessage(null);
  };

  // Confirm and execute department deletion
  const handleConfirmDeleteDepartment = async () => {
    if (!deletingDepartment) return;
    setDeleteDepartmentError(null);
    setDeleteDepartmentSuccessMessage(null);

    try {
      setIsDeletingDepartment(true);
      await deleteDepartment(deletingDepartment.department_id);

      setDeleteDepartmentSuccessMessage('Department deleted successfully.');

      // Remove from local list state
      setDepartments(prev => prev.filter(d => d.department_id !== deletingDepartment.department_id));

      // Update local users' department fields to null since ON DELETE SET NULL was triggered on DB
      setUsers(prev => prev.map(user => user.department_id === deletingDepartment.department_id ? { ...user, department_id: null, department_name: null } : user));

      // Update local documents' department fields to null since ON DELETE SET NULL was triggered on DB
      setDocuments(prev => prev.map(doc => doc.department_id === deletingDepartment.department_id ? { ...doc, department_id: null, department_name: null } : doc));

      setTimeout(() => {
        setDeletingDepartment(null);
        setDeleteDepartmentSuccessMessage(null);
      }, 1500);
    } catch (err) {
      console.error('Delete department error:', err);
      setDeleteDepartmentError(err.message || 'Failed to delete department');
    } finally {
      setIsDeletingDepartment(false);
    }
  };

  // Cancel Delete Department
  const handleCancelDeleteDepartment = () => {
    setDeletingDepartment(null);
    setDeleteDepartmentError(null);
    setDeleteDepartmentSuccessMessage(null);
  };

  // Fetch single document details and its version history when selectedDocId is set
  const handleViewDetails = async (docId) => {
    setSelectedDocId(docId);
    setIsDetailsLoading(true);
    setDetailsError(null);
    setSelectedDocDetails(null);
    
    setVersions([]);
    setVersionsError(null);
    setVersionRejections({});

    // Reset upload status
    setSelectedFile(null);
    setUploadError(null);
    setUploadSuccessMessage(null);

    // Reset review submit status
    setSubmitReviewError(null);
    setSubmitReviewSuccessMessage(null);

    // Reset approval/rejection state
    setApproveError(null);
    setRejectionError(null);
    setRejectionReason('');
    setIsRejectionModalOpen(false);
    
    try {
      // 1. Fetch core document details
      const docData = await fetchDocumentById(docId);
      setSelectedDocDetails(docData);
      
      // 2. Fetch versions (nested try-catch so failure doesn't block showing details)
      try {
        setIsVersionsLoading(true);
        const versionsData = await fetchDocumentVersions(docId);
        setVersions(versionsData);

        // Fetch rejections for all versions in parallel
        const rejectionsMap = {};
        await Promise.all(
          versionsData.map(async (v) => {
            try {
              const rejs = await fetchVersionRejections(docId, v.version_id);
              if (rejs && rejs.length > 0) {
                rejectionsMap[v.version_id] = rejs;
              }
            } catch (err) {
              console.error(`Error fetching rejections for version ${v.version_id}:`, err);
            }
          })
        );
        setVersionRejections(rejectionsMap);
      } catch (verErr) {
        console.error('Error fetching versions:', verErr);
        setVersionsError(verErr.message || 'Failed to load version history.');
      } finally {
        setIsVersionsLoading(false);
      }
      
    } catch (err) {
      console.error('Error fetching document details:', err);
      setDetailsError(err.message || 'Could not fetch document details.');
    } finally {
      setIsDetailsLoading(false);
    }
  };

  const handleBackToList = () => {
    setSelectedDocId(null);
    setSelectedDocDetails(null);
    setDetailsError(null);
    setVersions([]);
    setVersionsError(null);
    setVersionRejections({});
    
    // Clear upload states
    setSelectedFile(null);
    setManualFileName('');
    setUploadError(null);
    setUploadSuccessMessage(null);

    // Clear review states
    setSubmitReviewError(null);
    setSubmitReviewSuccessMessage(null);

    // Clear creation states
    setFormTitle('');
    setFormDescription('');
    setFormCategoryId('');
    setFormDepartmentId('');
    setCreateError(null);
    setCreateSuccessMessage(null);

    // Clear reviewer states
    setApproveError(null);
    setRejectionError(null);
    setRejectionReason('');
    setIsRejectionModalOpen(false);

    // Refresh list in background
    if (currentUser) {
      loadDocumentsList();
    }
  };

  // Upload new version handler
  const handleUploadVersion = async (e) => {
    e.preventDefault();
    if (!selectedFile && (!manualFileName || manualFileName.trim() === '')) return;

    try {
      setIsUploading(true);
      setUploadError(null);
      setUploadSuccessMessage(null);

      // If manual mock filename was supplied, create a mock File object
      const fileToUpload = selectedFile || new File(
        ["mock file content for browser automation test"], 
        manualFileName.trim().endsWith('.pdf') || manualFileName.trim().endsWith('.docx') 
          ? manualFileName.trim() 
          : `${manualFileName.trim()}.pdf`, 
        { type: manualFileName.trim().endsWith('.docx') ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 'application/pdf' }
      );

      // Perform upload request with logged-in user ID
      await uploadDocumentVersion(selectedDocDetails.doc_id, currentUser.user_id, fileToUpload);

      setUploadSuccessMessage('New version uploaded successfully!');
      setSelectedFile(null);
      setManualFileName('');

      // Refresh version list immediately
      const updatedVersions = await fetchDocumentVersions(selectedDocDetails.doc_id);
      setVersions(updatedVersions);
    } catch (err) {
      console.error('Error uploading version:', err);
      setUploadError(err.message || 'Failed to upload document version.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setUploadError(null);
      setUploadSuccessMessage(null);
    }
  };

  // Submit document for review handler
  const handleSubmitReview = async () => {
    try {
      setIsSubmittingReview(true);
      setSubmitReviewError(null);
      setSubmitReviewSuccessMessage(null);

      const updatedDoc = await submitDocumentForReview(selectedDocDetails.doc_id);
      
      setSelectedDocDetails(updatedDoc);
      setSubmitReviewSuccessMessage('Document submitted for review successfully.');
      
      // Update in documents list cache to keep views in sync
      setDocuments(prev => prev.map(doc => doc.doc_id === updatedDoc.doc_id ? { ...doc, status: updatedDoc.status } : doc));
    } catch (err) {
      console.error('Error submitting review:', err);
      setSubmitReviewError(err.message || 'Failed to submit document for review.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Approve and Archive document handler
  const handleApprove = async () => {
    try {
      setIsApproveLoading(true);
      setApproveError(null);

      const updatedDoc = await approveDocument(selectedDocDetails.doc_id, currentUser.user_id);
      setSelectedDocDetails(updatedDoc);

      // Refresh documents list cache
      setDocuments(prev => prev.map(doc => doc.doc_id === updatedDoc.doc_id ? { ...doc, status: updatedDoc.status } : doc));
    } catch (err) {
      console.error('Error approving document:', err);
      setApproveError(err.message || 'Failed to approve document.');
    } finally {
      setIsApproveLoading(false);
    }
  };

  // Get the latest version from state safely
  const getLatestVersion = () => {
    if (!versions || versions.length === 0) return null;
    return versions.reduce((prev, curr) => (prev.version_number > curr.version_number) ? prev : curr);
  };

  // Reject document version form submit handler
  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectionReason || rejectionReason.trim() === '') {
      setRejectionError('Rejection reason is required.');
      return;
    }

    const latestVer = getLatestVersion();
    if (!latestVer) {
      setRejectionError('No version found on this document to reject.');
      return;
    }

    try {
      setIsRejecting(true);
      setRejectionError(null);

      await rejectDocumentVersion(
        selectedDocDetails.doc_id,
        latestVer.version_id,
        currentUser.user_id,
        rejectionReason.trim()
      );

      // Refresh document details
      const updatedDoc = await fetchDocumentById(selectedDocDetails.doc_id);
      setSelectedDocDetails(updatedDoc);

      // Refresh versions & rejections map
      const updatedVersions = await fetchDocumentVersions(selectedDocDetails.doc_id);
      setVersions(updatedVersions);

      const rejectionsMap = {};
      await Promise.all(
        updatedVersions.map(async (v) => {
          try {
            const rejs = await fetchVersionRejections(selectedDocDetails.doc_id, v.version_id);
            if (rejs && rejs.length > 0) {
              rejectionsMap[v.version_id] = rejs;
            }
          } catch (err) {
            console.error(`Error fetching rejections for version ${v.version_id}:`, err);
          }
        })
      );
      setVersionRejections(rejectionsMap);

      // Refresh client list
      setDocuments(prev => prev.map(doc => doc.doc_id === updatedDoc.doc_id ? { ...doc, status: updatedDoc.status } : doc));

      // Reset rejection form state
      setRejectionReason('');
      setIsRejectionModalOpen(false);

    } catch (err) {
      console.error('Error rejecting document:', err);
      setRejectionError(err.message || 'Failed to reject document version.');
    } finally {
      setIsRejecting(false);
    }
  };

  // Create new document form submit handler
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    
    if (!formTitle || formTitle.trim() === '') {
      setCreateError('Title is required and cannot be empty.');
      return;
    }

    try {
      setIsCreating(true);
      setCreateError(null);
      setCreateSuccessMessage(null);

      const docPayload = {
        title: formTitle.trim(),
        description: formDescription.trim() || null,
        category_id: formCategoryId ? Number(formCategoryId) : null,
        department_id: formDepartmentId ? Number(formDepartmentId) : null,
        owner_id: currentUser.user_id, // Use currently logged-in user ID
        status: 'DRAFT'
      };

      const newDoc = await createDocument(docPayload);

      setCreateSuccessMessage('Document created successfully.');
      
      // Update client-side list cache
      setDocuments(prev => [newDoc, ...prev]);

      // Clear fields
      setFormTitle('');
      setFormDescription('');
      setFormCategoryId('');
      setFormDepartmentId('');

      // Move view directly into the details view of the newly created DRAFT document
      setTimeout(() => {
        setCurrentView('documents');
        handleViewDetails(newDoc.doc_id);
      }, 1000);

    } catch (err) {
      console.error('Error creating document:', err);
      setCreateError(err.message || 'Failed to create document.');
    } finally {
      setIsCreating(false);
    }
  };

  // Calculations for UI metrics
  const totalDocs = documents.length;
  const underReviewDocs = documents.filter(d => d.status === 'UNDER_REVIEW').length;
  const approvedOrArchivedDocs = documents.filter(d => d.status === 'APPROVED' || d.status === 'ARCHIVED').length;
  const rejectedDocs = documents.filter(d => d.status === 'REJECTED').length;

  // Admin dashboard metrics (dynamically calculated)
  const adminTotalUsers = users.length;
  const adminArchivedDocs = documents.filter(d => d.status === 'ARCHIVED').length;
  const adminDraftDocs = documents.filter(d => d.status === 'DRAFT').length;

  // Filter documents based on search term
  const filteredDocuments = documents.filter(doc => {
    const titleMatch = doc.title?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    const categoryMatch = doc.category_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    const departmentMatch = doc.department_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    const ownerMatch = doc.owner_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    
    return titleMatch || categoryMatch || departmentMatch || ownerMatch;
  });

  // Filter documents for the Admin Documents Registry
  const filteredAdminDocuments = documents.filter(doc => {
    // 1. Search term match (title, owner_name, category_name, department_name, doc_id)
    const s = adminSearchTerm.toLowerCase();
    const docIdStr = String(doc.doc_id);
    const titleMatch = doc.title?.toLowerCase().includes(s) || false;
    const ownerMatch = doc.owner_name?.toLowerCase().includes(s) || false;
    const categoryMatch = doc.category_name?.toLowerCase().includes(s) || false;
    const departmentMatch = doc.department_name?.toLowerCase().includes(s) || false;
    const idMatch = docIdStr.includes(s);

    const matchesSearch = titleMatch || ownerMatch || categoryMatch || departmentMatch || idMatch;

    // 2. Status match
    const matchesStatus = adminStatusFilter === 'ALL' || doc.status === adminStatusFilter;

    // 3. Category match
    const matchesCategory = adminCategoryFilter === 'ALL' || String(doc.category_id) === adminCategoryFilter;

    // 4. Department match
    const matchesDepartment = adminDepartmentFilter === 'ALL' || String(doc.department_id) === adminDepartmentFilter;

    return matchesSearch && matchesStatus && matchesCategory && matchesDepartment;
  });

  // Render Login view if user is not authenticated
  if (!currentUser) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: 'var(--bg-primary)', padding: '20px' }}>
        <div className="section-card" style={{ maxWidth: '400px', width: '100%', padding: '40px 30px', boxShadow: 'var(--shadow-md)', border: '1px solid var(--border-color)' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--accent-primary)', marginBottom: '12px' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <span style={{ fontSize: '1.8rem', fontWeight: '800', fontFamily: 'var(--font-heading)', letterSpacing: '0.02em' }}>InduDocs</span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Industrial Document Management Portal</p>
          </div>

          {loginError && (
            <div style={{ backgroundColor: 'var(--danger-glow)', border: '1px solid var(--danger)', color: 'var(--danger)', padding: '12px', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {loginError}
            </div>
          )}

          <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email / Username</label>
              <input 
                type="email" 
                placeholder="e.g. john@indudocs.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
                style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '12px 14px', color: 'var(--text-primary)', outline: 'none', fontSize: '0.9rem', transition: 'border-color var(--transition-fast)' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Password</label>
              <input 
                type="password" 
                placeholder="••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
                style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '12px 14px', color: 'var(--text-primary)', outline: 'none', fontSize: '0.9rem', transition: 'border-color var(--transition-fast)' }}
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={isLoggingIn}
              style={{ width: '100%', padding: '12px', fontSize: '0.95rem', fontWeight: '600', marginTop: '10px' }}
            >
              {isLoggingIn ? 'Logging in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Dashboard calculations for Awaiting Review (Reviewer Only)
  const awaitingReviewList = documents.filter(d => d.status === 'UNDER_REVIEW');

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-text">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <span>InduDocs</span>
          </div>
        </div>

        {currentUser.role === 'ADMIN' ? (
          <ul className="sidebar-menu">
            <li>
              <button 
                className={`sidebar-item-btn ${currentView === 'dashboard' ? 'active' : ''}`}
                onClick={() => {
                  setCurrentView('dashboard');
                  setSelectedDocId(null);
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="9" />
                  <rect x="14" y="3" width="7" height="5" />
                  <rect x="14" y="12" width="7" height="9" />
                  <rect x="3" y="16" width="7" height="5" />
                </svg>
                <span>Dashboard</span>
              </button>
            </li>
            <li>
              <button 
                className={`sidebar-item-btn ${currentView === 'users' ? 'active' : ''}`}
                onClick={() => {
                  setCurrentView('users');
                  setSelectedDocId(null);
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                <span>Users</span>
              </button>
            </li>
            <li>
              <button 
                className={`sidebar-item-btn ${currentView === 'documents' ? 'active' : ''}`}
                onClick={() => {
                  setCurrentView('documents');
                  setSelectedDocId(null);
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                <span>Documents</span>
              </button>
            </li>
            <li>
              <button 
                className={`sidebar-item-btn ${currentView === 'categories' ? 'active' : ''}`}
                onClick={() => {
                  setCurrentView('categories');
                  setSelectedDocId(null);
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="4" y1="9" x2="20" y2="9" />
                  <line x1="4" y1="15" x2="20" y2="15" />
                  <line x1="10" y1="3" x2="8" y2="21" />
                  <line x1="16" y1="3" x2="14" y2="21" />
                </svg>
                <span>Categories</span>
              </button>
            </li>
            <li>
              <button 
                className={`sidebar-item-btn ${currentView === 'departments' ? 'active' : ''}`}
                onClick={() => {
                  setCurrentView('departments');
                  setSelectedDocId(null);
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                </svg>
                <span>Departments</span>
              </button>
            </li>
            <li>
              <button 
                className={`sidebar-item-btn ${currentView === 'ai_assistant' ? 'active' : ''}`}
                onClick={() => {
                  setCurrentView('ai_assistant');
                  setSelectedDocId(null);
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="10" rx="2" />
                  <circle cx="12" cy="5" r="2" />
                  <path d="M12 7v4" />
                  <line x1="8" y1="16" x2="8" y2="16" />
                  <line x1="16" y1="16" x2="16" y2="16" />
                </svg>
                <span>AI Assistant</span>
              </button>
            </li>
          </ul>
        ) : (
          <ul className="sidebar-menu">
            <li>
              <button 
                className={`sidebar-item-btn ${currentView === 'dashboard' && selectedDocId === null ? 'active' : ''}`}
                onClick={() => {
                  setCurrentView('dashboard');
                  handleBackToList();
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="9" />
                  <rect x="14" y="3" width="7" height="5" />
                  <rect x="14" y="12" width="7" height="9" />
                  <rect x="3" y="16" width="7" height="5" />
                </svg>
                <span>Dashboard</span>
              </button>
            </li>
            <li>
              <button 
                className={`sidebar-item-btn ${(currentView === 'documents' || currentView === 'create_document') && selectedDocId === null ? 'active' : ''}`}
                onClick={() => {
                  setCurrentView('documents');
                  handleBackToList();
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
                <span>Documents</span>
              </button>
            </li>
            <li>
              <button 
                className={`sidebar-item-btn ${currentView === 'ai_assistant' && selectedDocId === null ? 'active' : ''}`}
                onClick={() => {
                  setCurrentView('ai_assistant');
                  setSelectedDocId(null);
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="10" rx="2" />
                  <circle cx="12" cy="5" r="2" />
                  <path d="M12 7v4" />
                  <line x1="8" y1="16" x2="8" y2="16" />
                  <line x1="16" y1="16" x2="16" y2="16" />
                </svg>
                <span>AI Assistant</span>
              </button>
            </li>
          </ul>
        )}

        <div className="sidebar-footer" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: 'auto' }}>
          {currentUser.role === 'ADMIN' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px', padding: '0 8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div className="user-avatar" style={{ width: '32px', height: '32px', minWidth: '32px' }}>
                  {currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {renderUserName(currentUser.name, currentUser.user_id)}
                  </span>
                  <span className="badge admin" style={{ fontSize: '0.65rem', padding: '2px 6px', width: 'fit-content', marginTop: '2px' }}>ADMIN</span>
                </div>
              </div>
              <button 
                className="btn btn-secondary" 
                onClick={handleLogout}
                style={{ width: '100%', padding: '6px 12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Logout
              </button>
            </div>
          )}
          <p>© 2026 InduDocs v1.0</p>
        </div>
      </aside>

      {/* Main Wrapper */}
      <div className="main-wrapper">
        {/* Top Header */}
        <header className="header">
          <div className="header-title-container">
            <h1>Industrial Document Management System</h1>
            <span className="header-subtitle">Local Dev Mode</span>
          </div>

          <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className="user-badge">
              <div className="user-avatar">
                {currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </div>
              <span className="user-name">
                {currentUser.name}{' '}
                <span style={{ fontSize: '0.85em', color: 'var(--text-secondary)', fontWeight: 'normal' }}>(#{currentUser.user_id})</span>
                {' '}·{' '}
                {currentUser.role === 'EMPLOYEE' ? 'Employee' : currentUser.role === 'REVIEWER' ? 'Reviewer' : 'Admin'}
              </span>
            </div>
            
            <button 
              className="btn btn-secondary" 
              onClick={handleLogout}
              style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Logout
            </button>
          </div>
        </header>

        {/* Content Body */}
        <main className="content-body">
          {currentUser.role === 'ADMIN' && selectedDocId === null ? (
            currentView === 'dashboard' ? (
              <AdminDashboard 
                documents={documents}
                isLoading={isLoading}
                error={error}
                adminTotalUsers={adminTotalUsers}
                totalDocs={totalDocs}
                underReviewDocs={underReviewDocs}
                adminArchivedDocs={adminArchivedDocs}
                adminDraftDocs={adminDraftDocs}
                rejectedDocs={rejectedDocs}
              />
            ) : currentView === 'users' ? (
              <div className="section-card">
                <div className="section-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h2>User Management</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
                      Manage system users and department assignments
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    {/* Search Bar */}
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', backgroundColor: 'var(--bg-tertiary)', padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', width: '250px' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)' }}>
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                      <input 
                        type="text" 
                        placeholder="Search users..." 
                        value={userSearchTerm}
                        onChange={(e) => setUserSearchTerm(e.target.value)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-primary)', outline: 'none', fontSize: '0.85rem', width: '100%' }}
                      />
                    </div>
                    {/* Create User Button */}
                    <button 
                      className="btn btn-primary"
                      onClick={() => {
                        setUserFormName('');
                        setUserFormEmail('');
                        setUserFormPassword('');
                        setUserFormRole('EMPLOYEE');
                        setUserFormDepartmentId('');
                        setCreateUserError(null);
                        setCreateUserSuccess(null);
                        setCurrentView('create_user');
                      }}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                      Create User
                    </button>
                  </div>
                </div>

                {isUsersLoading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '200px', gap: '16px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '4px solid var(--border-color)', borderTopColor: 'var(--accent-primary)', animation: 'spin 1s linear infinite' }}></div>
                    <p style={{ color: 'var(--text-secondary)' }}>Loading users...</p>
                  </div>
                ) : usersError ? (
                  <div style={{ borderLeft: '4px solid var(--danger)', backgroundColor: 'rgba(239, 68, 68, 0.05)', padding: '24px', borderRadius: 'var(--radius-sm)' }}>
                    <p style={{ color: 'var(--danger)', fontWeight: '500', marginBottom: '16px' }}>{usersError}</p>
                    <button className="btn btn-primary" onClick={loadUsers}>Try Again</button>
                  </div>
                ) : users.length === 0 ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <p style={{ fontSize: '1rem', fontWeight: '500' }}>No users found.</p>
                  </div>
                ) : (
                  <div>
                    {users.filter(user => {
                      const term = userSearchTerm.toLowerCase();
                      return (
                        (user.name && user.name.toLowerCase().includes(term)) ||
                        (user.email && user.email.toLowerCase().includes(term)) ||
                        (user.role && user.role.toLowerCase().includes(term)) ||
                        (user.department_name && user.department_name.toLowerCase().includes(term)) ||
                        String(user.user_id).includes(term)
                      );
                    }).length === 0 ? (
                      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        <p style={{ fontSize: '1rem', fontWeight: '500' }}>No users found matching your search.</p>
                      </div>
                    ) : (
                      <div className="table-container">
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th>ID</th>
                              <th>Name</th>
                              <th>Email</th>
                              <th>Role</th>
                              <th>Department</th>
                              <th>Created</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {users
                              .filter(user => {
                                const term = userSearchTerm.toLowerCase();
                                return (
                                  (user.name && user.name.toLowerCase().includes(term)) ||
                                  (user.email && user.email.toLowerCase().includes(term)) ||
                                  (user.role && user.role.toLowerCase().includes(term)) ||
                                  (user.department_name && user.department_name.toLowerCase().includes(term)) ||
                                  String(user.user_id).includes(term)
                                );
                              })
                              .map(user => (
                                <tr key={user.user_id}>
                                  <td>#{user.user_id}</td>
                                  <td style={{ fontWeight: '500' }}>{renderUserName(user.name, user.user_id)}</td>
                                  <td>{user.email}</td>
                                  <td>
                                    <span className={`badge ${
                                      user.role === 'ADMIN' ? 'admin' :
                                      user.role === 'REVIEWER' ? 'under_review' : 'draft'
                                    }`}>
                                      {user.role}
                                    </span>
                                  </td>
                                  <td>{user.department_name || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Unassigned</span>}</td>
                                  <td>{new Date(user.created_at).toLocaleString()}</td>
                                  <td>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                      <button 
                                        className="btn btn-secondary" 
                                        onClick={() => handleEditUser(user)}
                                        style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                                      >
                                        Edit
                                      </button>
                                      <button 
                                        className="btn" 
                                        disabled={currentUser?.user_id === user.user_id}
                                        onClick={() => handleDeleteUser(user)}
                                        title={currentUser?.user_id === user.user_id ? "You cannot delete your own account" : ""}
                                        style={{ 
                                          padding: '4px 10px', 
                                          fontSize: '0.8rem', 
                                          backgroundColor: currentUser?.user_id === user.user_id ? 'rgba(255, 255, 255, 0.05)' : 'rgba(239, 68, 68, 0.1)', 
                                          color: currentUser?.user_id === user.user_id ? 'var(--text-muted)' : 'var(--danger)', 
                                          border: currentUser?.user_id === user.user_id ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(239, 68, 68, 0.2)',
                                          cursor: currentUser?.user_id === user.user_id ? 'not-allowed' : 'pointer'
                                        }}
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            }
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : currentView === 'create_user' ? (
              <div className="section-card" style={{ maxWidth: '600px', margin: '0 auto', animation: 'fadeIn 0.3s ease-out' }}>
                <div className="section-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '20px' }}>
                  <h2>Create New User</h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
                    Register a new user account on the system
                  </p>
                </div>

                <form onSubmit={handleCreateUserSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {createUserError && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderLeft: '4px solid var(--danger)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', color: 'var(--danger)', fontSize: '0.9rem', fontWeight: '500' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      <span>{createUserError}</span>
                    </div>
                  )}

                  {createUserSuccess && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderLeft: '4px solid var(--success)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', color: 'var(--success)', fontSize: '0.9rem', fontWeight: '500' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span>{createUserSuccess}</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Full Name *</label>
                    <input 
                      type="text" 
                      placeholder="e.g. John Doe"
                      value={userFormName}
                      onChange={(e) => setUserFormName(e.target.value)}
                      disabled={isCreatingUser}
                      style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', color: 'var(--text-primary)', outline: 'none', fontSize: '0.9rem' }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Email Address *</label>
                    <input 
                      type="email" 
                      placeholder="e.g. john@example.com"
                      value={userFormEmail}
                      onChange={(e) => setUserFormEmail(e.target.value)}
                      disabled={isCreatingUser}
                      style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', color: 'var(--text-primary)', outline: 'none', fontSize: '0.9rem' }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Password *</label>
                    <input 
                      type="password" 
                      placeholder="••••••••"
                      value={userFormPassword}
                      onChange={(e) => setUserFormPassword(e.target.value)}
                      disabled={isCreatingUser}
                      style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', color: 'var(--text-primary)', outline: 'none', fontSize: '0.9rem' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Role *</label>
                      <select 
                        value={userFormRole}
                        onChange={(e) => setUserFormRole(e.target.value)}
                        disabled={isCreatingUser}
                        style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', color: 'var(--text-primary)', outline: 'none', fontSize: '0.9rem', cursor: 'pointer' }}
                      >
                        <option value="EMPLOYEE">EMPLOYEE</option>
                        <option value="REVIEWER">REVIEWER</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Department</label>
                      <select 
                        value={userFormDepartmentId}
                        onChange={(e) => setUserFormDepartmentId(e.target.value)}
                        disabled={isCreatingUser}
                        style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', color: 'var(--text-primary)', outline: 'none', fontSize: '0.9rem', cursor: 'pointer' }}
                      >
                        <option value="">No Department</option>
                        {departments.map(dept => (
                          <option key={dept.department_id} value={dept.department_id}>
                            {dept.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', marginTop: '12px', justifyContent: 'flex-end' }}>
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      onClick={handleCancelCreateUser}
                      disabled={isCreatingUser}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="btn btn-primary" 
                      disabled={isCreatingUser}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      {isCreatingUser ? 'Creating User...' : 'Create User'}
                    </button>
                  </div>
                </form>

                <style>{`
                  @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(8px); }
                    to { opacity: 1; transform: translateY(0); }
                  }
                `}</style>
              </div>
            ) : currentView === 'edit_user' ? (
              <div className="section-card" style={{ maxWidth: '600px', margin: '0 auto', animation: 'fadeIn 0.3s ease-out' }}>
                <div className="section-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '20px' }}>
                  <h2>Edit User</h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
                    Modify account details for {editingUser?.name}
                  </p>
                </div>

                <form onSubmit={handleEditUserSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {editUserError && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderLeft: '4px solid var(--danger)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', color: 'var(--danger)', fontSize: '0.9rem', fontWeight: '500' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      <span>{editUserError}</span>
                    </div>
                  )}

                  {editUserSuccessMessage && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderLeft: '4px solid var(--success)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', color: 'var(--success)', fontSize: '0.9rem', fontWeight: '500' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span>{editUserSuccessMessage}</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Full Name *</label>
                    <input 
                      type="text" 
                      placeholder="e.g. John Doe"
                      value={editUserName}
                      onChange={(e) => setEditUserName(e.target.value)}
                      disabled={isUpdatingUser}
                      style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', color: 'var(--text-primary)', outline: 'none', fontSize: '0.9rem' }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Email Address *</label>
                    <input 
                      type="email" 
                      placeholder="e.g. john@example.com"
                      value={editUserEmail}
                      onChange={(e) => setEditUserEmail(e.target.value)}
                      disabled={isUpdatingUser}
                      style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', color: 'var(--text-primary)', outline: 'none', fontSize: '0.9rem' }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Password</label>
                    <input 
                      type="password" 
                      placeholder="Leave blank to keep current password"
                      value={editUserPassword}
                      onChange={(e) => setEditUserPassword(e.target.value)}
                      disabled={isUpdatingUser}
                      style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', color: 'var(--text-primary)', outline: 'none', fontSize: '0.9rem' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Role *</label>
                      <select 
                        value={editUserRole}
                        onChange={(e) => setEditUserRole(e.target.value)}
                        disabled={isUpdatingUser}
                        style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', color: 'var(--text-primary)', outline: 'none', fontSize: '0.9rem', cursor: 'pointer' }}
                      >
                        <option value="EMPLOYEE">EMPLOYEE</option>
                        <option value="REVIEWER">REVIEWER</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Department</label>
                      <select 
                        value={editUserDepartmentId}
                        onChange={(e) => setEditUserDepartmentId(e.target.value)}
                        disabled={isUpdatingUser}
                        style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', color: 'var(--text-primary)', outline: 'none', fontSize: '0.9rem', cursor: 'pointer' }}
                      >
                        <option value="">No Department</option>
                        {departments.map(dept => (
                          <option key={dept.department_id} value={dept.department_id}>
                            {dept.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', marginTop: '12px', justifyContent: 'flex-end' }}>
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      onClick={handleCancelEditUser}
                      disabled={isUpdatingUser}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="btn btn-primary" 
                      disabled={isUpdatingUser}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      {isUpdatingUser ? 'Saving Changes...' : 'Save Changes'}
                    </button>
                  </div>
                </form>

                <style>{`
                  @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(8px); }
                    to { opacity: 1; transform: translateY(0); }
                  }
                `}</style>
              </div>
            ) : currentView === 'categories' ? (
              <div className="section-card">
                <div className="section-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h2>Categories</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
                      Manage system document categories and classification
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    {/* Search Bar */}
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', backgroundColor: 'var(--bg-tertiary)', padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', width: '250px' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)' }}>
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                      <input 
                        type="text" 
                        placeholder="Search categories..." 
                        value={categorySearchTerm}
                        onChange={(e) => setCategorySearchTerm(e.target.value)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-primary)', outline: 'none', fontSize: '0.85rem', width: '100%' }}
                      />
                    </div>
                    {/* Create Category Button */}
                    <button 
                      className="btn btn-primary"
                      onClick={() => {
                        setCategoryFormName('');
                        setCategoryFormDescription('');
                        setCreateCategoryError(null);
                        setCreateCategorySuccess(null);
                        setCurrentView('create_category');
                      }}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                      Create Category
                    </button>
                  </div>
                </div>

                {isCategoriesLoading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '200px', gap: '16px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '4px solid var(--border-color)', borderTopColor: 'var(--accent-primary)', animation: 'spin 1s linear infinite' }}></div>
                    <p style={{ color: 'var(--text-secondary)' }}>Loading categories...</p>
                  </div>
                ) : categoriesError ? (
                  <div style={{ borderLeft: '4px solid var(--danger)', backgroundColor: 'rgba(239, 68, 68, 0.05)', padding: '24px', borderRadius: 'var(--radius-sm)' }}>
                    <p style={{ color: 'var(--danger)', fontWeight: '500', marginBottom: '16px' }}>{categoriesError}</p>
                    <button className="btn btn-primary" onClick={loadCategories}>Try Again</button>
                  </div>
                ) : categories.length === 0 ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <p style={{ fontSize: '1rem', fontWeight: '500' }}>No categories found.</p>
                  </div>
                ) : (
                  <div>
                    {categories.filter(category => {
                      const term = categorySearchTerm.toLowerCase();
                      return (
                        (category.category_name && category.category_name.toLowerCase().includes(term)) ||
                        (category.description && category.description.toLowerCase().includes(term))
                      );
                    }).length === 0 ? (
                      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        <p style={{ fontSize: '1rem', fontWeight: '500' }}>No categories found matching your search.</p>
                      </div>
                    ) : (
                      <div className="table-container">
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th>ID</th>
                              <th>Category Name</th>
                              <th>Description</th>
                              <th>Document Count</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {categories
                              .filter(category => {
                                const term = categorySearchTerm.toLowerCase();
                                return (
                                  (category.category_name && category.category_name.toLowerCase().includes(term)) ||
                                  (category.description && category.description.toLowerCase().includes(term))
                                );
                              })
                              .map(category => (
                                <tr key={category.category_id}>
                                  <td>#{category.category_id}</td>
                                  <td style={{ fontWeight: '500' }}>{category.category_name}</td>
                                  <td style={{ color: 'var(--text-secondary)' }}>{category.description || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No description</span>}</td>
                                  <td>
                                    {Number(category.document_count) > 0 ? (
                                      <span className="badge info" style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: '600' }}>
                                        {category.document_count} {Number(category.document_count) === 1 ? 'document' : 'documents'}
                                      </span>
                                    ) : (
                                      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>0 documents</span>
                                    )}
                                  </td>
                                  <td>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                      <button 
                                        className="btn btn-secondary" 
                                        onClick={() => handleEditCategory(category)}
                                        style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                                      >
                                        Edit
                                      </button>
                                      <button 
                                        className="btn" 
                                        onClick={() => handleDeleteCategory(category)}
                                        style={{ 
                                          padding: '4px 10px', 
                                          fontSize: '0.8rem', 
                                          backgroundColor: 'rgba(239, 68, 68, 0.1)', 
                                          color: 'var(--danger)', 
                                          border: '1px solid rgba(239, 68, 68, 0.2)',
                                          cursor: 'pointer'
                                        }}
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            }
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : currentView === 'create_category' ? (
              <div className="section-card" style={{ maxWidth: '600px', margin: '0 auto', animation: 'fadeIn 0.3s ease-out' }}>
                <div className="section-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '24px' }}>
                  <h2>Create Category</h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
                    Add a new category classification for system documents
                  </p>
                </div>

                <form onSubmit={handleCreateCategorySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {createCategoryError && (
                    <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', color: 'var(--danger)', padding: '12px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      {createCategoryError}
                    </div>
                  )}

                  {createCategorySuccess && (
                    <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--success)', color: 'var(--success)', padding: '12px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      {createCategorySuccess}
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Category Name *</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Health & Safety Audits"
                      value={categoryFormName}
                      onChange={(e) => setCategoryFormName(e.target.value)}
                      disabled={isCreatingCategory}
                      maxLength={100}
                      style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', color: 'var(--text-primary)', outline: 'none', fontSize: '0.9rem' }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Description</label>
                    <textarea 
                      placeholder="Specify the purpose of this document classification..."
                      value={categoryFormDescription}
                      onChange={(e) => setCategoryFormDescription(e.target.value)}
                      disabled={isCreatingCategory}
                      rows="4"
                      style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', color: 'var(--text-primary)', outline: 'none', fontSize: '0.9rem', resize: 'vertical', fontFamily: 'inherit' }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '12px', marginTop: '12px', justifyContent: 'flex-end' }}>
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      onClick={handleCancelCreateCategory}
                      disabled={isCreatingCategory}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="btn btn-primary" 
                      disabled={isCreatingCategory}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      {isCreatingCategory ? 'Creating Category...' : 'Create Category'}
                    </button>
                  </div>
                </form>
              </div>
            ) : currentView === 'edit_category' ? (
              <div className="section-card" style={{ maxWidth: '600px', margin: '0 auto', animation: 'fadeIn 0.3s ease-out' }}>
                <div className="section-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '24px' }}>
                  <h2>Edit Category</h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
                    Modify system category configuration and details
                  </p>
                </div>

                <form onSubmit={handleEditCategorySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {editCategoryError && (
                    <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', color: 'var(--danger)', padding: '12px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      {editCategoryError}
                    </div>
                  )}

                  {editCategorySuccessMessage && (
                    <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--success)', color: 'var(--success)', padding: '12px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      {editCategorySuccessMessage}
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Category Name *</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Health & Safety Audits"
                      value={editCategoryName}
                      onChange={(e) => setEditCategoryName(e.target.value)}
                      disabled={isUpdatingCategory}
                      maxLength={100}
                      style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', color: 'var(--text-primary)', outline: 'none', fontSize: '0.9rem' }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Description</label>
                    <textarea 
                      placeholder="Specify the purpose of this document classification..."
                      value={editCategoryDescription}
                      onChange={(e) => setEditCategoryDescription(e.target.value)}
                      disabled={isUpdatingCategory}
                      rows="4"
                      style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', color: 'var(--text-primary)', outline: 'none', fontSize: '0.9rem', resize: 'vertical', fontFamily: 'inherit' }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '12px', marginTop: '12px', justifyContent: 'flex-end' }}>
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      onClick={handleCancelEditCategory}
                      disabled={isUpdatingCategory}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="btn btn-primary" 
                      disabled={isUpdatingCategory}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      {isUpdatingCategory ? 'Saving Changes...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            ) : currentView === 'departments' ? (
              <div className="section-card">
                <div className="section-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h2>Departments</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
                      Manage system departments and user allocations
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    {/* Search Bar */}
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', backgroundColor: 'var(--bg-tertiary)', padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', width: '250px' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)' }}>
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                      <input 
                        type="text" 
                        placeholder="Search departments..." 
                        value={departmentSearchTerm}
                        onChange={(e) => setDepartmentSearchTerm(e.target.value)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-primary)', outline: 'none', fontSize: '0.85rem', width: '100%' }}
                      />
                    </div>
                    {/* Create Department Button */}
                    <button 
                      className="btn btn-primary"
                      onClick={() => {
                        setDepartmentFormName('');
                        setDepartmentFormDescription('');
                        setCreateDepartmentError(null);
                        setCreateDepartmentSuccess(null);
                        setCurrentView('create_department');
                      }}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                      Create Department
                    </button>
                  </div>
                </div>

                {isDepartmentsLoading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '200px', gap: '16px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '4px solid var(--border-color)', borderTopColor: 'var(--accent-primary)', animation: 'spin 1s linear infinite' }}></div>
                    <p style={{ color: 'var(--text-secondary)' }}>Loading departments...</p>
                  </div>
                ) : departmentsError ? (
                  <div style={{ borderLeft: '4px solid var(--danger)', backgroundColor: 'rgba(239, 68, 68, 0.05)', padding: '24px', borderRadius: 'var(--radius-sm)' }}>
                    <p style={{ color: 'var(--danger)', fontWeight: '500', marginBottom: '16px' }}>{departmentsError}</p>
                    <button className="btn btn-primary" onClick={loadDepartments}>Try Again</button>
                  </div>
                ) : departments.length === 0 ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <p style={{ fontSize: '1rem', fontWeight: '500' }}>No departments found.</p>
                  </div>
                ) : (
                  <div>
                    {departments.filter(dept => {
                      const term = departmentSearchTerm.toLowerCase();
                      return (
                        (dept.name && dept.name.toLowerCase().includes(term)) ||
                        (dept.description && dept.description.toLowerCase().includes(term))
                      );
                    }).length === 0 ? (
                      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        <p style={{ fontSize: '1rem', fontWeight: '500' }}>No departments found matching your search.</p>
                      </div>
                    ) : (
                      <div className="table-container">
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th>ID</th>
                              <th>Department Name</th>
                              <th>Description</th>
                              <th style={{ textAlign: 'right' }}>Users</th>
                              <th style={{ textAlign: 'right' }}>Documents</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {departments
                              .filter(dept => {
                                const term = departmentSearchTerm.toLowerCase();
                                return (
                                  (dept.name && dept.name.toLowerCase().includes(term)) ||
                                  (dept.description && dept.description.toLowerCase().includes(term))
                                );
                              })
                              .map(dept => (
                                <tr key={dept.department_id}>
                                  <td>#{dept.department_id}</td>
                                  <td style={{ fontWeight: '500' }}>{dept.name}</td>
                                  <td style={{ color: 'var(--text-secondary)' }}>{dept.description || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No description</span>}</td>
                                  <td style={{ textAlign: 'right' }}>
                                    {Number(dept.user_count) > 0 ? (
                                      <span className="badge info" style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: '600' }}>
                                        {dept.user_count} {Number(dept.user_count) === 1 ? 'user' : 'users'}
                                      </span>
                                    ) : (
                                      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>0 users</span>
                                    )}
                                  </td>
                                  <td style={{ textAlign: 'right' }}>
                                    {Number(dept.document_count) > 0 ? (
                                      <span className="badge success" style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: '600', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                                        {dept.document_count} {Number(dept.document_count) === 1 ? 'document' : 'documents'}
                                      </span>
                                    ) : (
                                      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>0 documents</span>
                                    )}
                                  </td>
                                  <td>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                      <button 
                                        className="btn btn-secondary" 
                                        onClick={() => handleEditDepartment(dept)}
                                        style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                                      >
                                        Edit
                                      </button>
                                      <button 
                                        className="btn" 
                                        onClick={() => handleDeleteDepartment(dept)}
                                        style={{ 
                                          padding: '4px 10px', 
                                          fontSize: '0.8rem', 
                                          backgroundColor: 'rgba(239, 68, 68, 0.1)', 
                                          color: 'var(--danger)', 
                                          border: '1px solid rgba(239, 68, 68, 0.2)',
                                          cursor: 'pointer'
                                        }}
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            }
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : currentView === 'create_department' ? (
              <div className="section-card" style={{ maxWidth: '600px', margin: '0 auto', animation: 'fadeIn 0.3s ease-out' }}>
                <div className="section-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '24px' }}>
                  <h2>Create Department</h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
                    Add a new department configuration for system users and documents
                  </p>
                </div>

                <form onSubmit={handleCreateDepartmentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {createDepartmentError && (
                    <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', color: 'var(--danger)', padding: '12px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      {createDepartmentError}
                    </div>
                  )}

                  {createDepartmentSuccess && (
                    <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--success)', color: 'var(--success)', padding: '12px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      {createDepartmentSuccess}
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Department Name *</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Research and Development"
                      value={departmentFormName}
                      onChange={(e) => setDepartmentFormName(e.target.value)}
                      disabled={isCreatingDepartment}
                      maxLength={100}
                      style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', color: 'var(--text-primary)', outline: 'none', fontSize: '0.9rem' }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Description</label>
                    <textarea 
                      placeholder="Specify the purpose or focus of this department..."
                      value={departmentFormDescription}
                      onChange={(e) => setDepartmentFormDescription(e.target.value)}
                      disabled={isCreatingDepartment}
                      rows="4"
                      style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', color: 'var(--text-primary)', outline: 'none', fontSize: '0.9rem', resize: 'vertical', fontFamily: 'inherit' }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '12px', marginTop: '12px', justifyContent: 'flex-end' }}>
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      onClick={handleCancelCreateDepartment}
                      disabled={isCreatingDepartment}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="btn btn-primary" 
                      disabled={isCreatingDepartment}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      {isCreatingDepartment ? 'Creating Department...' : 'Create Department'}
                    </button>
                  </div>
                </form>
              </div>
            ) : currentView === 'edit_department' ? (
              <div className="section-card" style={{ maxWidth: '600px', margin: '0 auto', animation: 'fadeIn 0.3s ease-out' }}>
                <div className="section-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '24px' }}>
                  <h2>Edit Department</h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
                    Modify system department configuration and details
                  </p>
                </div>

                <form onSubmit={handleEditDepartmentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {editDepartmentError && (
                    <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', color: 'var(--danger)', padding: '12px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      {editDepartmentError}
                    </div>
                  )}

                  {editDepartmentSuccessMessage && (
                    <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--success)', color: 'var(--success)', padding: '12px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      {editDepartmentSuccessMessage}
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Department Name *</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Research and Development"
                      value={editDepartmentName}
                      onChange={(e) => setEditDepartmentName(e.target.value)}
                      disabled={isUpdatingDepartment}
                      maxLength={100}
                      style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', color: 'var(--text-primary)', outline: 'none', fontSize: '0.9rem' }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Description</label>
                    <textarea 
                      placeholder="Specify the purpose or focus of this department..."
                      value={editDepartmentDescription}
                      onChange={(e) => setEditDepartmentDescription(e.target.value)}
                      disabled={isUpdatingDepartment}
                      rows="4"
                      style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', color: 'var(--text-primary)', outline: 'none', fontSize: '0.9rem', resize: 'vertical', fontFamily: 'inherit' }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '12px', marginTop: '12px', justifyContent: 'flex-end' }}>
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      onClick={handleCancelEditDepartment}
                      disabled={isUpdatingDepartment}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="btn btn-primary" 
                      disabled={isUpdatingDepartment}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      {isUpdatingDepartment ? 'Saving Changes...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            ) : currentView === 'documents' ? (
              <div className="section-card" style={{ animation: 'fadeIn 0.3s ease-out' }}>
                <div className="section-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '20px' }}>
                  <div>
                    <h2>Documents Registry</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
                      Administrative document registry, search, and details inspection
                    </p>
                  </div>
                </div>

                {/* Filters Row */}
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
                  {/* Search Bar */}
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', backgroundColor: 'var(--bg-tertiary)', padding: '8px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', minWidth: '240px', flex: 1 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)' }}>
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input 
                      type="text" 
                      placeholder="Search documents by ID, title, owner, category or department..." 
                      value={adminSearchTerm}
                      onChange={(e) => setAdminSearchTerm(e.target.value)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-primary)', outline: 'none', fontSize: '0.9rem', width: '100%' }}
                    />
                  </div>

                  {/* Status Filter */}
                  <select 
                    value={adminStatusFilter}
                    onChange={(e) => setAdminStatusFilter(e.target.value)}
                    style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '8px 14px', color: 'var(--text-primary)', outline: 'none', fontSize: '0.9rem', cursor: 'pointer', minWidth: '150px' }}
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="DRAFT">DRAFT</option>
                    <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                    <option value="REJECTED">REJECTED</option>
                    <option value="APPROVED">APPROVED</option>
                    <option value="ARCHIVED">ARCHIVED</option>
                  </select>

                  {/* Category Filter */}
                  <select 
                    value={adminCategoryFilter}
                    onChange={(e) => setAdminCategoryFilter(e.target.value)}
                    style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '8px 14px', color: 'var(--text-primary)', outline: 'none', fontSize: '0.9rem', cursor: 'pointer', minWidth: '160px' }}
                  >
                    <option value="ALL">All Categories</option>
                    {categories.map(cat => (
                      <option key={cat.category_id} value={cat.category_id}>
                        {cat.category_name}
                      </option>
                    ))}
                  </select>

                  {/* Department Filter */}
                  <select 
                    value={adminDepartmentFilter}
                    onChange={(e) => setAdminDepartmentFilter(e.target.value)}
                    style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '8px 14px', color: 'var(--text-primary)', outline: 'none', fontSize: '0.9rem', cursor: 'pointer', minWidth: '160px' }}
                  >
                    <option value="ALL">All Departments</option>
                    {departments.map(dept => (
                      <option key={dept.department_id} value={dept.department_id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Content Area */}
                {isLoading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '200px', gap: '16px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '4px solid var(--border-color)', borderTopColor: 'var(--accent-primary)', animation: 'spin 1s linear infinite' }}></div>
                    <p style={{ color: 'var(--text-secondary)' }}>Loading documents...</p>
                  </div>
                ) : error ? (
                  <div style={{ borderLeft: '4px solid var(--danger)', backgroundColor: 'rgba(239, 68, 68, 0.05)', padding: '24px', borderRadius: 'var(--radius-sm)' }}>
                    <p style={{ color: 'var(--danger)', fontWeight: '500', marginBottom: '16px' }}>⚠ {error}</p>
                    <button className="btn btn-primary" onClick={loadDocumentsList}>Try Again</button>
                  </div>
                ) : documents.length === 0 ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <p style={{ fontSize: '1rem', fontWeight: '500' }}>No documents found.</p>
                  </div>
                ) : filteredAdminDocuments.length === 0 ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <p style={{ fontSize: '1rem', fontWeight: '500' }}>No documents found matching your filters.</p>
                  </div>
                ) : (
                  <div className="table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Title</th>
                          <th>Category</th>
                          <th>Department</th>
                          <th>Owner</th>
                          <th>Status</th>
                          <th>Updated</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAdminDocuments.map(doc => (
                          <tr key={doc.doc_id}>
                            <td>#{doc.doc_id}</td>
                            <td style={{ fontWeight: '500' }}>{doc.title}</td>
                            <td>{doc.category_name || 'Unassigned'}</td>
                            <td>{doc.department_name || 'Unassigned'}</td>
                            <td>{renderUserName(doc.owner_name, doc.owner_id) || 'System'}</td>
                            <td>
                              <span className={`badge ${doc.status.toLowerCase()}`}>
                                {doc.status}
                              </span>
                            </td>
                            <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                              {new Date(doc.updated_at || doc.created_at).toLocaleString()}
                            </td>
                            <td>
                              <div className="btn-group">
                                <button 
                                  className="btn btn-secondary"
                                  onClick={() => handleViewDetails(doc.doc_id)}
                                >
                                  Details
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : currentView === 'ai_assistant' ? (
              renderAIAssistant()
            ) : (
              <div className="section-card">
                <div className="section-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '20px' }}>
                  <h2 style={{ textTransform: 'capitalize' }}>{currentView}</h2>
                </div>
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '16px' }}>
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <p style={{ fontSize: '1rem', fontWeight: '500' }}>Coming soon</p>
                </div>
              </div>
            )
          ) : selectedDocId !== null ? (
            /* Document Details View */
            isDetailsLoading ? (
              <div className="section-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '16px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '4px solid var(--border-color)', borderTopColor: 'var(--accent-primary)', animation: 'spin 1s linear infinite' }}></div>
                <p style={{ color: 'var(--text-secondary)' }}>Retrieving document details...</p>
                <style>{`
                  @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                  }
                `}</style>
              </div>
            ) : detailsError ? (
              <div className="section-card" style={{ borderLeft: '4px solid var(--danger)', backgroundColor: 'rgba(239, 68, 68, 0.05)', padding: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <h3 style={{ color: 'var(--text-primary)' }}>Error Loading Details</h3>
                </div>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>{detailsError}</p>
                <button className="btn btn-secondary" onClick={handleBackToList}>
                  Back to Documents
                </button>
              </div>
            ) : selectedDocDetails ? (
              <div className="section-card" style={{ animation: 'fadeIn 0.3s ease' }}>
                {/* Header Section */}
                <div className="section-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '24px' }}>
                  <div>
                    <h2 style={{ fontSize: '1.6rem', color: 'var(--text-primary)' }}>{selectedDocDetails.title}</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
                      Registry Reference ID: #{selectedDocDetails.doc_id}
                    </p>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    {/* Employee Only Review submission */}
                    {currentUser.role === 'EMPLOYEE' && selectedDocDetails.status === 'DRAFT' && (
                      versions.length > 0 ? (
                        <button 
                          className="btn btn-primary" 
                          onClick={handleSubmitReview}
                          disabled={isSubmittingReview}
                          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="22" y1="2" x2="11" y2="13" />
                            <polygon points="22 2 15 22 11 13 2 9 22 2" />
                          </svg>
                          {isSubmittingReview ? 'Submitting...' : 'Submit for Review'}
                        </button>
                      ) : (
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontStyle: 'italic', border: '1px dashed var(--border-color)', padding: '8px 12px', borderRadius: 'var(--radius-sm)' }}>
                          Upload at least one document version before submitting for review.
                        </div>
                      )
                    )}

                    {/* Employee Only Review resubmission of rejected documents */}
                    {currentUser.role === 'EMPLOYEE' && selectedDocDetails.status === 'REJECTED' && (
                      <button 
                        className="btn btn-primary" 
                        onClick={handleSubmitReview}
                        disabled={isSubmittingReview}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="22" y1="2" x2="11" y2="13" />
                          <polygon points="22 2 15 22 11 13 2 9 22 2" />
                        </svg>
                        {isSubmittingReview ? 'Resubmitting...' : 'Resubmit for Review'}
                      </button>
                    )}

                    {/* Reviewer Only Approve / Reject controls */}
                    {currentUser.role === 'REVIEWER' && selectedDocDetails.status === 'UNDER_REVIEW' && (
                      versions.length === 0 ? (
                        <div style={{ color: 'var(--danger)', fontWeight: '600', fontSize: '0.9rem', padding: '8px 14px', border: '1px solid var(--danger)', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--danger-glow)' }}>
                          This document has no uploaded version and cannot be reviewed.
                        </div>
                      ) : (
                        <>
                          <button 
                            className="btn btn-primary"
                            onClick={handleApprove}
                            disabled={isApproveLoading}
                            style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'var(--success)', borderColor: 'var(--success)' }}
                          >
                            {isApproveLoading ? 'Approving...' : 'Approve & Archive'}
                          </button>
                          <button 
                            className="btn btn-primary"
                            onClick={() => {
                              setIsRejectionModalOpen(true);
                              setRejectionError(null);
                              setRejectionReason('');
                            }}
                            style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'var(--danger)', borderColor: 'var(--danger)' }}
                          >
                            Reject Document
                          </button>
                        </>
                      )
                    )}
                    
                    {currentUser.role === 'ADMIN' && (
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', border: '1px solid var(--border-color)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-tertiary)', fontWeight: '500' }}>
                        Read-only administrative inspection
                      </div>
                    )}
                    
                    <button className="btn btn-secondary" onClick={handleBackToList} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="19" y1="12" x2="5" y2="12" />
                        <polyline points="12 19 5 12 12 5" />
                      </svg>
                      Back to Documents
                    </button>
                  </div>
                </div>

                {/* Reviewer rejection form panel */}
                {isRejectionModalOpen && (
                  <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '20px', marginBottom: '24px', animation: 'fadeIn 0.2s ease' }}>
                    <h4 style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '12px', fontWeight: '600' }}>Reject Document</h4>
                    
                    {rejectionError && (
                      <div style={{ backgroundColor: 'var(--danger-glow)', border: '1px solid var(--danger)', color: 'var(--danger)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', marginBottom: '12px', fontWeight: '500' }}>
                        {rejectionError}
                      </div>
                    )}

                    <form onSubmit={handleRejectSubmit}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
                        <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Reason for Rejection <span style={{ color: 'var(--danger)' }}>*</span></label>
                        <textarea
                          placeholder="Please explain why this document is being rejected..."
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          required
                          rows={3}
                          style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', color: 'var(--text-primary)', outline: 'none', fontSize: '0.9rem', resize: 'vertical' }}
                        />
                      </div>

                      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                        <button 
                          type="button" 
                          className="btn btn-secondary" 
                          onClick={() => {
                            setIsRejectionModalOpen(false);
                            setRejectionReason('');
                            setRejectionError(null);
                          }}
                          disabled={isRejecting}
                        >
                          Cancel
                        </button>
                        <button 
                          type="submit" 
                          className="btn btn-primary" 
                          disabled={isRejecting}
                          style={{ backgroundColor: 'var(--danger)', borderColor: 'var(--danger)' }}
                        >
                          {isRejecting ? 'Rejecting...' : 'Confirm Rejection'}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Review Action Status Banners */}
                {submitReviewSuccessMessage && (
                  <div style={{ backgroundColor: 'var(--success-glow)', border: '1px solid var(--success)', color: 'var(--success)', padding: '12px 16px', borderRadius: 'var(--radius-md)', fontSize: '0.9rem', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    {submitReviewSuccessMessage}
                  </div>
                )}

                {submitReviewError && (
                  <div style={{ backgroundColor: 'var(--danger-glow)', border: '1px solid var(--danger)', color: 'var(--danger)', padding: '12px 16px', borderRadius: 'var(--radius-md)', fontSize: '0.9rem', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    {submitReviewError}
                  </div>
                )}

                {approveError && (
                  <div style={{ backgroundColor: 'var(--danger-glow)', border: '1px solid var(--danger)', color: 'var(--danger)', padding: '12px 16px', borderRadius: 'var(--radius-md)', fontSize: '0.9rem', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    {approveError}
                  </div>
                )}

                {/* Core Document Info Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
                  {/* Left Column: Description */}
                  <div>
                    <h3 style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
                      Document Description
                    </h3>
                    <div style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '20px', minHeight: '160px', color: 'var(--text-primary)' }}>
                      {selectedDocDetails.description || 'No description provided for this industrial record.'}
                    </div>
                  </div>

                  {/* Right Column: Metadata & Upload Form */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <h3 style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Metadata & Workflow State
                    </h3>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '20px' }}>
                      <div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Category</span>
                        <strong style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                          {selectedDocDetails.category_name || 'Unassigned'}
                        </strong>
                      </div>
                      
                      <div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Department</span>
                        <strong style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                          {selectedDocDetails.department_name || 'Unassigned'}
                        </strong>
                      </div>

                      <div style={{ gridColumn: 'span 2', borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '4px' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Owner / Creator</span>
                        <strong style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                          {renderUserName(selectedDocDetails.owner_name, selectedDocDetails.owner_id)}
                        </strong>
                      </div>

                      <div style={{ gridColumn: 'span 2', borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '4px' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Status State</span>
                        <div>
                          <span className={`badge ${selectedDocDetails.status.toLowerCase()}`} style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
                            {selectedDocDetails.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Timestamps */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', padding: '0 8px' }}>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Created Timestamp</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          {new Date(selectedDocDetails.created_at).toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Last Updated</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          {new Date(selectedDocDetails.updated_at).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Upload Section - Employee Only */}
                    {currentUser.role === 'EMPLOYEE' && (
                      <div style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '20px', marginTop: '8px' }}>
                        <h4 style={{ fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="17 8 12 3 7 8" />
                            <line x1="12" y1="3" x2="12" y2="15" />
                          </svg>
                          Upload New Version
                        </h4>

                        {uploadSuccessMessage && (
                          <div style={{ backgroundColor: 'var(--success-glow)', border: '1px solid var(--success)', color: 'var(--success)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', marginBottom: '12px', fontWeight: '500' }}>
                            {uploadSuccessMessage}
                          </div>
                        )}

                        {uploadError && (
                          <div style={{ backgroundColor: 'var(--danger-glow)', border: '1px solid var(--danger)', color: 'var(--danger)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', marginBottom: '12px', fontWeight: '500' }}>
                            {uploadError}
                          </div>
                        )}

                        <form onSubmit={handleUploadVersion}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <label 
                              style={{ 
                                display: 'flex', 
                                flexDirection: 'column', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                border: '2px dashed var(--border-color)', 
                                borderRadius: 'var(--radius-sm)', 
                                padding: '16px', 
                                cursor: 'pointer', 
                                backgroundColor: 'rgba(255, 255, 255, 0.02)', 
                                transition: 'border-color var(--transition-fast)' 
                              }}
                              onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--accent-primary)'} 
                              onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
                            >
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '500', textAlign: 'center' }}>
                                {selectedFile ? `Selected: ${selectedFile.name}` : 'Click to select PDF or DOCX file'}
                              </span>
                              <input 
                                key={selectedFile ? selectedFile.name : 'empty'}
                                type="file" 
                                accept=".pdf,.docx" 
                                onChange={handleFileChange}
                                style={{ display: 'none' }}
                              />
                            </label>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                                Or enter manual mock filename:
                              </label>
                              <input 
                                type="text"
                                placeholder="e.g. ventilation_audit.pdf"
                                value={manualFileName}
                                onChange={(e) => setManualFileName(e.target.value)}
                                style={{ 
                                  backgroundColor: 'var(--bg-secondary)', 
                                  border: '1px solid var(--border-color)', 
                                  borderRadius: 'var(--radius-sm)', 
                                  padding: '8px 12px', 
                                  color: 'var(--text-primary)', 
                                  outline: 'none', 
                                  fontSize: '0.8rem' 
                                }}
                              />
                            </div>

                            <button 
                              type="submit" 
                              className="btn btn-primary"
                              disabled={(!selectedFile && (!manualFileName || manualFileName.trim() === '')) || isUploading}
                              style={{ 
                                width: '100%', 
                                padding: '10px', 
                                fontSize: '0.85rem', 
                                cursor: (!selectedFile && (!manualFileName || manualFileName.trim() === '') || isUploading) ? 'not-allowed' : 'pointer', 
                                opacity: (!selectedFile && (!manualFileName || manualFileName.trim() === '') || isUploading) ? 0.6 : 1 
                              }}
                            >
                              {isUploading ? 'Uploading version...' : 'Upload Version'}
                            </button>
                          </div>
                        </form>
                      </div>
                    )}

                  </div>
                </div>

                {/* Divider Line */}
                <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '32px 0' }} />

                {/* Versions Section */}
                <div>
                  <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 8v4l3 3" />
                      <circle cx="12" cy="12" r="10" />
                    </svg>
                    Document Version History
                  </h3>

                  {isVersionsLoading ? (
                    <p style={{ color: 'var(--text-secondary)', padding: '16px 0' }}>Retrieving version history...</p>
                  ) : versionsError ? (
                    <div style={{ color: 'var(--danger)', padding: '16px', backgroundColor: 'rgba(239, 68, 68, 0.05)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                      {versionsError}
                    </div>
                  ) : versions.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', padding: '16px 0' }}>
                      No versions available.
                    </p>
                  ) : (
                    <div className="table-container">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Version</th>
                            <th>Original File Name</th>
                            <th>Uploaded By</th>
                            <th>Upload Date</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {versions.map(ver => (
                            <tr key={ver.version_id}>
                              <td style={{ fontFamily: 'var(--font-heading)', fontWeight: '700', color: 'var(--accent-primary)' }}>
                                V{ver.version_number}
                              </td>
                              <td>
                                <div style={{ fontWeight: '500' }}>{ver.file_name}</div>
                                {/* Rejection logs rendering below the version file name */}
                                {versionRejections[ver.version_id] && versionRejections[ver.version_id].map(rej => (
                                  <div key={rej.rejection_id} style={{ marginTop: '8px', padding: '8px 12px', backgroundColor: 'var(--danger-glow)', border: '1px solid var(--danger)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', maxWidth: '500px' }}>
                                    <strong style={{ color: 'var(--danger)' }}>Rejected by {renderUserName(rej.rejected_by_name, rej.rejected_by) || 'Reviewer'}:</strong>
                                    <span style={{ marginLeft: '6px', color: 'var(--text-primary)' }}>{rej.reason}</span>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                                      {new Date(rej.rejected_at).toLocaleString()}
                                    </div>
                                  </div>
                                ))}
                              </td>
                              <td>{renderUserName(ver.uploader_name, ver.uploaded_by) || 'System'}</td>
                              <td>{new Date(ver.created_at).toLocaleString()}</td>
                              <td style={{ textAlign: 'right' }}>
                                <a 
                                  href={`http://localhost:5000/api/documents/${selectedDocDetails.doc_id}/versions/${ver.version_id}/download`}
                                  className="btn btn-primary"
                                  style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                                  download
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <polyline points="7 10 12 15 17 10" />
                                    <line x1="12" y1="15" x2="12" y2="3" />
                                  </svg>
                                  Download
                                </a>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <style>{`
                  @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(8px); }
                    to { opacity: 1; transform: translateY(0); }
                  }
                `}</style>
              </div>
            ) : null
          ) : currentView === 'dashboard' ? (
            /* Dashboard View */
            currentUser.role === 'REVIEWER' ? (
              /* Reviewer Dashboard */
              <div>
                <div className="section-header">
                  <h2>Reviewer Overview</h2>
                </div>

                <div className="card-grid">
                  <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => setCurrentView('documents')}>
                    <div className="stat-icon-wrapper cyan">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                    </div>
                    <div className="stat-info">
                      <span className="stat-label">Pending Review</span>
                      <span className="stat-value">{underReviewDocs}</span>
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-icon-wrapper emerald">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                    </div>
                    <div className="stat-info">
                      <span className="stat-label">Approved / Archived</span>
                      <span className="stat-value">{approvedOrArchivedDocs}</span>
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-icon-wrapper red" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)' }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="15" y1="9" x2="9" y2="15" />
                        <line x1="9" y1="9" x2="15" y2="15" />
                      </svg>
                    </div>
                    <div className="stat-info">
                      <span className="stat-label">Rejected</span>
                      <span className="stat-value">{rejectedDocs}</span>
                    </div>
                  </div>
                </div>

                {/* Documents Awaiting Review Section */}
                <div className="section-card" style={{ marginTop: '24px' }}>
                  <div className="section-header" style={{ marginBottom: '16px' }}>
                    <h3>Documents Awaiting Review</h3>
                  </div>

                  {isLoading ? (
                    <p style={{ color: 'var(--text-secondary)' }}>Loading awaiting review documents...</p>
                  ) : error ? (
                    <p style={{ color: 'var(--danger)' }}>{error}</p>
                  ) : awaitingReviewList.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No documents currently awaiting review.</p>
                  ) : (
                    <div className="table-container">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>ID</th>
                            <th>Title</th>
                            <th>Category</th>
                            <th>Department</th>
                            <th>Owner</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {awaitingReviewList.map(doc => (
                            <tr key={doc.doc_id}>
                              <td>#{doc.doc_id}</td>
                              <td style={{ fontWeight: '500' }}>{doc.title}</td>
                              <td>{doc.category_name || 'Unassigned'}</td>
                              <td>{doc.department_name || 'Unassigned'}</td>
                              <td>{doc.owner_name}</td>
                              <td>
                                <button className="btn btn-secondary" onClick={() => handleViewDetails(doc.doc_id)}>
                                  Details
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Employee Dashboard */
              <div>
                <div className="section-header">
                  <h2>System Overview</h2>
                </div>

                {/* Statistics Cards Grid */}
                <div className="card-grid">
                  <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => setCurrentView('documents')}>
                    <div className="stat-icon-wrapper indigo">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                        <polyline points="10 9 9 9 8 9" />
                      </svg>
                    </div>
                    <div className="stat-info">
                      <span className="stat-label">Total Documents</span>
                      <span className="stat-value">{totalDocs}</span>
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-icon-wrapper cyan">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                    </div>
                    <div className="stat-info">
                      <span className="stat-label">Under Review</span>
                      <span className="stat-value">{underReviewDocs}</span>
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-icon-wrapper emerald">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                    </div>
                    <div className="stat-info">
                      <span className="stat-label">Approved / Archived</span>
                      <span className="stat-value">{approvedOrArchivedDocs}</span>
                    </div>
                  </div>
                </div>

                {/* Quick Info Section */}
                <div className="section-card">
                  <div className="section-header">
                    <h3>Welcome to the Industrial Document Portal</h3>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
                    This dashboard gives you a quick snapshot of active documentation across all plant operations. 
                    You can browse all industrial procedures, safety guides, and logbooks by navigating to the 
                    <strong> Documents</strong> tab in the sidebar.
                  </p>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="btn btn-primary" onClick={() => setCurrentView('documents')}>
                      View Documents
                  </button>
                  </div>
                </div>
              </div>
            )
          ) : currentView === 'create_document' ? (
            /* Create Document Form View */
            <div className="section-card" style={{ maxWidth: '600px', margin: '0 auto', animation: 'fadeIn 0.3s ease' }}>
              <div className="section-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '24px' }}>
                <h2>Create New Document</h2>
              </div>

              {createSuccessMessage && (
                <div style={{ backgroundColor: 'var(--success-glow)', border: '1px solid var(--success)', color: 'var(--success)', padding: '12px 16px', borderRadius: 'var(--radius-md)', fontSize: '0.9rem', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {createSuccessMessage}
                </div>
              )}

              {createError && (
                <div style={{ backgroundColor: 'var(--danger-glow)', border: '1px solid var(--danger)', color: 'var(--danger)', padding: '12px 16px', borderRadius: 'var(--radius-md)', fontSize: '0.9rem', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {createError}
                </div>
              )}

              <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>
                    Title <span style={{ color: 'var(--danger)' }}>*</span>
                  </label>
                  <input 
                    type="text" 
                    placeholder="Enter document title (e.g. Safety Policy)"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    required
                    maxLength={200}
                    style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', color: 'var(--text-primary)', outline: 'none', fontSize: '0.9rem' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Description</label>
                  <textarea 
                    placeholder="Describe the purpose or contents of this document..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    rows={4}
                    style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', color: 'var(--text-primary)', outline: 'none', fontSize: '0.9rem', resize: 'vertical' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Category (Optional)</label>
                    <select 
                      value={formCategoryId}
                      onChange={(e) => setFormCategoryId(e.target.value)}
                      style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', color: 'var(--text-primary)', outline: 'none', fontSize: '0.9rem', cursor: 'pointer' }}
                    >
                      <option value="">Select a category...</option>
                      {categories.map(category => (
                        <option key={category.category_id} value={category.category_id}>
                          {category.category_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Department (Optional)</label>
                    <select 
                      value={formDepartmentId}
                      onChange={(e) => setFormDepartmentId(e.target.value)}
                      style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', color: 'var(--text-primary)', outline: 'none', fontSize: '0.9rem', cursor: 'pointer' }}
                    >
                      <option value="">Select a department...</option>
                      {departments.map(dept => (
                        <option key={dept.department_id} value={dept.department_id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '12px', justifyContent: 'flex-end' }}>
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => setCurrentView('documents')}
                    disabled={isCreating}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    disabled={isCreating}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    {isCreating ? 'Creating...' : 'Create Document'}
                  </button>
                </div>
              </form>
            </div>
          ) : currentView === 'ai_assistant' ? (
            renderAIAssistant()
          ) : (
            /* Documents View */
            <div className="section-card">
              <div className="section-header">
                <h2>Documents Registry</h2>
                
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  {/* Search Bar */}
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', backgroundColor: 'var(--bg-tertiary)', padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', width: '250px' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)' }}>
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input 
                      type="text" 
                      placeholder="Search documents..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-primary)', outline: 'none', fontSize: '0.85rem', width: '100%' }}
                    />
                  </div>

                  {/* Create New Document Button - Employee Only */}
                  {currentUser.role === 'EMPLOYEE' && (
                    <button 
                      className="btn btn-primary"
                      onClick={() => {
                        setFormTitle('');
                        setFormDescription('');
                        setFormCategoryId('');
                        setFormDepartmentId('');
                        setCreateError(null);
                        setCreateSuccessMessage(null);
                        setCurrentView('create_document');
                      }}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                      Create New Document
                    </button>
                  )}
                </div>
              </div>

              {isLoading ? (
                /* Documents loading inside card, keeping header button visible */
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '200px', gap: '16px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '4px solid var(--border-color)', borderTopColor: 'var(--accent-primary)', animation: 'spin 1s linear infinite' }}></div>
                  <p style={{ color: 'var(--text-secondary)' }}>Loading documents...</p>
                  <style>{`
                    @keyframes spin {
                      0% { transform: rotate(0deg); }
                      100% { transform: rotate(360deg); }
                    }
                  `}</style>
                </div>
              ) : error ? (
                /* Documents loading error inside card, keeping header button visible */
                <div style={{ borderLeft: '4px solid var(--danger)', backgroundColor: 'rgba(239, 68, 68, 0.05)', padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                      <line x1="12" y1="9" x2="12" y2="13" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                    <h3 style={{ color: 'var(--text-primary)' }}>Connection Error</h3>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>{error}</p>
                  <button className="btn btn-primary" onClick={() => window.location.reload()}>
                    Try Again
                  </button>
                </div>
              ) : (
                /* Data Table */
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Title</th>
                        <th>Category</th>
                        <th>Department</th>
                        <th>Owner</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDocuments.length > 0 ? (
                        filteredDocuments.map(doc => (
                          <tr key={doc.doc_id}>
                            <td>#{doc.doc_id}</td>
                            <td style={{ fontWeight: '500' }}>{doc.title}</td>
                            <td>{doc.category_name || 'Unassigned'}</td>
                            <td>{doc.department_name || 'Unassigned'}</td>
                            <td>{renderUserName(doc.owner_name, doc.owner_id) || 'System'}</td>
                            <td>
                              <span className={`badge ${doc.status.toLowerCase()}`}>
                                {doc.status}
                              </span>
                            </td>
                            <td>
                              <div className="btn-group">
                                <button 
                                  className="btn btn-secondary"
                                  onClick={() => handleViewDetails(doc.doc_id)}
                                >
                                  Details
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                            No documents found matching your search.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
      {deletingUser && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(23, 33, 43, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '28px',
            maxWidth: '480px',
            width: '100%',
            boxShadow: 'var(--shadow-lg)',
            margin: '20px',
            animation: 'slideUp 0.2s ease-out'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--danger)', marginBottom: '16px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0 }}>Delete User?</h3>
            </div>

            {deleteUserError && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderLeft: '4px solid var(--danger)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', color: 'var(--danger)', fontSize: '0.9rem', fontWeight: '500', marginBottom: '16px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{deleteUserError}</span>
              </div>
            )}

            {deleteUserSuccessMessage && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderLeft: '4px solid var(--success)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', color: 'var(--success)', fontSize: '0.9rem', fontWeight: '500', marginBottom: '16px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>{deleteUserSuccessMessage}</span>
              </div>
            )}

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '20px', lineHeight: '1.5' }}>
              Are you sure you want to delete this user? This action cannot be undone.
            </p>

            <div style={{
              backgroundColor: 'var(--bg-tertiary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              padding: '16px',
              marginBottom: '24px'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '8px 12px', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>Name:</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{deletingUser.name}</span>

                <span style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>Email:</span>
                <span style={{ color: 'var(--text-primary)' }}>{deletingUser.email}</span>

                <span style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>Role:</span>
                <div>
                  <span className={`badge ${
                    deletingUser.role === 'ADMIN' ? 'admin' :
                    deletingUser.role === 'REVIEWER' ? 'under_review' : 'draft'
                  }`} style={{ padding: '2px 8px', fontSize: '0.7rem' }}>
                    {deletingUser.role}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={handleCancelDeleteUser}
                disabled={isDeletingUser}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn" 
                onClick={handleConfirmDeleteUser}
                disabled={isDeletingUser}
                style={{ 
                  backgroundColor: 'var(--danger)', 
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {isDeletingUser ? 'Deleting...' : 'Delete User'}
              </button>
            </div>
          </div>

          <style>{`
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes slideUp {
              from { opacity: 0; transform: translateY(16px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}</style>
        </div>
      )}
      {deletingCategory && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(23, 33, 43, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '28px',
            maxWidth: '480px',
            width: '100%',
            boxShadow: 'var(--shadow-lg)',
            margin: '20px',
            animation: 'slideUp 0.2s ease-out'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--danger)', marginBottom: '16px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0 }}>Delete Category?</h3>
            </div>

            {deleteCategoryError && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderLeft: '4px solid var(--danger)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', color: 'var(--danger)', fontSize: '0.9rem', fontWeight: '500', marginBottom: '16px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{deleteCategoryError}</span>
              </div>
            )}

            {deleteCategorySuccessMessage && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderLeft: '4px solid var(--success)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', color: 'var(--success)', fontSize: '0.9rem', fontWeight: '500', marginBottom: '16px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>{deleteCategorySuccessMessage}</span>
              </div>
            )}

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '20px', lineHeight: '1.5' }}>
              Are you sure you want to delete this category? This action cannot be undone.
            </p>

            <div style={{
              backgroundColor: 'var(--bg-tertiary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              padding: '16px',
              marginBottom: '24px'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '8px 12px', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>Category Name:</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{deletingCategory.category_name}</span>

                <span style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>Description:</span>
                <span style={{ color: 'var(--text-primary)' }}>{deletingCategory.description || <span style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>No description</span>}</span>

                <span style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>Document Count:</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{deletingCategory.document_count || 0}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={handleCancelDeleteCategory}
                disabled={isDeletingCategory}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn" 
                onClick={handleConfirmDeleteCategory}
                disabled={isDeletingCategory}
                style={{ 
                  backgroundColor: 'var(--danger)', 
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {isDeletingCategory ? 'Deleting...' : 'Delete Category'}
              </button>
            </div>
          </div>
        </div>
      )}
      {deletingDepartment && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(23, 33, 43, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '28px',
            maxWidth: '480px',
            width: '100%',
            boxShadow: 'var(--shadow-lg)',
            margin: '20px',
            animation: 'slideUp 0.2s ease-out'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--danger)', marginBottom: '16px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0 }}>Delete Department?</h3>
            </div>

            {deleteDepartmentError && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderLeft: '4px solid var(--danger)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', color: 'var(--danger)', fontSize: '0.9rem', fontWeight: '500', marginBottom: '16px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{deleteDepartmentError}</span>
              </div>
            )}

            {deleteDepartmentSuccessMessage && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderLeft: '4px solid var(--success)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', color: 'var(--success)', fontSize: '0.9rem', fontWeight: '500', marginBottom: '16px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>{deleteDepartmentSuccessMessage}</span>
              </div>
            )}

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '12px', lineHeight: '1.5' }}>
              Are you sure you want to delete this department? This action cannot be undone.
            </p>

            <p style={{ color: 'var(--warning)', fontSize: '0.85rem', marginBottom: '20px', lineHeight: '1.5', padding: '8px 12px', backgroundColor: 'rgba(245, 158, 11, 0.1)', borderLeft: '3px solid var(--warning)', borderRadius: '4px' }}>
              <strong>Notice:</strong> Users and documents will NOT be deleted. Their department assignment will be set to "No Department".
            </p>

            <div style={{
              backgroundColor: 'var(--bg-tertiary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              padding: '16px',
              marginBottom: '24px'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '8px 12px', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>Department:</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{deletingDepartment.name}</span>

                <span style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>Description:</span>
                <span style={{ color: 'var(--text-primary)' }}>{deletingDepartment.description || <span style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>No description</span>}</span>

                <span style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>Users Affected:</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{deletingDepartment.user_count || 0}</span>

                <span style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>Docs Affected:</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{deletingDepartment.document_count || 0}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={handleCancelDeleteDepartment}
                disabled={isDeletingDepartment}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn" 
                onClick={handleConfirmDeleteDepartment}
                disabled={isDeletingDepartment}
                style={{ 
                  backgroundColor: 'var(--danger)', 
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {isDeletingDepartment ? 'Deleting...' : 'Delete Department'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
