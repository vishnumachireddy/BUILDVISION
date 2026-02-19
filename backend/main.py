from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.calculation import router as calculation_router
from api.project import router as project_router
from api.auth import router as auth_router
from api.sketch import router as sketch_router
from api.location import router as location_router
from core.database import engine, Base
from core import models

# Initialize Database
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="ConstructIQ API",
    description="Backend for ConstructIQ - AI Construction Planning Platform",
    version="0.2.0"
)

origins = [
    "http://localhost:5173",
    "http://localhost:8000",
    "https://rad-empanada-262a58.netlify.app",
    "https://khaki-lines-wait.loca.lt"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(calculation_router, prefix="/api", tags=["Calculation"])
app.include_router(project_router, prefix="/api", tags=["Project"])
app.include_router(auth_router, prefix="/api/auth", tags=["Auth"])
app.include_router(sketch_router, prefix="/api", tags=["Sketch Analysis"])
app.include_router(location_router, prefix="/api", tags=["Location Detection"])

@app.get("/")
def read_root():
    return {"message": "Welcome to ConstructIQ API"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
