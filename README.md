# Coding Hub — Coding with Suninda (Full Node.js Platform)

A full-stack, responsive coding and learning platform powered by **Node.js & Express**:
- 🚀 **Unified Node.js Web Server**: One server serves both the frontend web app and backend REST APIs on `http://localhost:3000`.
- 💻 **Online Compiler API**:
  - Native in-memory execution for **JavaScript (Node.js VM)** with real console capture and execution timing.
  - Local runtime execution for **Python** (if Python is installed).
  - Optional **Judge0 CE** integration for compiling C, C++, Java, Rust, Go, etc.
- 🔐 **Authentication & Sessions**:
  - User sign-in, registration, and logout with file-based persistence (`data/users.json`).
  - Admin login (`admin` / `codinghub`) with live system metrics and server monitoring.
- 📚 **Study Library & Courses**:
  - 20+ programming language roadmaps.
  - Interactive PDF study guides library.
- 📱 **PWA Ready**: Mobile-first design, offline caching with service worker.

---

## 🚀 How to Run / কীভাবে চালাবেন

### 1. Requirements
- **Node.js 18+** installed.

### 2. Install Dependencies
In the project root folder, open terminal and run:
```bash
npm install
```
*(On Windows PowerShell, you can also use `npm.cmd install`)*

### 3. Start the Server
```bash
npm start
```
Or for development with auto-reload:
```bash
npm run dev
```

### 4. Open in Browser
Open:
```
http://localhost:3000
```
or standalone sign-in page:
```
http://localhost:3000/login
```

---

## 🔑 Admin Credentials
- **Username**: `admin`
- **Password**: `codinghub`
*(You can customize these in `.env`)*

---

## ⚙️ Environment Configuration (`.env`)
You can edit the `.env` file in the root folder:
```env
PORT=3000
NODE_ENV=development
ADMIN_USERNAME=admin
ADMIN_PASSWORD=codinghub

# Optional: Remote Judge0 compiler gateway
JUDGE0_URL=
```

---

## 🌐 API Endpoints
- `GET /api/health` - Server health and environment status
- `GET /api/stats` - Platform stats (users, languages, uptime)
- `GET /api/courses` - Programming language courses & code starters
- `GET /api/pdfs` - PDF study library list
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User authentication
- `POST /api/auth/admin-login` - Admin authentication
- `POST /api/auth/logout` - User logout
- `POST /api/execute` - Code compiler & runner
