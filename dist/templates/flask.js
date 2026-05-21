"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFlaskFiles = getFlaskFiles;
function getFlaskFiles(projectName) {
    return [
        {
            path: 'requirements.txt',
            content: `Flask==3.0.3
Flask-SQLAlchemy==3.1.1
Flask-Migrate==4.0.7
Flask-CORS==4.0.1
Flask-JWT-Extended==4.6.0
python-dotenv==1.0.1
psycopg2-binary==2.9.9
marshmallow==3.21.3
gunicorn==22.0.0
pytest==8.2.2
`,
        },
        {
            path: 'app/__init__.py',
            content: `from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from dotenv import load_dotenv
import os

load_dotenv()

db = SQLAlchemy()
migrate = Migrate()


def create_app():
    app = Flask(__name__)

    app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv(
        "DATABASE_URL", "postgresql://localhost/${projectName}"
    )
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET", "change-me")

    db.init_app(app)
    migrate.init_app(app, db)
    CORS(app)
    JWTManager(app)

    from app.routes.health import health_bp
    app.register_blueprint(health_bp)

    return app
`,
        },
        {
            path: 'app/routes/__init__.py',
            content: '',
        },
        {
            path: 'app/routes/health.py',
            content: `from flask import Blueprint, jsonify

health_bp = Blueprint("health", __name__, url_prefix="/api")


@health_bp.route("/health")
def health():
    return jsonify({"status": "ok"})
`,
        },
        {
            path: 'app/models/__init__.py',
            content: '',
        },
        {
            path: 'run.py',
            content: `from app import create_app

app = create_app()

if __name__ == "__main__":
    app.run(debug=True)
`,
        },
        {
            path: '.env.example',
            content: `DATABASE_URL=postgresql://user:password@localhost:5432/${projectName}
JWT_SECRET=your-jwt-secret-here
FLASK_ENV=development
`,
        },
        {
            path: '.gitignore',
            content: `__pycache__/
*.pyc
.env
.venv
venv/
instance/
.DS_Store
*.egg-info/
dist/
build/
`,
        },
        {
            path: 'README.md',
            content: `# ${projectName}

Python Flask + SQLAlchemy REST API.

## Quick Start

\`\`\`bash
python -m venv venv
source venv/bin/activate  # Windows: venv\\Scripts\\activate
pip install -r requirements.txt
cp .env.example .env
flask db init && flask db migrate && flask db upgrade
python run.py
\`\`\`

API: http://localhost:5000/api/health
`,
        },
    ];
}
//# sourceMappingURL=flask.js.map