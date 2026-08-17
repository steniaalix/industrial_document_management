import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv(override=True)

class Settings:
    # API Keys
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    
    # Models
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")
    GEMINI_EMBEDDING_MODEL: str = os.getenv("GEMINI_EMBEDDING_MODEL", "gemini-embedding-001")
    
    # Database
    MYSQL_HOST: str = os.getenv("MYSQL_HOST", "127.0.0.1")
    MYSQL_PORT: int = int(os.getenv("MYSQL_PORT", "3306"))
    MYSQL_USER: str = os.getenv("MYSQL_USER", "root")
    MYSQL_PASSWORD: str = os.getenv("MYSQL_PASSWORD", "Lazyboy3337s@")
    MYSQL_DATABASE: str = os.getenv("MYSQL_DATABASE", "industrial_document_management")
    
    # Vector DB
    CHROMA_PERSIST_DIRECTORY: str = os.getenv("CHROMA_PERSIST_DIRECTORY", "./chroma_db")
    CHROMA_COLLECTION_NAME: str = "indudocs_documents"
    
    # Chunking
    CHUNK_SIZE: int = int(os.getenv("CHUNK_SIZE", "1000"))
    CHUNK_OVERLAP: int = int(os.getenv("CHUNK_OVERLAP", "150"))

settings = Settings()
