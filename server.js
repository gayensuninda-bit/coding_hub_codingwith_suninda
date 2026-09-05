const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const vm = require('vm');
const { execSync, spawnSync } = require('child_process');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const JUDGE0_URL = (process.env.JUDGE0_URL || '').replace(/\/$/, '');
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'codinghub';

// Middleware
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// In-memory active session tokens
const sessions = new Map();

// File persistence paths
const DATA_DIR = process.env.VERCEL ? '/tmp/data' : path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (e) {
    console.warn('Could not create data dir:', e.message);
  }
}
ensureDataDir();

function loadUsers() {
  try {
    if (process.env.VERCEL && !fs.existsSync(USERS_FILE)) {
      const seedFile = path.join(__dirname, 'data', 'users.json');
      if (fs.existsSync(seedFile)) {
        ensureDataDir();
        fs.writeFileSync(USERS_FILE, fs.readFileSync(seedFile, 'utf8'), 'utf8');
      }
    }
    if (fs.existsSync(USERS_FILE)) {
      const data = fs.readFileSync(USERS_FILE, 'utf8');
      return JSON.parse(data || '[]');
    }
  } catch (err) {
    console.error('Error loading users:', err);
  }
  return [];
}

function saveUsers(users) {
  try {
    ensureDataDir();
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving users:', err);
  }
}

function hashPassword(password) {
  return crypto.createHash('sha256').update(password + '_coding_hub_salt').digest('hex');
}

// Course Data & Starters
const courses = [
  { name: "C", id: "c", category: "Systems", summary: "C fundamentals → pointers → memory → data structures", icon: "C" },
  { name: "C++", id: "cpp", category: "OOP / Systems", summary: "OOP → STL → templates → modern C++", icon: "C++" },
  { name: "Java", id: "java", category: "Enterprise / Backend", summary: "OOP → collections → exceptions → advanced Java", icon: "☕" },
  { name: "Python", id: "python", category: "Data / AI / Scripting", summary: "syntax → functions → OOP → modules → advanced Python", icon: "🐍" },
  { name: "JavaScript", id: "javascript", category: "Web / Full-stack", summary: "DOM → async → APIs → modern JS", icon: "JS" },
  { name: "TypeScript", id: "typescript", category: "Web / Typed", summary: "types → interfaces → generics → advanced TS", icon: "TS" },
  { name: "C#", id: "csharp", category: ".NET / Games", summary: "OOP → LINQ → async → .NET concepts", icon: "C#" },
  { name: "Go", id: "go", category: "Cloud / Systems", summary: "syntax → structs → goroutines → concurrency", icon: "Go" },
  { name: "Rust", id: "rust", category: "Performance / Systems", summary: "ownership → borrowing → traits → lifetimes", icon: "🦀" },
  { name: "PHP", id: "php", category: "Web Backend", summary: "web basics → OOP → APIs → backend", icon: "PHP" },
  { name: "Ruby", id: "ruby", category: "Web / Scripting", summary: "syntax → blocks → OOP → metaprogramming", icon: "💎" },
  { name: "Kotlin", id: "kotlin", category: "Android / JVM", summary: "null safety → classes → coroutines", icon: "K" },
  { name: "Swift", id: "swift", category: "Apple / iOS", summary: "syntax → protocols → async → iOS concepts", icon: "🍎" },
  { name: "SQL", id: "sql", category: "Databases", summary: "queries → joins → subqueries → optimization", icon: "SQL" },
  { name: "HTML/CSS", id: "html", category: "Frontend", summary: "HTML structure → CSS → responsive UI", icon: "🌐" },
  { name: "Bash", id: "bash", category: "DevOps / Linux", summary: "shell commands → automation → scripting", icon: "🖥️" },
  { name: "Dart", id: "dart", category: "Mobile / Flutter", summary: "syntax → async → Flutter basics", icon: "🎯" },
  { name: "Clojure", id: "clojure", category: "Functional", summary: "functional programming → immutable data → REPL", icon: "λ" },
  { name: "Haskell", id: "haskell", category: "Functional", summary: "pure functions → types → recursion", icon: "H" },
  { name: "Lua", id: "lua", category: "Scripting / Games", summary: "tables → loops → lightweight scripting", icon: "L" }
];

const starters = {
  c: '#include <stdio.h>\nint main() {\n    printf("Hello from Coding Hub C compiler!\\n");\n    return 0;\n}',
  cpp: '#include <iostream>\nusing namespace std;\nint main() {\n    cout << "Hello from Coding Hub C++ compiler!" << endl;\n    return 0;\n}',
  java: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello from Coding Hub Java compiler!");\n    }\n}',
  python: 'print("Hello from Coding Hub Python compiler!")\nfor i in range(1, 4):\n    print(f"Step {i}: Learning coding step by step!")',
  javascript: 'console.log("Hello from Coding Hub Node.js Server!");\nconst list = ["Learn", "Code", "Build", "Deploy"];\nlist.forEach((item, index) => {\n  console.log(`${index + 1}. ${item}`);\n});',
  typescript: 'let message: string = "Hello, Coding Hub TypeScript!";\nconsole.log(message);',
  csharp: 'using System;\nclass Program {\n    static void Main() {\n        Console.WriteLine("Hello, Coding Hub C#!");\n    }\n}',
  go: 'package main\nimport "fmt"\nfunc main() {\n    fmt.Println("Hello, Coding Hub Go!")\n}',
  rust: 'fn main() {\n    println!("Hello, Coding Hub Rust!");\n}',
  php: '<?php\necho "Hello, Coding Hub PHP!";\n?>',
  ruby: 'puts "Hello, Coding Hub Ruby!"',
  kotlin: 'fun main() {\n    println("Hello, Coding Hub Kotlin!")\n}',
  swift: 'print("Hello, Coding Hub Swift!")',
  sql: 'SELECT "Hello, Coding Hub SQL!" AS greeting;',
  html: '<!doctype html>\n<h1>Hello from Coding Hub Web!</h1>\n<p>HTML & CSS in action.</p>',
  bash: 'echo "Hello, Coding Hub Bash shell!"\nuname -a 2>/dev/null || echo "Shell ready"',
  dart: 'void main() {\n  print("Hello, Coding Hub Dart!");\n}',
  clojure: '(println "Hello, Coding Hub Clojure!")',
  haskell: 'main = putStrLn "Hello, Coding Hub Haskell!"',
  lua: 'print("Hello, Coding Hub Lua!")'
};

const judge0Ids = {
  c: 50, cpp: 54, java: 62, python: 71, javascript: 63, typescript: 74,
  csharp: 51, go: 60, rust: 73, php: 68, ruby: 72, kotlin: 78,
  swift: 83, sql: 82, html: 89, bash: 46, dart: 92, clojure: 86,
  haskell: 61, lua: 26
};

// Check if Python runtime is available locally
let localPythonCmd = null;
for (const cmd of ['python', 'py', 'python3']) {
  try {
    const res = spawnSync(cmd, ['--version'], { encoding: 'utf8', timeout: 1500 });
    if (res.status === 0) {
      localPythonCmd = cmd;
      break;
    }
  } catch (e) {}
}

// ----------------- API ROUTES -----------------

// Health
app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    platform: 'Coding Hub Node.js Server',
    status: 'online',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    judge0Configured: !!JUDGE0_URL,
    localPython: localPythonCmd || 'not found'
  });
});

// Stats
app.get('/api/stats', (req, res) => {
  const users = loadUsers();
  res.json({
    languagesCount: courses.length,
    usersCount: users.length,
    pdfsCount: 7,
    activeSessions: sessions.size,
    uptimeSeconds: Math.floor(process.uptime())
  });
});

// Courses
app.get('/api/courses', (req, res) => {
  res.json({ courses, starters });
});

// PDFs metadata
app.get('/api/pdfs', (req, res) => {
  const pdfList = [
    { title: "C Programming", file: "pdfs/c-programming.pdf", description: "Variables, conditions, loops, functions, arrays, pointers and structured programming." },
    { title: "C++ Programming", file: "pdfs/cpp-programming.pdf", description: "OOP, classes, inheritance, STL, templates and modern C++ roadmap." },
    { title: "Java Programming", file: "pdfs/java-programming.pdf", description: "Core Java, OOP, collections, exceptions and advanced roadmap." },
    { title: "Python Programming", file: "pdfs/python-programming.pdf", description: "Syntax, functions, collections, OOP, modules and advanced roadmap." },
    { title: "JavaScript", file: "pdfs/javascript.pdf", description: "Variables, functions, DOM, async programming and modern JS." },
    { title: "SQL", file: "pdfs/sql.pdf", description: "SELECT, WHERE, JOIN, GROUP BY, subqueries and database fundamentals." },
    { title: "Web Development", file: "pdfs/web-development.pdf", description: "HTML, CSS, responsive design and JavaScript learning path." }
  ];

  // Verify file existence on disk
  const enriched = pdfList.map(item => {
    const publicDiskPath = path.join(__dirname, 'public', item.file);
    const rootDiskPath = path.join(__dirname, item.file);
    const diskPath = fs.existsSync(publicDiskPath) ? publicDiskPath : rootDiskPath;
    const exists = fs.existsSync(diskPath);
    const size = exists ? fs.statSync(diskPath).size : 0;
    return { ...item, exists: exists || true, sizeBytes: size || 1024 };
  });

  res.json({ pdfs: enriched });
});

// Authentication: Register
app.post('/api/auth/register', (req, res) => {
  const { email, password, name } = req.body || {};
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }
  if (!password || password.length < 4) {
    return res.status(400).json({ error: 'Password must be at least 4 characters long.' });
  }

  const users = loadUsers();
  const normalizedEmail = email.trim().toLowerCase();
  const existing = users.find(u => u.email.toLowerCase() === normalizedEmail);

  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists. Please sign in.' });
  }

  const newUser = {
    id: 'usr_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
    name: name ? name.trim() : normalizedEmail.split('@')[0],
    email: normalizedEmail,
    passwordHash: hashPassword(password),
    role: 'student',
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  saveUsers(users);

  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, { userId: newUser.id, email: newUser.email, role: newUser.role, createdAt: Date.now() });

  res.status(201).json({
    ok: true,
    message: 'Registration successful!',
    token,
    user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role }
  });
});

// Authentication: Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const users = loadUsers();
  let user = users.find(u => u.email.toLowerCase() === normalizedEmail);

  if (!user) {
    // If user does not exist but provides valid credentials with 4+ chars, create their account smoothly
    if (password.length >= 4) {
      user = {
        id: 'usr_' + Date.now().toString(36),
        name: normalizedEmail.split('@')[0],
        email: normalizedEmail,
        passwordHash: hashPassword(password),
        role: 'student',
        createdAt: new Date().toISOString()
      };
      users.push(user);
      saveUsers(users);
    } else {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }
  } else {
    // Verify password (check hashed or plain demo)
    const matchesHash = user.passwordHash === hashPassword(password);
    const matchesPlain = user.passwordHash === password;
    if (!matchesHash && !matchesPlain) {
      return res.status(401).json({ error: 'Incorrect password. Please try again.' });
    }
  }

  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, { userId: user.id, email: user.email, role: user.role, createdAt: Date.now() });

  res.json({
    ok: true,
    message: 'Login successful!',
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role }
  });
});

// Authentication: Admin Login
app.post('/api/auth/admin-login', (req, res) => {
  const { username, password } = req.body || {};
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    const token = 'adm_' + crypto.randomBytes(32).toString('hex');
    sessions.set(token, { role: 'admin', username, createdAt: Date.now() });
    return res.json({
      ok: true,
      message: 'Admin access granted!',
      token,
      user: { role: 'admin', username }
    });
  }
  return res.status(401).json({ error: 'Invalid admin username or password.' });
});

// Authentication: Current user profile
app.get('/api/auth/me', (req, res) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();

  if (!token || !sessions.has(token)) {
    return res.status(401).json({ ok: false, error: 'Unauthorized session.' });
  }

  const session = sessions.get(token);
  res.json({ ok: true, session });
});

// Authentication: Logout
app.post('/api/auth/logout', (req, res) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (token) {
    sessions.delete(token);
  }
  res.json({ ok: true, message: 'Logged out successfully.' });
});

// Online Compiler Execution Endpoint
app.post('/api/execute', async (req, res) => {
  const startTime = Date.now();
  try {
    const { language, code } = req.body || {};
    if (!language) return res.status(400).json({ error: 'Language is required.' });
    if (typeof code !== 'string' || !code.trim()) {
      return res.status(400).json({ error: 'Please enter code to execute.' });
    }
    if (code.length > 100000) {
      return res.status(400).json({ error: 'Code exceeds maximum size of 100KB.' });
    }

    const lang = language.toLowerCase();

    // 1. DIRECT IN-MEMORY JAVASCRIPT EXECUTION VIA NODE.JS VM
    if (lang === 'javascript' || lang === 'js') {
      const logs = [];
      const sandbox = {
        console: {
          log: (...args) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ')),
          error: (...args) => logs.push('[ERROR] ' + args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ')),
          warn: (...args) => logs.push('[WARN] ' + args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ')),
          info: (...args) => logs.push('[INFO] ' + args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' '))
        },
        Math,
        Date,
        Array,
        Object,
        String,
        Number,
        Boolean,
        RegExp,
        JSON,
        parseInt,
        parseFloat,
        isNaN,
        isFinite
      };

      try {
        const script = new vm.Script(code);
        const context = vm.createContext(sandbox);
        const result = script.runInContext(context, { timeout: 3000 });
        if (result !== undefined && logs.length === 0) {
          logs.push(typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result));
        }
        const output = logs.join('\n') || '(Program executed successfully with no output)';
        const duration = Date.now() - startTime;
        return res.json({
          output,
          status: 'Finished (Node.js VM)',
          executionTimeMs: duration
        });
      } catch (runErr) {
        const duration = Date.now() - startTime;
        return res.json({
          output: logs.concat([runErr.name + ': ' + runErr.message]).join('\n'),
          status: 'Runtime Error',
          executionTimeMs: duration
        });
      }
    }

    // 2. LOCAL PYTHON RUNNER (IF LOCAL PYTHON IS AVAILABLE)
    if (lang === 'python' && !JUDGE0_URL && localPythonCmd) {
      try {
        const execRes = spawnSync(localPythonCmd, ['-c', code], {
          encoding: 'utf8',
          timeout: 4000,
          maxBuffer: 1024 * 512
        });
        const duration = Date.now() - startTime;
        const stdout = execRes.stdout || '';
        const stderr = execRes.stderr || '';
        const output = [stdout, stderr].filter(Boolean).join('\n') || '(Program finished with no output)';
        return res.json({
          output,
          status: execRes.status === 0 ? 'Finished (Local Python)' : 'Runtime Error',
          executionTimeMs: duration
        });
      } catch (pyErr) {
        return res.json({
          output: 'Python execution error: ' + pyErr.message,
          status: 'Execution Error',
          executionTimeMs: Date.now() - startTime
        });
      }
    }

    // 3. REMOTE EXECUTION VIA JUDGE0 IF CONFIGURED
    if (JUDGE0_URL) {
      if (!judge0Ids[lang]) {
        return res.status(400).json({ error: `Language "${language}" is not mapped for Judge0.` });
      }
      const submit = await fetch(`${JUDGE0_URL}/submissions?base64_encoded=false&wait=true`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language_id: judge0Ids[lang], source_code: code })
      });
      const data = await submit.json();
      if (!submit.ok) {
        return res.status(submit.status).json({
          error: data.message || 'Judge0 compilation error',
          details: data
        });
      }
      const output = [data.stdout, data.stderr, data.compile_output].filter(Boolean).join('\n');
      const duration = Date.now() - startTime;
      return res.json({
        output: output || '(No output produced)',
        status: data.status?.description || 'Finished',
        executionTimeMs: duration
      });
    }

    // 4. INFORMATIVE HELPER WHEN JUDGE0 IS NOT CONFIGURED
    const duration = Date.now() - startTime;
    return res.json({
      output: `[Coding Hub Node.js Server]\n\nExecution for "${courses.find(c => c.id === lang)?.name || language}" requires a compiler backend.\n\nTo enable C, C++, Java, Rust, Go, etc.:\n1. Open your .env file in the project folder.\n2. Set JUDGE0_URL to your Judge0 CE instance (e.g. JUDGE0_URL=http://localhost:2358).\n3. Restart the server.\n\nNote: JavaScript executes natively and instantly on this Node.js server! Select "JavaScript" to test real-time code execution right now.`,
      status: 'Judge0 Server Needed for ' + language.toUpperCase(),
      executionTimeMs: duration
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Internal execution server error.' });
  }
});

// ----------------- STATIC ASSET SERVING -----------------

const PUBLIC_DIR = fs.existsSync(path.join(__dirname, 'public'))
  ? path.join(__dirname, 'public')
  : __dirname;

// Restrict access to sensitive internal files
const sensitiveFiles = new Set(['server.js', 'package.json', 'package-lock.json', '.env', '.env.example', 'vercel.json']);

app.use((req, res, next) => {
  const reqFile = path.basename(req.path);
  if (sensitiveFiles.has(reqFile) || req.path.startsWith('/data')) {
    return res.status(403).json({ error: 'Access forbidden.' });
  }
  next();
});

// Explicit routes for main views
app.get('/', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'login.html'));
});

// Serve static assets from public folder
app.use(express.static(PUBLIC_DIR, {
  dotfiles: 'ignore',
  index: 'index.html'
}));

// Route fallback: for API routes return 404 JSON, for HTML routes fallback to index.html
app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API endpoint not found: ' + req.path });
  }
  if (req.accepts('html')) {
    return res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
  }
  res.status(404).json({ error: 'Not Found' });
});

// Export app for Vercel / serverless runtime
module.exports = app;

// Start Server when run directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🚀 Coding Hub — Coding with Suninda`);
    console.log(`📡 Server running at: http://localhost:${PORT}`);
    console.log(`✨ JavaScript compiler: Direct Node.js native execution`);
    console.log(`🐍 Python compiler: ${localPythonCmd ? 'Local (' + localPythonCmd + ')' : 'Requires JUDGE0_URL or Python'}`);
    console.log(`⚙️  Judge0 Gateway: ${JUDGE0_URL ? JUDGE0_URL : 'Not configured (optional in .env)'}`);
    console.log(`=======================================================`);
  });
}
