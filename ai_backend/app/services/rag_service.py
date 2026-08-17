import logging
import re
from langchain_groq import ChatGroq
from app.config import settings
from app.rag.chroma_store import get_vector_store
from langchain_core.prompts import PromptTemplate

logger = logging.getLogger(__name__)

# Prompt for the LLM
PROMPT_TEMPLATE = """You are an expert AI assistant specialized in industrial operations, safety regulations, and technical documentation.
Your task is to answer the user's question accurately using ONLY the provided document excerpts.

If the provided context does not contain the answer, state clearly that the answer is not available in the uploaded documents. Do not attempt to make up or infer information not supported by the text.

CONTEXT:
{context}

QUESTION:
{question}

Provide a detailed, precise, and professional response:
"""

def get_llm() -> ChatGroq:
    """
    Returns configured ChatGroq instance.
    """
    return ChatGroq(
        model=settings.GROQ_MODEL,
        groq_api_key=settings.GROQ_API_KEY,
        temperature=0.0
    )

def ask_question(question: str) -> dict:
    """
    Retrieves relevant document chunks and uses Groq LLM to generate an answer.
    """
    try:
        vector_store = get_vector_store()
        
        # 1. Retrieve the top 5 most similar chunks
        retrieved_docs = vector_store.similarity_search(question, k=5)
        
        if not retrieved_docs:
            return {
                "answer": "No relevant documents found. Please index some documents first.",
                "sources": []
            }
            
        # 2. Build context text
        context_parts = []
        for i, doc in enumerate(retrieved_docs):
            title = doc.metadata.get("document_title", "Unknown Document")
            page = doc.metadata.get("page", 1)
            content = doc.page_content
            context_parts.append(f"--- EXCERPT {i+1} [{title}, Page {page}] ---\n{content}")
            
        context_text = "\n\n".join(context_parts)
        
        # 3. Call Groq model
        llm = get_llm()
        prompt = PromptTemplate(template=PROMPT_TEMPLATE, input_variables=["context", "question"])
        formatted_prompt = prompt.format(context=context_text, question=question)
        
        response = llm.invoke(formatted_prompt)
        answer_text = response.content
        
        # Sanitize <think>...</think> blocks from the answer
        if answer_text:
            answer_text = re.sub(r'<think>.*?</think>', '', answer_text, flags=re.DOTALL).strip()
        
        # 4. Extract and deduplicate source citations
        sources = []
        seen_sources = set()
        
        for doc in retrieved_docs:
            meta = doc.metadata
            doc_id = meta.get("doc_id")
            version_id = meta.get("version_id")
            page = meta.get("page", 1)
            
            # Group by doc_id, version_id, and page number to prevent redundant citations
            source_key = (doc_id, version_id, page)
            if source_key not in seen_sources:
                seen_sources.add(source_key)
                sources.append({
                    "doc_id": doc_id,
                    "version_id": version_id,
                    "version_number": meta.get("version_number"),
                    "file_name": meta.get("file_name"),
                    "document_title": meta.get("document_title"),
                    "category_name": meta.get("category_name"),
                    "department_name": meta.get("department_name"),
                    "page": page
                })
                
        return {
            "answer": answer_text,
            "sources": sources
        }
    except Exception as e:
        logger.error(f"Error in ask_question: {e}")
        raise e
