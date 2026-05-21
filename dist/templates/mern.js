"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMernFiles = getMernFiles;
function getMernFiles(projectName) {
    return [
        {
            path: 'server/package.json',
            content: JSON.stringify({
                name: `${projectName}-server`,
                version: '1.0.0',
                scripts: {
                    dev: 'nodemon src/index.ts',
                    build: 'tsc',
                    start: 'node dist/index.js',
                },
                dependencies: {
                    express: '^4.19.2',
                    mongoose: '^8.5.1',
                    cors: '^2.8.5',
                    dotenv: '^16.4.5',
                    jsonwebtoken: '^9.0.2',
                    bcryptjs: '^2.4.3',
                },
                devDependencies: {
                    typescript: '^5.5.3',
                    '@types/express': '^4.17.21',
                    '@types/node': '^20.14.9',
                    '@types/cors': '^2.8.17',
                    '@types/jsonwebtoken': '^9.0.6',
                    '@types/bcryptjs': '^2.4.6',
                    'ts-node': '^10.9.2',
                    nodemon: '^3.1.4',
                },
            }, null, 2),
        },
        {
            path: 'server/src/index.ts',
            content: `import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/${projectName}')
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => console.log(\`Server running on port \${PORT}\`));
  })
  .catch((err) => console.error('MongoDB connection error:', err));
`,
        },
        {
            path: 'server/.env.example',
            content: `PORT=5000
MONGODB_URI=mongodb://localhost:27017/${projectName}
JWT_SECRET=your-jwt-secret-here
`,
        },
        {
            path: 'client/package.json',
            content: JSON.stringify({
                name: `${projectName}-client`,
                version: '0.1.0',
                private: true,
                scripts: {
                    dev: 'vite',
                    build: 'tsc && vite build',
                    preview: 'vite preview',
                },
                dependencies: {
                    react: '^18.3.1',
                    'react-dom': '^18.3.1',
                    axios: '^1.7.2',
                },
                devDependencies: {
                    typescript: '^5.5.3',
                    vite: '^5.3.4',
                    '@vitejs/plugin-react': '^4.3.1',
                    '@types/react': '^18.3.3',
                    '@types/react-dom': '^18.3.0',
                },
            }, null, 2),
        },
        {
            path: 'client/src/App.tsx',
            content: `function App() {
  return (
    <div>
      <h1>${projectName}</h1>
      <p>MERN Stack Application</p>
    </div>
  );
}

export default App;
`,
        },
        {
            path: 'client/src/main.tsx',
            content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`,
        },
        {
            path: 'client/index.html',
            content: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${projectName}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`,
        },
        {
            path: '.gitignore',
            content: `node_modules/
dist/
.env
.DS_Store
`,
        },
        {
            path: 'README.md',
            content: `# ${projectName} — MERN Stack

## Structure
- \`/server\` — Express + TypeScript + MongoDB API
- \`/client\` — React + Vite + TypeScript frontend

## Quick Start
\`\`\`bash
cd server && cp .env.example .env && npm install && npm run dev
cd client && npm install && npm run dev
\`\`\`
`,
        },
    ];
}
//# sourceMappingURL=mern.js.map