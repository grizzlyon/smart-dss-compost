from fastapi import FastAPI, Request
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.router import api_router
from app.database.session import engine, Base

# Membuat tabel database
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Smart-DSS Compost API")

templates = Jinja2Templates(directory="app/templates")

# Static
app.mount("/static", StaticFiles(directory="app/static"), name="static")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500", 
        "http://localhost:5500", 
        "http://localhost:8000",
        "http://127.0.0.1:8000"
    ], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API (Semua endpoints dari app/api/router.py akan dimuat di sini)
app.include_router(api_router, prefix="/api")

# Frontend
@app.get("/")
async def root(request: Request):
    return templates.TemplateResponse(
        "index.html",
        {
            "request": request
        }
    )