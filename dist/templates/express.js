"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getExpressFiles = getExpressFiles;
function getExpressFiles(projectName) {
    return [
        {
            path: 'package.json',
            content: JSON.stringify({
                name: projectName,
                version: '1.0.0',
                scripts: {
                    dev: 'nodemon src/index.ts',
                    build: 'tsc',
                    start: 'node dist/index.js',
                    test: 'jest',
                },
                dependencies: {
                    express: '^4.19.2',
                    cors: '^2.8.5',
                    dotenv: '^16.4.5',
                    pg: '^8.12.0',
                    'pg-hstore': '^2.3.4',
                    sequelize: '^6.37.3',
                    jsonwebtoken: '^9.0.2',
                    bcryptjs: '^2.4.3',
                    'express-validator': '^7.1.0',
                    helmet: '^7.1.0',
                    morgan: '^1.10.0',
                },
                devDependencies: {
                    typescript: '^5.5.3',
                    '@types/express': '^4.17.21',
                    '@types/node': '^20.14.9',
                    '@types/cors': '^2.8.17',
                    '@types/pg': '^8.11.6',
                    '@types/jsonwebtoken': '^9.0.6',
                    '@types/bcryptjs': '^2.4.6',
                    '@types/morgan': '^1.9.9',
                    'ts-node': '^10.9.2',
                    nodemon: '^3.1.4',
                },
            }, null, 2),
        },
        {
            path: 'tsconfig.json',
            content: JSON.stringify({
                compilerOptions: {
                    target: 'ES2020',
                    module: 'commonjs',
                    outDir: './dist',
                    rootDir: './src',
                    strict: true,
                    esModuleInterop: true,
                    skipLibCheck: true,
                },
                include: ['src/**/*'],
                exclude: ['node_modules', 'dist'],
            }, null, 2),
        },
        {
            path: 'src/index.ts',
            content: `import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { router as healthRouter } from './routes/health';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

app.use('/api/health', healthRouter);

app.listen(PORT, () => {
  console.log(\`🚀 Server running on http://localhost:\${PORT}\`);
});

export default app;
`,
        },
        {
            path: 'src/routes/health.ts',
            content: `import { Router } from 'express';

export const router = Router();

router.get('/', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
`,
        },
        {
            path: 'src/middleware/auth.ts',
            content: `import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  userId?: string;
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { id: string };
    req.userId = decoded.id;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}
`,
        },
        {
            path: '.env.example',
            content: `PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/${projectName}
JWT_SECRET=your-jwt-secret-here
NODE_ENV=development
`,
        },
        {
            path: '.gitignore',
            content: `node_modules/
dist/
.env
.DS_Store
*.log
`,
        },
        {
            path: 'README.md',
            content: `# ${projectName}

Express + TypeScript + PostgreSQL REST API.

## Quick Start

\`\`\`bash
npm install
cp .env.example .env
npm run dev
\`\`\`

API: http://localhost:3000/api/health
`,
        },
    ];
}
//# sourceMappingURL=express.js.map