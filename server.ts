import express from 'express';
import path from 'path';
import fs from 'fs';
import JSZip from 'jszip';
import { createServer as createViteServer } from 'vite';
import { analyzeRepository } from './server/analyzer';
import { askCodebase, explainCode, generateMentorReview, generateRoadmap } from './server/gemini';
import {
  loadAuthFromDisk,
  registerUser,
  loginUser,
  logoutUser,
  authMiddleware,
  requireAuth,
  type AuthenticatedRequest,
} from './server/auth';
import type { CodeChunk, FileNode, Project } from './src/types';

const PORT = 3000;
const DATA_DIR = path.join(process.cwd(), 'data');
const PROJECTS_FILE = path.join(DATA_DIR, 'projects.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-memory + persistent store
let projectsStore: Record<string, Project> = {};

function saveStoreToDisk() {
  try {
    fs.writeFileSync(PROJECTS_FILE, JSON.stringify(projectsStore, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to persist projects to disk:', err);
  }
}

function loadStoreFromDisk() {
  if (fs.existsSync(PROJECTS_FILE)) {
    try {
      const data = fs.readFileSync(PROJECTS_FILE, 'utf-8');
      projectsStore = JSON.parse(data);
    } catch (e) {
      console.warn('Could not read projects.json, initializing empty store.');
      projectsStore = {};
    }
  } else {
    projectsStore = {};
  }
}

// Build hierarchical file tree
function buildFileTree(files: Record<string, string>): FileNode[] {
  const rootNodes: FileNode[] = [];
  const nodeMap: Record<string, FileNode> = {};

  const sortedPaths = Object.keys(files).sort();

  for (const filePath of sortedPaths) {
    const parts = filePath.split('/');
    let currentPath = '';

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;
      const parentPath = currentPath;
      currentPath = currentPath ? `${currentPath}/${part}` : part;

      if (!nodeMap[currentPath]) {
        const node: FileNode = {
          path: currentPath,
          name: part,
          type: isFile ? 'file' : 'directory',
          lines: isFile ? files[filePath].split('\n').length : undefined,
          size: isFile ? files[filePath].length : undefined,
          language: isFile ? part.split('.').pop() : undefined,
          children: isFile ? undefined : [],
        };
        nodeMap[currentPath] = node;

        if (parentPath && nodeMap[parentPath] && nodeMap[parentPath].children) {
          nodeMap[parentPath].children!.push(node);
        } else if (!parentPath) {
          rootNodes.push(node);
        }
      }
    }
  }

  return rootNodes;
}

// Simple BM25 / TF-IDF Retrieval for RAG Code Search
function retrieveRelevantChunks(query: string, chunks: CodeChunk[], limit = 5): CodeChunk[] {
  const queryTerms = query
    .toLowerCase()
    .replace(/[^\w\s/.-]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2);

  if (queryTerms.length === 0) return chunks.slice(0, limit);

  const scored = chunks.map((chunk) => {
    let score = 0;
    const lowerContent = chunk.content.toLowerCase();
    const lowerPath = chunk.filePath.toLowerCase();

    for (const term of queryTerms) {
      if (lowerPath.includes(term)) score += 8;
      const occurrences = (lowerContent.match(new RegExp(term, 'g')) || []).length;
      score += Math.min(occurrences, 6) * 2;
    }

    return { chunk, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const relevant = scored.filter((s) => s.score > 0).map((s) => s.chunk);

  return relevant.length > 0 ? relevant.slice(0, limit) : chunks.slice(0, limit);
}

async function startServer() {
  loadStoreFromDisk();
  loadAuthFromDisk();

  const app = express();
  // Support JSON payloads up to 50MB for ZIP uploads
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));
  app.use(authMiddleware as express.RequestHandler);

  // AUTHENTICATION API ROUTES
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { email, password, name } = req.body;
      const result = await registerUser(email, password, name);
      res.json(result);
    } catch (err: unknown) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Registration failed.' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      const result = await loginUser(email, password);
      res.json(result);
    } catch (err: unknown) {
      res.status(401).json({ error: err instanceof Error ? err.message : 'Invalid credentials.' });
    }
  });

  app.get('/api/auth/me', (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated.' });
    }
    res.json({ user: req.user });
  });

  app.post('/api/auth/logout', async (req: AuthenticatedRequest, res) => {
    const authHeader = req.headers.authorization;
    let token = '';
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    } else if (req.headers['x-auth-token']) {
      token = String(req.headers['x-auth-token']).trim();
    }
    if (token) {
      await logoutUser(token);
    }
    res.json({ success: true });
  });

  // HEALTH CHECK
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      projectsCount: Object.keys(projectsStore).length,
      timestamp: new Date().toISOString(),
    });
  });

  // 1. List Projects (User Scoped)
  app.get('/api/projects', requireAuth as express.RequestHandler, (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const list = Object.values(projectsStore)
      .filter((p) => p.ownerId === userId)
      .map((p) => {
        // Omit huge rawFiles from project summary to keep response lightweight
        const { rawFiles, ...summary } = p;
        return summary;
      });
    res.json(list);
  });

  // 2. Get Single Project (Verified Owner)
  app.get('/api/projects/:id', requireAuth as express.RequestHandler, (req: AuthenticatedRequest, res) => {
    const proj = projectsStore[req.params.id];
    if (!proj) {
      return res.status(404).json({ error: 'Project not found' });
    }
    if (proj.ownerId && proj.ownerId !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied to this repository' });
    }
    // Return full project including rawFiles
    res.json(proj);
  });

  // 3. Delete Project (Verified Owner)
  app.delete('/api/projects/:id', requireAuth as express.RequestHandler, (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const proj = projectsStore[id];
    if (!proj) {
      return res.status(404).json({ error: 'Project not found' });
    }
    if (proj.ownerId && proj.ownerId !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied to delete this repository' });
    }
    delete projectsStore[id];
    saveStoreToDisk();
    res.json({ success: true, message: `Project ${id} deleted` });
  });

  // 4. Sample / Benchmark Repo Disabled (User requested NO demo values)
  app.post('/api/projects/load-sample', (req, res) => {
    res.status(400).json({
      error: 'Demo values are disabled. Please connect your GitHub repository or upload a .zip folder.',
    });
  });

  // 5. Upload ZIP Archive (Scoped to Authenticated User)
  app.post('/api/projects/upload-zip', requireAuth as express.RequestHandler, async (req: AuthenticatedRequest, res) => {
    try {
      const { name, base64Zip, filename } = req.body;
      if (!base64Zip) {
        return res.status(400).json({ error: 'No ZIP archive data provided' });
      }

      const zipBuffer = Buffer.from(base64Zip, 'base64');
      const zip = await JSZip.loadAsync(zipBuffer);
      const extractedFiles: Record<string, string> = {};

      const ignoredDirs = [
        'node_modules/',
        '.git/',
        'dist/',
        'build/',
        '.next/',
        '.cache/',
        'vendor/',
        '__pycache__/',
        '.venv/',
        'env/',
        '.idea/',
        '.vscode/',
        'coverage/',
      ];

      const binaryExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.ico', '.pdf', '.exe', '.dll', '.so', '.dylib', '.zip', '.tar', '.gz', '.mp4', '.mp3'];

      for (const [relativePath, fileEntry] of Object.entries(zip.files)) {
        if (fileEntry.dir) continue;
        if (ignoredDirs.some((d) => relativePath.includes(d))) continue;
        if (binaryExtensions.some((ext) => relativePath.toLowerCase().endsWith(ext))) continue;

        // Path safety against directory traversal
        const normalized = path.normalize(relativePath).replace(/^(\.\.(\/|\\|$))+/, '');
        if (normalized.startsWith('..') || path.isAbsolute(normalized)) continue;

        try {
          const content = await fileEntry.async('text');
          // Skip enormous binary or minified files (>1.5MB)
          if (content.length < 1500000) {
            extractedFiles[normalized] = content;
          }
        } catch {
          // ignore unreadable binary
        }
      }

      if (Object.keys(extractedFiles).length === 0) {
        return res.status(400).json({ error: 'The uploaded archive does not contain readable source code files.' });
      }

      const projectName = (name || filename?.replace(/\.zip$/i, '') || 'Uploaded Project').trim();
      const analysis = analyzeRepository(extractedFiles);

      const newId = `proj-${Date.now().toString(36)}`;
      const proj: Project = {
        id: newId,
        ownerId: req.user!.id,
        name: projectName,
        description: `Imported from ZIP archive (${Object.keys(extractedFiles).length} source files analyzed).`,
        branch: 'main',
        sha: Math.random().toString(16).substring(2, 10),
        version: 'v1.0.0',
        sourceType: 'zip',
        createdAt: new Date().toISOString(),
        analyzedAt: new Date().toISOString(),
        status: 'completed',
        rawFiles: extractedFiles,
        ...analysis,
      };

      const sampleSnippets = Object.entries(extractedFiles).slice(0, 4).map(([p, c]) => ({ path: p, snippet: c }));
      proj.mentorSynthesis = await generateMentorReview(proj, sampleSnippets);
      proj.roadmap = await generateRoadmap(proj);

      projectsStore[proj.id] = proj;
      saveStoreToDisk();

      res.json(proj);
    } catch (err: unknown) {
      console.error('ZIP extraction error:', err);
      res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to extract and analyze ZIP archive' });
    }
  });

  // 6. Import from GitHub Repository (Scoped to Authenticated User)
  app.post('/api/projects/import-github', requireAuth as express.RequestHandler, async (req: AuthenticatedRequest, res) => {
    try {
      const { repoUrl, branch: userBranch } = req.body;
      if (!repoUrl) {
        return res.status(400).json({ error: 'GitHub repository URL or owner/repo required' });
      }

      // Parse owner and repo name
      let clean = repoUrl.trim().replace(/^https?:\/\/github\.com\//i, '').replace(/\.git$/i, '').replace(/^\//, '');
      const parts = clean.split('/');
      if (parts.length < 2) {
        return res.status(400).json({ error: 'Invalid GitHub format. Please use "owner/repo" or full URL.' });
      }
      const owner = parts[0];
      const repo = parts[1];
      const branch = userBranch || 'main';

      // Fetch repository archive from GitHub API
      const archiveUrl = `https://api.github.com/repos/${owner}/${repo}/zipball/${branch}`;
      const response = await fetch(archiveUrl, {
        headers: {
          'User-Agent': 'DevLens-AI-Codebase-Inspector',
          Accept: 'application/vnd.github.v3+json',
        },
      });

      if (!response.ok) {
        // Fallback: try master branch
        const masterRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/zipball/master`, {
          headers: {
            'User-Agent': 'DevLens-AI-Codebase-Inspector',
            Accept: 'application/vnd.github.v3+json',
          },
        });
        if (!masterRes.ok) {
          return res.status(response.status).json({
            error: `GitHub repository "${owner}/${repo}" could not be retrieved. Ensure it is public or branch exists.`,
          });
        }
      }

      const activeRes = response.ok ? response : await fetch(`https://api.github.com/repos/${owner}/${repo}/zipball/master`);
      const arrayBuffer = await activeRes.arrayBuffer();
      const zip = await JSZip.loadAsync(arrayBuffer);

      const extractedFiles: Record<string, string> = {};
      const ignoredDirs = ['node_modules/', '.git/', 'dist/', 'build/', 'vendor/', '__pycache__/'];
      const binaryExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.ico', '.pdf', '.exe', '.zip'];

      for (const [relativePath, fileEntry] of Object.entries(zip.files)) {
        if (fileEntry.dir) continue;
        if (ignoredDirs.some((d) => relativePath.includes(d))) continue;
        if (binaryExtensions.some((ext) => relativePath.toLowerCase().endsWith(ext))) continue;

        // GitHub zipball has root folder like owner-repo-sha/
        const slashIdx = relativePath.indexOf('/');
        const normalized = slashIdx !== -1 ? relativePath.substring(slashIdx + 1) : relativePath;

        try {
          const content = await fileEntry.async('text');
          if (content.length < 1500000) {
            extractedFiles[normalized] = content;
          }
        } catch {
          // ignore
        }
      }

      const analysis = analyzeRepository(extractedFiles);
      const newId = `gh-${owner}-${repo}-${Date.now().toString(36)}`;
      const proj: Project = {
        id: newId,
        ownerId: req.user!.id,
        name: repo,
        description: `Imported from GitHub: ${owner}/${repo} (${branch})`,
        branch,
        sha: Math.random().toString(16).substring(2, 10),
        version: 'git-head',
        sourceType: 'github',
        sourceUrl: `https://github.com/${owner}/${repo}`,
        createdAt: new Date().toISOString(),
        analyzedAt: new Date().toISOString(),
        status: 'completed',
        rawFiles: extractedFiles,
        ...analysis,
      };

      const sampleSnippets = Object.entries(extractedFiles).slice(0, 4).map(([p, c]) => ({ path: p, snippet: c }));
      proj.mentorSynthesis = await generateMentorReview(proj, sampleSnippets);
      proj.roadmap = await generateRoadmap(proj);

      projectsStore[proj.id] = proj;
      saveStoreToDisk();

      res.json(proj);
    } catch (err: unknown) {
      console.error('GitHub import error:', err);
      res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to import GitHub repository' });
    }
  });

  // 7. Get File Tree for Project
  app.get('/api/projects/:id/files', requireAuth as express.RequestHandler, (req: AuthenticatedRequest, res) => {
    const proj = projectsStore[req.params.id];
    if (!proj || !proj.rawFiles) {
      return res.status(404).json({ error: 'Project or files not found' });
    }
    if (proj.ownerId && proj.ownerId !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    const tree = buildFileTree(proj.rawFiles);
    res.json(tree);
  });

  // 8. Get Content of a Single File
  app.get('/api/projects/:id/file-content', requireAuth as express.RequestHandler, (req: AuthenticatedRequest, res) => {
    const proj = projectsStore[req.params.id];
    if (!proj || !proj.rawFiles) {
      return res.status(404).json({ error: 'Project not found' });
    }
    if (proj.ownerId && proj.ownerId !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    const filePath = req.query.path as string;
    if (!filePath || !(filePath in proj.rawFiles)) {
      return res.status(404).json({ error: `File "${filePath}" not found in project` });
    }
    res.json({
      path: filePath,
      content: proj.rawFiles[filePath],
      lines: proj.rawFiles[filePath].split('\n').length,
    });
  });

  // 9. Re-analyze Project
  app.post('/api/projects/:id/reanalyze', requireAuth as express.RequestHandler, async (req: AuthenticatedRequest, res) => {
    const proj = projectsStore[req.params.id];
    if (!proj || !proj.rawFiles) {
      return res.status(404).json({ error: 'Project not found' });
    }
    if (proj.ownerId && proj.ownerId !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    const analysis = analyzeRepository(proj.rawFiles);
    Object.assign(proj, analysis);
    proj.analyzedAt = new Date().toISOString();

    const sampleSnippets = Object.entries(proj.rawFiles).slice(0, 4).map(([p, c]) => ({ path: p, snippet: c }));
    proj.mentorSynthesis = await generateMentorReview(proj, sampleSnippets);
    proj.roadmap = await generateRoadmap(proj);

    saveStoreToDisk();
    res.json(proj);
  });

  // 10. AI Codebase Chat (RAG grounded in actual repository chunks)
  app.post('/api/projects/:id/chat', requireAuth as express.RequestHandler, async (req: AuthenticatedRequest, res) => {
    const proj = projectsStore[req.params.id];
    if (!proj) {
      return res.status(404).json({ error: 'Project not found' });
    }
    if (proj.ownerId && proj.ownerId !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    const { question } = req.body;
    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    // Re-generate chunks if not cached in memory
    const analysis = analyzeRepository(proj.rawFiles || {});
    const relevantChunks = retrieveRelevantChunks(question, analysis.chunks || [], 5);

    const answer = await askCodebase(question, relevantChunks, proj);
    res.json(answer);
  });

  // 11. AI Code Explanation
  app.post('/api/projects/:id/explain-code', requireAuth as express.RequestHandler, async (req: AuthenticatedRequest, res) => {
    const proj = projectsStore[req.params.id];
    if (!proj) {
      return res.status(404).json({ error: 'Project not found' });
    }
    if (proj.ownerId && proj.ownerId !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    const { file, startLine, endLine, code } = req.body;
    const explanation = await explainCode(file, startLine, endLine, code, proj);
    res.json({ explanation });
  });

  // 12. Regenerate Mentor Synthesis
  app.post('/api/projects/:id/mentor', requireAuth as express.RequestHandler, async (req: AuthenticatedRequest, res) => {
    const proj = projectsStore[req.params.id];
    if (!proj || !proj.rawFiles) {
      return res.status(404).json({ error: 'Project not found' });
    }
    if (proj.ownerId && proj.ownerId !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    const sampleSnippets = Object.entries(proj.rawFiles).slice(0, 4).map(([p, c]) => ({ path: p, snippet: c }));
    const mentor = await generateMentorReview(proj, sampleSnippets);
    proj.mentorSynthesis = mentor;
    saveStoreToDisk();
    res.json(mentor);
  });

  // 13. Regenerate Ascent Roadmap
  app.post('/api/projects/:id/roadmap', requireAuth as express.RequestHandler, async (req: AuthenticatedRequest, res) => {
    const proj = projectsStore[req.params.id];
    if (!proj) {
      return res.status(404).json({ error: 'Project not found' });
    }
    if (proj.ownerId && proj.ownerId !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    const roadmap = await generateRoadmap(proj);
    proj.roadmap = roadmap;
    saveStoreToDisk();
    res.json(roadmap);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  if (!process.env.VERCEL) {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`DevLens AI Server running on http://0.0.0.0:${PORT}`);
    });
  }

  return app;
}

if (!process.env.VERCEL) {
  startServer().catch((err) => {
    console.error('Fatal Server Error:', err);
  });
}

export { startServer };
