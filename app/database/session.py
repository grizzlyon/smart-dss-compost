import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base

# Membaca isi file .env
load_dotenv()

# Mengambil URL Database dari file .env (Jika tidak ada, fallback ke SQLite)
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./kompos.db")

# Jika pakai SQLite, butuh pengaturan khusus. Jika pakai PostgreSQL, tidak butuh.
if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
    )
else:
    engine = create_engine(SQLALCHEMY_DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Fungsi untuk dipanggil di Endpoint API
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()