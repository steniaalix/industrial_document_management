from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from app.services.ingestion_service import ingest_document, sync_approved_documents
from app.services.rag_service import ask_question
from app.rag.chroma_store import get_vector_store

router = APIRouter(prefix="/api/ai", tags=["AI"])

class AskRequest(BaseModel):
    question: str = Field(..., description="The query to ask the AI assistant.")

class SearchRequest(BaseModel):
    query: str = Field(..., description="The term to look up in the vector store.")
    k: int = Field(5, description="Number of results to retrieve.")

@router.post("/ingest/{document_id}")
async def ingest_doc(document_id: int):
    """
    Triggers document text extraction, chunking, embedding generation,
    and storage in ChromaDB for the latest version of the specified document.
    """
    try:
        result = ingest_document(document_id)
        return result
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ingestion process failed: {str(e)}")

@router.post("/ask")
async def ask_doc(request: AskRequest):
    """
    Queries the vector database for relevant contexts and uses Groq
    to answer questions about industrial documents.
    """
    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")
    try:
        result = ask_question(request.question)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI retrieval query failed: {str(e)}")

@router.post("/search")
async def search_doc(request: SearchRequest):
    """
    Performs raw similarity search in the ChromaDB vector database.
    """
    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty.")
    try:
        vector_store = get_vector_store()
        docs = vector_store.similarity_search(request.query, k=request.k)
        
        formatted_results = []
        for doc in docs:
            formatted_results.append({
                "page_content": doc.page_content,
                "metadata": doc.metadata
            })
            
        return {"results": formatted_results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Similarity search failed: {str(e)}")

@router.post("/sync-approved")
async def sync_approved():
    """
    Finds all documents with approved versions and synchronizes their active RAG vectors.
    """
    try:
        result = sync_approved_documents()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Synchronization failed: {str(e)}")
