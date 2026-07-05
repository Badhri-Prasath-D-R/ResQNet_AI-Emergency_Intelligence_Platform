# ResQNet AI – Emergency Intelligence Platform

ResQNet AI is a production-ready tactical operations center (EOC) and Emergency Intelligence Platform designed to support emergency managers and responders during disasters.

---

## Technical Architecture Overview

ResQNet AI utilizes a decoupled reactive architecture:
- **Frontend**: React 18, TypeScript, Zustand state management, Tailwind CSS, Leaflet.js maps, and Framer Motion micro-interactions.
- **Backend**: FastAPI (Python), WebSockets, and asynchronous task workers.
- **AI Engine**: Graph-based Multi-Agent Orchestrator interfacing with LM Studio (local Gemma-4 model) or cloud OpenAI-compatible APIs with automatic circuit breaker fallbacks.
- **Database**: MongoDB Atlas with geospatial `2dsphere` indexes for proximity routing.

---

## Tech Stack Requirements

- **Python** 3.10+
- **Node.js** 18+ & **npm**
- **MongoDB** (Local instance or MongoDB Atlas Connection URI)
- **LM Studio** (configured with the `google/gemma-4-e4b` model)

---

## Local Setup Instructions

### 1. Backend Service Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create a virtual environment and activate it:
   ```bash
   python -m venv venv
   # On Windows (PowerShell)
   .\venv\Scripts\Activate.ps1
   # On macOS/Linux
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure your environment variables. Copy `.env.example` to `.env` and fill in your custom values:
   ```bash
   cp .env.example .env
   ```
5. Seed the database with 300+ mock incidents, resources, shelters, and stations:
   ```bash
   python seed.py
   ```
6. Run the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

### 2. Frontend Application Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install npm packages:
   ```bash
   npm install
   ```
3. Launch the Vite dev server:
   ```bash
   npm run dev
   ```
4. Access the EOC UI by opening [http://localhost:5173](http://localhost:5173) in your browser.

---

## Running in Docker

To build and run all services (MongoDB, Backend API, and React Frontend) together:

```bash
docker-compose up --build
```
- Frontend will be accessible at `http://localhost:5173`
- Backend API will run on `http://localhost:8000`

