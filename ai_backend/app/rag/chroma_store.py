import os
import logging
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import Chroma
import chromadb
from app.config import settings

logger = logging.getLogger(__name__)

# Cache embedding function to avoid re-instantiation
_embeddings = None

def get_embeddings() -> GoogleGenerativeAIEmbeddings:
    global _embeddings
    if _embeddings is None:
        api_key = settings.GEMINI_API_KEY or os.getenv("GOOGLE_API_KEY", "")
        # Make sure there is an API key
        if not api_key:
            logger.warning("GEMINI_API_KEY not found in configuration or env. Google GenAI embeddings might fail.")
        
        # Standard model name for Gemini embeddings in LangChain is models/embedding-001
        model_name = settings.GEMINI_EMBEDDING_MODEL
        if not model_name.startswith("models/"):
            model_name = f"models/{model_name}"
            
        _embeddings = GoogleGenerativeAIEmbeddings(
            model=model_name,
            google_api_key=api_key
        )
    return _embeddings

def get_vector_store() -> Chroma:
    """
    Returns a LangChain Chroma vector store instance.
    """
    return Chroma(
        collection_name=settings.CHROMA_COLLECTION_NAME,
        persist_directory=settings.CHROMA_PERSIST_DIRECTORY,
        embedding_function=get_embeddings()
    )

def is_version_ingested(version_id: int) -> bool:
    """
    Checks if a document version is already ingested in ChromaDB.
    """
    try:
        # Use native chromadb client for metadata filtering to check existence
        client = chromadb.PersistentClient(path=settings.CHROMA_PERSIST_DIRECTORY)
        try:
            collection = client.get_collection(settings.CHROMA_COLLECTION_NAME)
        except Exception:
            # Collection might not exist yet
            return False
            
        # Query matching version_id
        results = collection.get(
            where={"version_id": version_id},
            limit=1
        )
        return len(results.get("ids", [])) > 0
    except Exception as e:
        logger.error(f"Error checking if version {version_id} is ingested: {e}")
        return False

def get_version_chunk_count(version_id: int) -> int:
    """
    Gets the number of chunks ingested for a particular version.
    """
    try:
        client = chromadb.PersistentClient(path=settings.CHROMA_PERSIST_DIRECTORY)
        try:
            collection = client.get_collection(settings.CHROMA_COLLECTION_NAME)
        except Exception:
            return 0
            
        results = collection.get(
            where={"version_id": version_id}
        )
        return len(results.get("ids", []))
    except Exception as e:
        logger.error(f"Error getting chunk count for version {version_id}: {e}")
        return 0

def delete_version_from_store(version_id: int):
    """
    Deletes all chunks associated with a specific version_id from the vector store.
    """
    try:
        client = chromadb.PersistentClient(path=settings.CHROMA_PERSIST_DIRECTORY)
        try:
            collection = client.get_collection(settings.CHROMA_COLLECTION_NAME)
            collection.delete(where={"version_id": version_id})
            logger.info(f"Deleted version_id {version_id} from vector store.")
        except Exception as e:
            logger.warning(f"Failed to delete version_id {version_id} (it may not exist in Chroma): {e}")
    except Exception as e:
        logger.error(f"Error in delete_version_from_store: {e}")

def delete_obsolete_document_versions(doc_id: int, active_version_id: int):
    """
    Deletes all chunks of a document from the vector store except for the currently active approved version.
    """
    try:
        client = chromadb.PersistentClient(path=settings.CHROMA_PERSIST_DIRECTORY)
        try:
            collection = client.get_collection(settings.CHROMA_COLLECTION_NAME)
            # Find all chunks for this doc_id
            results = collection.get(where={"doc_id": doc_id})
            ids = results.get("ids", [])
            metadatas = results.get("metadatas", [])
            
            # Find IDs that do not match the active version
            ids_to_delete = []
            for i, meta in enumerate(metadatas):
                if meta.get("version_id") != active_version_id:
                    ids_to_delete.append(ids[i])
                    
            if ids_to_delete:
                collection.delete(ids=ids_to_delete)
                logger.info(f"Deleted {len(ids_to_delete)} obsolete chunks for doc_id {doc_id} (keeping active version_id {active_version_id}).")
        except Exception as e:
            logger.warning(f"Error filtering/deleting obsolete chunks for doc_id {doc_id}: {e}")
    except Exception as e:
        logger.error(f"Error in delete_obsolete_document_versions: {e}")
