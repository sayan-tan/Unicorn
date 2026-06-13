# ReviewMate

A full-stack demo dashboard for **code quality**, **security (SAST)**, and **GitHub** insights, with a Next.js UI and a FastAPI backend.

## Features

- Code quality scans (clone + static analysis + AI summaries)
- Security scanning (Semgrep, Gitleaks, dependency checks) when those tools are installed
- GitHub insights (forks, contributors, issues, pull requests)
- Context-aware chat assistant (OpenAI)

## Prerequisites

- **Node.js** 18+ (project uses Next.js 15)
- **Python** 3.10+
- **Git** (backend clones repositories for scans)
- Optional: **Semgrep**, **Gitleaks**, **npm**, **pylint**, **eslint**, **radon** for full scan parity

## Quick start

### 1. Clone and install

```bash
git clone https://github.com/sayan-tan/ReviewMate.git
cd Unicorn
npm install
```

### 2. Backend (single entrypoint)

Run the API from the **`backend`** directory so configuration loads correctly:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python run.py
```

The API serves at [http://localhost:8000](http://localhost:8000) (see `backend/run.py` → `app.main:app`).

### 3. Frontend

From the **repository root** (in a second terminal):

```bash
npm run dev
```

The app is at [http://localhost:3000](http://localhost:3000).

### 4. Environment variables

Create **`backend/.env`** (loaded when you start the API from `backend/`):

```bash
# Required for GitHub API routes and cloning (use a classic PAT with repo scope as needed)
GITHUB_TOKEN=your_github_personal_access_token

# Required for AI chat and code-quality AI steps
OPENAI_API_KEY=your_openai_api_key

# Optional: set in production; demo defaults are insecure
SECRET_KEY=your_random_secret
```

Create **`.env.local`** in the repo root for the Next app if you change API origin:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

Never commit `.env` or `.env.local`; they are gitignored.

### Demo login

Authentication is **stubbed for demos** only. Valid accounts:

| Email | Password |
| --- | --- |
| `demouser@example.com` | `password123` |
| `demo@example.com` | `password123` |

## Production build (frontend)

```bash
npm run build
npm start
```

## Project structure

```
.
├── backend/
│   ├── run.py              # Start here: uvicorn app.main:app
│   ├── app/
│   │   ├── main.py         # FastAPI app factory
│   │   ├── api/            # Routers (auth, chatbot, scans, GitHub, SAST)
│   │   └── core/           # Settings, security
│   ├── context/            # Chatbot context files
│   └── requirements.txt
├── src/                    # Next.js app (App Router)
├── public/
├── package.json
└── README.md
```

## GitHub token

To create a token: GitHub → **Settings** → **Developer settings** → **Personal access tokens**. For private repos, include **`repo`**; for org visibility you may need **`read:org`** and **`read:user`** as appropriate.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes
4. Push and open a pull request

## License

This project is licensed under the MIT License.
