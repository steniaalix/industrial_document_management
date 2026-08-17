from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.ai import router as ai_router

app = FastAPI(
    title="InduDocs AI Service Backend",
    description="Microservice for document ingestion, embeddings, vector storage, and Q&A using ChromaDB, Gemini, and Groq.",
    version="1.0.0"
)

# Explicitly configure CORS to permit connections from local React Dev Server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include AI routes
app.include_router(ai_router)

@app.get("/")
def get_root():
    return {
        "status": "online",
        "service": "InduDocs AI Service",
        "description": "FastAPI AI agent endpoints are active."
    }

# Trigger reload comment
