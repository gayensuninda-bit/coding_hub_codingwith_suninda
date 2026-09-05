// Coding Hub Client Logic — Node.js Integrated Full-Stack App
let languages = [
  ["C", "c", "C", "C fundamentals → pointers → memory → data structures"],
  ["C++", "cpp", "C++", "OOP → STL → templates → modern C++"],
  ["Java", "java", "Java", "OOP → collections → exceptions → advanced Java"],
  ["Python", "python", "Python", "syntax → functions → OOP → modules → advanced Python"],
  ["JavaScript", "javascript", "JavaScript", "DOM → async → APIs → modern JS"],
  ["TypeScript", "typescript", "TypeScript", "types → interfaces → generics → advanced TS"],
  ["C#", "csharp", "C#", "OOP → LINQ → async → .NET concepts"],
  ["Go", "go", "Go", "syntax → structs → goroutines → concurrency"],
  ["Rust", "rust", "Rust", "ownership → borrowing → traits → lifetimes"],
  ["PHP", "php", "PHP", "web basics → OOP → APIs → backend"],
  ["Ruby", "ruby", "Ruby", "syntax → blocks → OOP → metaprogramming"],
  ["Kotlin", "kotlin", "Kotlin", "null safety → classes → coroutines"],
  ["Swift", "swift", "Swift", "syntax → protocols → async → iOS concepts"],
  ["SQL", "sql", "SQL", "queries → joins → subqueries → optimization"],
  ["HTML/CSS", "html", "Web", "HTML structure → CSS → responsive UI"],
  ["Bash", "bash", "Bash", "shell commands → automation → scripting"],
  ["Dart", "dart", "Dart", "syntax → async → Flutter basics"],
  ["Clojure", "clojure", "Clojure", "functional programming → immutable data → REPL"],
  ["Haskell", "haskell", "Haskell", "pure functions → types → recursion"],
  ["Lua", "lua", "Lua", "tables → loops → lightweight scripting"]
];

let starters = {
  c: '#include <stdio.h>\nint main() {\n    printf("Hello from Coding Hub C!\\n");\n    return 0;\n}',
  cpp: '#include <iostream>\nusing namespace std;\nint main() {\n    cout << "Hello from Coding Hub C++!" << endl;\n    return 0;\n}',
  java: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello from Coding Hub Java!");\n    }\n}',
  python: 'print("Hello from Coding Hub Python!")\nnumbers = [1, 2, 3, 4, 5]\nprint("Squares:", [x**2 for x in numbers])',
  javascript: 'console.log("Hello from Coding Hub Node.js Server!");\nconst list = ["Learn", "Code", "Build", "Deploy"];\nlist.forEach((item, index) => {\n    console.log(`${index + 1}. ${item}`);\n});',
  typescript: 'let message: string = "Hello from Coding Hub TypeScript!";\nconsole.log(message);',
  csharp: 'using System;\nclass Program {\n    static void Main() {\n        Console.WriteLine("Hello from Coding Hub C#!");\n    }\n}',
  go: 'package main\nimport "fmt"\nfunc main() {\n    fmt.Println("Hello from Coding Hub Go!")\n}',
  rust: 'fn main() {\n    println!("Hello from Coding Hub Rust!");\n}',
  php: '<?php\necho "Hello from Coding Hub PHP!";\n?>',
  ruby: 'puts "Hello from Coding Hub Ruby!"',
  kotlin: 'fun main() {\n    println("Hello from Coding Hub Kotlin!")\n}',
  swift: 'print("Hello from Coding Hub Swift!")',
  sql: 'SELECT "Hello from Coding Hub SQL!" AS greeting;',
  html: '<!doctype html>\n<h1>Hello from Coding Hub Web!</h1>\n<p>HTML & CSS in action.</p>',
  bash: 'echo "Hello from Coding Hub Bash shell!"',
  dart: 'void main() {\n    print("Hello from Coding Hub Dart!");\n}',
  clojure: '(println "Hello from Coding Hub Clojure!")',
  haskell: 'main = putStrLn "Hello from Coding Hub Haskell!"',
  lua: 'print("Hello from Coding Hub Lua!")'
};

const icons = {
  C: "C", "C++": "C++", Java: "☕", Python: "🐍",
  JavaScript: "JS", TypeScript: "TS", "C#": "C#", Go: "Go",
  Rust: "🦀", PHP: "PHP", Ruby: "💎", Kotlin: "K",
  Swift: "🍎", SQL: "SQL", "HTML/CSS": "🌐", Bash: "🖥️",
  Dart: "🎯", Clojure: "λ", Haskell: "H", Lua: "L"
};

function showPage(id) {
  document.querySelectorAll('.page').forEach(x => x.classList.remove('active'));
  const target = document.getElementById(id);
  if (target) {
    target.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function showLoginMessage(message, isError = false) {
  const el = document.getElementById('loginMessage');
  if (el) {
    el.textContent = message;
    el.style.color = isError ? '#f87171' : '#34d399';
  }
  return false;
}

function togglePassword() {
  const input = document.getElementById('loginPassword');
  const button = document.querySelector('.password-toggle');
  if (!input || !button) return;
  const visible = input.type === 'text';
  input.type = visible ? 'password' : 'text';
  button.textContent = visible ? 'Show' : 'Hide';
  button.setAttribute('aria-label', visible ? 'Show password' : 'Hide password');
}

function enterWorkspace(user) {
  const loginPage = document.getElementById('loginPage');
  const appEl = document.getElementById('app');
  if (loginPage) loginPage.hidden = true;
  if (appEl) appEl.hidden = false;

  const userBadge = document.getElementById('currentUserBadge');
  if (userBadge) {
    const savedUser = user || JSON.parse(localStorage.getItem('ch_user') || '{}');
    if (savedUser && savedUser.name) {
      userBadge.textContent = `👤 ${savedUser.name}`;
      userBadge.style.display = 'inline-block';
    }
  }
}

function userLogout() {
  const token = localStorage.getItem('ch_token');
  if (token) {
    fetch('/api/auth/logout', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    }).catch(() => {});
  }
  localStorage.removeItem('ch_session');
  localStorage.removeItem('ch_token');
  localStorage.removeItem('ch_user');
  location.reload();
}

function setupLogin() {
  const form = document.getElementById('loginForm');
  if (!form) return;

  if (localStorage.getItem('ch_session') === '1') {
    enterWorkspace();
  }

  let isRegisterMode = false;
  const tabSignIn = document.getElementById('tabSignIn');
  const tabSignUp = document.getElementById('tabSignUp');
  const nameFieldGroup = document.getElementById('nameFieldGroup');
  const formEyebrow = document.getElementById('formEyebrow');
  const formTitle = document.getElementById('formTitle');
  const formSubtitle = document.getElementById('formSubtitle');
  const btnText = document.getElementById('btnText');
  const submitBtn = document.getElementById('submitBtn');
  const switchCopy = document.getElementById('switchCopy');
  const emailInput = document.getElementById('loginEmail');
  const passwordInput = document.getElementById('loginPassword');
  const nameInput = document.getElementById('loginName');
  const quickDemoBtn = document.getElementById('quickDemoBtn');
  const messageBox = document.getElementById('loginMessageBox');
  const messageText = document.getElementById('loginMessageText');
  const messageIcon = document.getElementById('loginMessageIcon');

  function showStatus(text, type = 'success') {
    if (messageBox) {
      messageBox.style.display = 'flex';
      messageBox.className = 'login-message-box msg-' + type;
      if (messageText) messageText.textContent = text;
      if (messageIcon) messageIcon.textContent = type === 'success' ? '✅' : (type === 'error' ? '⚠️' : 'ℹ️');
    }
  }

  function hideStatus() {
    if (messageBox) messageBox.style.display = 'none';
  }

  function setMode(register) {
    isRegisterMode = register;
    if (isRegisterMode) {
      if (tabSignUp) { tabSignUp.classList.add('active'); tabSignUp.setAttribute('aria-selected', 'true'); }
      if (tabSignIn) { tabSignIn.classList.remove('active'); tabSignIn.setAttribute('aria-selected', 'false'); }
      if (nameFieldGroup) nameFieldGroup.style.display = 'block';
      if (formEyebrow) formEyebrow.textContent = 'JOIN CODING HUB';
      if (formTitle) formTitle.textContent = 'Create your account';
      if (formSubtitle) formSubtitle.textContent = 'Start learning, practicing, and compiling code in seconds.';
      if (btnText) btnText.textContent = 'Create Free Account';
      if (switchCopy) switchCopy.innerHTML = 'Already have an account? <a href="#" id="switchModeLink" class="accent-link">Sign in</a>';
    } else {
      if (tabSignIn) { tabSignIn.classList.add('active'); tabSignIn.setAttribute('aria-selected', 'true'); }
      if (tabSignUp) { tabSignUp.classList.remove('active'); tabSignUp.setAttribute('aria-selected', 'false'); }
      if (nameFieldGroup) nameFieldGroup.style.display = 'none';
      if (formEyebrow) formEyebrow.textContent = 'WELCOME BACK';
      if (formTitle) formTitle.textContent = 'Sign in to your workspace';
      if (formSubtitle) formSubtitle.textContent = 'Continue where you left off and keep your coding streak alive.';
      if (btnText) btnText.textContent = 'Sign in to Coding Hub';
      if (switchCopy) switchCopy.innerHTML = 'New to Coding Hub? <a href="#" id="switchModeLink" class="accent-link">Create an account</a>';
    }
    hideStatus();
    reattachSwitch();
  }

  function reattachSwitch() {
    const link = document.getElementById('switchModeLink');
    if (link) {
      link.onclick = (e) => {
        e.preventDefault();
        setMode(!isRegisterMode);
      };
    }
  }

  if (tabSignIn) tabSignIn.onclick = () => setMode(false);
  if (tabSignUp) tabSignUp.onclick = () => setMode(true);
  reattachSwitch();

  if (quickDemoBtn) {
    quickDemoBtn.onclick = () => {
      setMode(false);
      if (emailInput) emailInput.value = 'demo@codinghub.com';
      if (passwordInput) passwordInput.value = 'codinghub123';
      showStatus('Demo credentials filled! Click sign in to enter.', 'info');
    };
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const email = emailInput ? emailInput.value.trim() : '';
    const password = passwordInput ? passwordInput.value : '';
    const name = nameInput ? nameInput.value.trim() : '';

    if (!email || !email.includes('@')) {
      showStatus('Enter a valid email address.', 'error');
      if (emailInput) emailInput.focus();
      return;
    }

    if (password.length < 4) {
      showStatus('Password must be at least 4 characters long.', 'error');
      if (passwordInput) passwordInput.focus();
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.classList.add('loading');
    }
    if (btnText) btnText.textContent = isRegisterMode ? 'Creating Account…' : 'Signing In…';
    hideStatus();

    try {
      const endpoint = isRegisterMode ? '/api/auth/register' : '/api/auth/login';
      const body = isRegisterMode ? { email, password, name } : { email, password };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      if (document.getElementById('rememberMe')?.checked) {
        localStorage.setItem('ch_session', '1');
      }
      if (data.token) {
        localStorage.setItem('ch_token', data.token);
      }
      if (data.user) {
        localStorage.setItem('ch_user', JSON.stringify(data.user));
      }

      showStatus(
        isRegisterMode ? `Account created! Welcome, ${data.user?.name || email}!` : `Welcome back, ${data.user?.name || email}! Launching workspace…`,
        'success'
      );
      setTimeout(() => enterWorkspace(data.user), 550);
    } catch (err) {
      showStatus(err.message, 'error');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.classList.remove('loading');
      }
      if (btnText) btnText.textContent = isRegisterMode ? 'Create Free Account' : 'Sign in to Coding Hub';
    }
  });

  const forgotLink = document.getElementById('forgotPassword');
  if (forgotLink) {
    forgotLink.onclick = (e) => {
      e.preventDefault();
      showStatus('For instant access, use demo: demo@codinghub.com / codinghub123', 'info');
    };
  }

  const googleBtn = document.getElementById('googleLogin');
  if (googleBtn) {
    googleBtn.onclick = () => {
      showStatus('Google sign-in is ready to connect to OAuth provider.', 'info');
    };
  }
}

async function renderCourses() {
  try {
    const res = await fetch('/api/courses');
    if (res.ok) {
      const data = await res.json();
      if (data.courses && Array.isArray(data.courses)) {
        languages = data.courses.map(c => [c.name, c.id, c.category, c.summary]);
      }
      if (data.starters) {
        starters = { ...starters, ...data.starters };
      }
    }
  } catch (e) {
    console.log('Using local course templates');
  }

  const container = document.getElementById('courseGrid');
  if (!container) return;
  container.innerHTML = languages.map(x => `
    <div class="card" onclick="selectCourseAndOpen('${x[1]}')" style="cursor:pointer" title="Open ${x[0]} in compiler">
      <div class="icon">${icons[x[0]] || "⚡"}</div>
      <h3>${x[0]}</h3>
      <p>${x[3]}</p>
      <span class="tag">Basic → Advanced</span>
    </div>
  `).join('');
}

function selectCourseAndOpen(langId) {
  const sel = document.getElementById('language');
  if (sel) {
    sel.value = langId;
    loadStarter();
  }
  showPage('compiler');
}

async function renderPDFs() {
  let pdfs = [
    { title: "C Programming", file: "pdfs/c-programming.pdf", description: "Variables, conditions, loops, functions, arrays, pointers and structured programming." },
    { title: "C++ Programming", file: "pdfs/cpp-programming.pdf", description: "OOP, classes, inheritance, STL, templates and modern C++ roadmap." },
    { title: "Java Programming", file: "pdfs/java-programming.pdf", description: "Core Java, OOP, collections, exceptions and advanced roadmap." },
    { title: "Python Programming", file: "pdfs/python-programming.pdf", description: "Syntax, functions, collections, OOP, modules and advanced roadmap." },
    { title: "JavaScript", file: "pdfs/javascript.pdf", description: "Variables, functions, DOM, async programming and modern JS." },
    { title: "SQL", file: "pdfs/sql.pdf", description: "SELECT, WHERE, JOIN, GROUP BY, subqueries and database fundamentals." },
    { title: "Web Development", file: "pdfs/web-development.pdf", description: "HTML, CSS, responsive design and JavaScript learning path." }
  ];

  try {
    const res = await fetch('/api/pdfs');
    if (res.ok) {
      const data = await res.json();
      if (data.pdfs && data.pdfs.length) {
        pdfs = data.pdfs;
      }
    }
  } catch (e) {
    console.log('Using local PDF listings');
  }

  const grid = document.getElementById('pdfGrid');
  if (!grid) return;
  grid.innerHTML = pdfs.map(p => `
    <div class="card">
      <div class="icon">📘</div>
      <h3>${p.title}</h3>
      <p>${p.description}</p>
      <a class="primary" style="display:inline-block;text-decoration:none;margin-top:8px" href="${p.file}" download>Download PDF</a>
    </div>
  `).join('');
}

function setupCompiler() {
  const sel = document.getElementById('language');
  if (!sel) return;
  sel.innerHTML = languages.map(x => `<option value="${x[1]}">${x[0]}</option>`).join('');
  sel.onchange = loadStarter;
  loadStarter();
}

function loadStarter() {
  const lang = document.getElementById('language').value;
  document.getElementById('code').value = starters[lang] || '';
  updateLines();
}

function updateLines() {
  const codeEl = document.getElementById('code');
  if (!codeEl) return;
  const n = codeEl.value.split('\n').length;
  document.getElementById('lines').textContent = Array.from({ length: n }, (_, i) => i + 1).join('\n');
}

async function runCode() {
  const langSel = document.getElementById('language');
  const codeEl = document.getElementById('code');
  const out = document.getElementById('output');
  const status = document.getElementById('status');

  const language = langSel.value;
  const source = codeEl.value;

  if (!source.trim()) {
    out.textContent = "Please write some code first.";
    return;
  }

  status.textContent = "Running…";
  status.style.color = "#93c5fd";
  out.textContent = "Sending code to Coding Hub Node.js execution engine…";

  try {
    const apiEndpoint = (window.CODING_HUB_API || localStorage.getItem("CODING_HUB_API") || "").replace(/\/$/, '') || '/api';
    const executeUrl = apiEndpoint.endsWith('/execute') ? apiEndpoint : `${apiEndpoint}/execute`;

    const r = await fetch(executeUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language, code: source })
    });

    const data = await r.json();
    if (!r.ok) {
      throw new Error(data.error || "Compiler server error");
    }

    out.textContent = data.output || "(No output)";
    const duration = data.executionTimeMs !== undefined ? ` • ${data.executionTimeMs}ms` : '';
    status.textContent = (data.status || "Finished") + duration;
    status.style.color = data.status && data.status.includes('Error') ? "#f87171" : "#34d399";
  } catch (e) {
    out.textContent = `${e.message}\n\n[Tip] JavaScript runs directly on this server! For C/C++/Java/etc., configure JUDGE0_URL in .env.`;
    status.textContent = "Connection Error";
    status.style.color = "#f87171";
  }
}

async function adminLogin() {
  const username = document.getElementById('adminUser').value.trim();
  const password = document.getElementById('adminPass').value;

  if (!username || !password) {
    alert("Please provide both username and password.");
    return;
  }

  try {
    const res = await fetch('/api/auth/admin-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Admin authentication failed");
    }

    localStorage.setItem("ch_admin", "1");
    if (data.token) {
      localStorage.setItem("ch_admin_token", data.token);
    }
    renderAdmin();
  } catch (err) {
    alert(err.message || "Invalid admin credentials.");
  }
}

function adminLogout() {
  localStorage.removeItem("ch_admin");
  localStorage.removeItem("ch_admin_token");
  renderAdmin();
}

async function renderAdmin() {
  const ok = localStorage.getItem("ch_admin") === "1";
  const loginBox = document.getElementById('loginBox');
  const panelBox = document.getElementById('panelBox');

  if (loginBox) loginBox.hidden = ok;
  if (panelBox) panelBox.hidden = !ok;

  if (ok) {
    // Load live system stats
    try {
      const res = await fetch('/api/stats');
      if (res.ok) {
        const stats = await res.json();
        const statEl = document.getElementById('adminStatsDisplay');
        if (statEl) {
          statEl.innerHTML = `
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:12px;margin:16px 0;">
              <div style="background:rgba(255,255,255,0.04);padding:12px;border-radius:8px;border:1px solid rgba(255,255,255,0.08);text-align:center;">
                <b style="font-size:1.4rem;color:#60a5fa">${stats.usersCount}</b><br><small style="color:#94a3b8">Users</small>
              </div>
              <div style="background:rgba(255,255,255,0.04);padding:12px;border-radius:8px;border:1px solid rgba(255,255,255,0.08);text-align:center;">
                <b style="font-size:1.4rem;color:#34d399">${stats.languagesCount}</b><br><small style="color:#94a3b8">Languages</small>
              </div>
              <div style="background:rgba(255,255,255,0.04);padding:12px;border-radius:8px;border:1px solid rgba(255,255,255,0.08);text-align:center;">
                <b style="font-size:1.4rem;color:#fbbf24">${stats.pdfsCount}</b><br><small style="color:#94a3b8">PDF Guides</small>
              </div>
              <div style="background:rgba(255,255,255,0.04);padding:12px;border-radius:8px;border:1px solid rgba(255,255,255,0.08);text-align:center;">
                <b style="font-size:1.4rem;color:#a78bfa">${stats.uptimeSeconds}s</b><br><small style="color:#94a3b8">Server Uptime</small>
              </div>
            </div>
          `;
        }
      }
    } catch (e) {}
  }
}

// Typing loop animation
let phrases = ["C / C++ / Java / Python / JavaScript", "Learn • Practice • Compile • Run", "Full-Stack Node.js Platform", "Coding with Suninda"];
let pi = 0, ci = 0, del = false;

function typeLoop() {
  const el = document.getElementById("typed");
  if (!el) return;
  let s = phrases[pi];
  if (!del) {
    el.textContent = s.slice(0, ++ci);
    if (ci >= s.length) {
      del = true;
      setTimeout(typeLoop, 1200);
      return;
    }
  } else {
    el.textContent = s.slice(0, --ci);
    if (ci <= 0) {
      del = false;
      pi = (pi + 1) % phrases.length;
    }
  }
  setTimeout(typeLoop, del ? 40 : 70);
}

document.addEventListener('DOMContentLoaded', () => {
  setupLogin();
  renderCourses();
  renderPDFs();
  setupCompiler();
  renderAdmin();

  const codeInput = document.getElementById('code');
  if (codeInput) {
    codeInput.addEventListener('input', updateLines);
  }

  typeLoop();

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
});
