import { TemplateFile } from './nextjs';

export function getFastapiFiles(projectName: string): TemplateFile[] {
  return [
    {
      path: 'requirements.txt',
      content: `fastapi==0.111.0
uvicorn[standard]==0.30.1
sqlalchemy==2.0.31
alembic==1.13.2
psycopg2-binary==2.9.9
pydantic==2.8.2
pydantic-settings==2.3.4
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.9
httpx==0.27.0
pytest==8.2.2
pytest-asyncio==0.23.7
`,
    },
    {
      path: 'app/__init__.py',
      content: '',
    },
    {
      path: 'app/main.py',
      content: `from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.routers import health

app = FastAPI(
    title="${projectName}",
    description="API built with FastAPI + PostgreSQL",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)


@app.get("/")
def root():
    return {"message": "Welcome to ${projectName} API"}
`,
    },
    {
      path: 'app/core/__init__.py',
      content: '',
    },
    {
      path: 'app/core/config.py',
      content: `from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    PROJECT_NAME: str = "${projectName}"
    DATABASE_URL: str = "postgresql://user:password@localhost:5432/${projectName}"
    SECRET_KEY: str = "change-me-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000"]

    class Config:
        env_file = ".env"


settings = Settings()
`,
    },
    {
      path: 'app/core/database.py',
      content: `from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
`,
    },
    {
      path: 'app/routers/__init__.py',
      content: '',
    },
    {
      path: 'app/routers/health.py',
      content: `from fastapi import APIRouter

router = APIRouter(prefix="/health", tags=["health"])


@router.get("")
def health_check():
    return {"status": "ok"}
`,
    },
    {
      path: 'app/models/__init__.py',
      content: '',
    },
    {
      path: 'app/schemas/__init__.py',
      content: '',
    },
    {
      path: '.env.example',
      content: `DATABASE_URL=postgresql://user:password@localhost:5432/${projectName}
SECRET_KEY=your-secret-key-here
ALLOWED_ORIGINS=["http://localhost:3000"]
`,
    },
    {
      path: 'Dockerfile',
      content: `FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
`,
    },
    {
      path: 'docker-compose.yml',
      content: `version: "3.9"

services:
  api:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/${projectName}
    depends_on:
      - db

  db:
    image: postgres:16-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: ${projectName}
    ports:
      - "5432:5432"

volumes:
  postgres_data:
`,
    },
    {
      path: '.gitignore',
      content: `__pycache__/
*.py[cod]
*.egg-info/
.env
.venv
venv/
dist/
build/
*.egg
.DS_Store
`,
    },
    {
      path: 'README.md',
      content: `# ${projectName}

FastAPI + PostgreSQL + Docker REST API.

## Quick Start

\`\`\`bash
cp .env.example .env
docker-compose up -d
\`\`\`

API docs: http://localhost:8000/docs
`,
    },
  ];
}
