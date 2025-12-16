from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Initialize FastAPI app
app = FastAPI(
    title="PixelAI API",
    description="Image processing API using OpenCV",
    version="1.0.0"
)

# Configure CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Public route
@app.get("/")
def read_root():
    return {"message": "Welcome to PixelAI - Image Processing API"}

# Import and include routers
from app.api.endpoints import images

app.include_router(images.router, prefix="/images", tags=["images"])
