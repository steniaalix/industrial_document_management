import os
import logging
from app.services.db_service import get_latest_approved_document_version, get_all_documents_with_approved_versions
from app.utils.extraction import extract_text
from app.rag.text_splitter import get_text_splitter
from app.rag.chroma_store import get_vector_store, is_version_ingested, get_version_chunk_count, delete_obsolete_document_versions
from langchain_core.documents import Document

logger = logging.getLogger(__name__)

def resolve_file_path(db_file_path: str) -> str:
    """
    Resolves a stored DB file path to an absolute path on the disk,
    checking standard locations in the industrial_document_management repository.
    """
    # Clean file path separators
    db_file_path = db_file_path.replace('\\', '/')
    
    # Base directories to search
    workspace_root = "d:/industrial document management"
    
    candidates = [
        db_file_path,
        os.path.join(workspace_root, db_file_path),
        os.path.join(workspace_root, "backend", db_file_path),
        os.path.join(workspace_root, "backend/uploads", os.path.basename(db_file_path)),
        os.path.join(workspace_root, "uploads", os.path.basename(db_file_path))
    ]
    
    for candidate in candidates:
        if os.path.exists(candidate) and os.path.isfile(candidate):
            logger.info(f"Resolved file path successfully: {candidate}")
            return os.path.abspath(candidate)
            
    # Raise error if not found in any standard path
    raise FileNotFoundError(f"Could not locate the document file on disk. DB path: {db_file_path}")

def ingest_document(doc_id: int) -> dict:
    """
    Ingests the latest APPROVED version of a document into the ChromaDB vector store.
    """
    # 1. Fetch metadata and version info from database
    version_info = get_latest_approved_document_version(doc_id)
    if not version_info:
        raise ValueError(f"Document with ID {doc_id} does not have any approved versions.")
        
    version_id = version_info["version_id"]
    file_path_db = version_info["file_path"]
    
    # 2. Check for duplicate ingestion
    if is_version_ingested(version_id):
        chunk_count = get_version_chunk_count(version_id)
        logger.info(f"Document version {version_id} (doc_id: {doc_id}) is already ingested with {chunk_count} chunks.")
        
        # Clean up any obsolete versions safely even if already ingested
        delete_obsolete_document_versions(doc_id, version_id)
        
        return {
            "success": True,
            "document_id": doc_id,
            "version_id": version_id,
            "chunks_created": chunk_count,
            "already_ingested": True
        }
        
    # 3. Resolve file path on disk
    absolute_path = resolve_file_path(file_path_db)
    
    # 4. Extract text
    pages = extract_text(absolute_path)
    if not pages:
        raise ValueError(f"No text content could be extracted from document version {version_id}.")
        
    # 5. Split and chunk text
    splitter = get_text_splitter()
    documents_to_add = []
    
    for page in pages:
        page_num = page["page"]
        text_content = page["text"]
        
        # Split page content into chunks
        chunks = splitter.split_text(text_content)
        
        for i, chunk in enumerate(chunks):
            # Create Rich Metadata payload
            metadata = {
                "doc_id": doc_id,
                "version_id": version_id,
                "version_number": version_info["version_number"],
                "file_name": version_info["file_name"],
                "document_title": version_info["document_title"] or f"Doc #{doc_id}",
                "category_name": version_info["category_name"] or "Unassigned",
                "department_name": version_info["department_name"] or "Unassigned",
                "page": page_num,
                "chunk_index": i
            }
            
            # Construct LangChain Document
            doc = Document(page_content=chunk, metadata=metadata)
            documents_to_add.append(doc)
            
    # 6. Store in Chroma Vector Store
    if documents_to_add:
        vector_store = get_vector_store()
        vector_store.add_documents(documents_to_add)
        logger.info(f"Successfully ingested {len(documents_to_add)} chunks for doc_id {doc_id}, version_id {version_id}.")
        
    # 7. Safe replacement: now that V2 is successfully stored, delete V1 vectors
    delete_obsolete_document_versions(doc_id, version_id)
        
    return {
        "success": True,
        "document_id": doc_id,
        "version_id": version_id,
        "chunks_created": len(documents_to_add),
        "already_ingested": False
    }

def sync_approved_documents() -> dict:
    """
    Finds all documents with approved versions, ingests their latest approved version,
    and cleans up any obsolete version vectors.
    """
    try:
        doc_ids = get_all_documents_with_approved_versions()
        logger.info(f"Starting synchronization of approved documents. Found {len(doc_ids)} documents to sync.")
        
        synced = []
        errors = []
        
        for doc_id in doc_ids:
            try:
                res = ingest_document(doc_id)
                synced.append({
                    "document_id": doc_id,
                    "version_id": res["version_id"],
                    "chunks_created": res["chunks_created"],
                    "already_ingested": res["already_ingested"]
                })
            except Exception as e:
                logger.error(f"Failed to sync doc_id {doc_id}: {e}")
                errors.append({"document_id": doc_id, "error": str(e)})
                
        return {
            "success": True,
            "processed_count": len(doc_ids),
            "synced": synced,
            "errors": errors
        }
    except Exception as e:
        logger.error(f"Error during global synchronization: {e}")
        raise e
