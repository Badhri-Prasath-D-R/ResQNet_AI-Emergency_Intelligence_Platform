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

---

## LM Studio Setup (Local AI Agent)

1. Download and install **LM Studio**.
2. Download model **`google/gemma-4-e4b`**.
3. In LM Studio, click the **Local Server** tab.
4. Set the port to `1234` and click **Start Server**.
5. Set `USE_CLOUD_AI=false` in the backend `.env` file to route agent analysis locally.

---

## Cloud AI Fallback & Toggle

To transition to cloud services (e.g., OpenRouter, OpenAI, or Gemini):
1. Set `USE_CLOUD_AI=true` in `.env`.
2. Populate `CLOUD_AI_BASE_URL`, `CLOUD_AI_API_KEY`, and `CLOUD_AI_MODEL_NAME`.
3. If the cloud API latency spikes or suffers connection disruptions, ResQNet's built-in **Circuit Breaker** automatically falls back to your local LM Studio instance.

---

## Deployment Guidelines

### Frontend to Vercel
1. Set up a new project in the Vercel Dashboard importing the `/frontend` subfolder.
2. Add Vite configuration variables.
3. Set the build command to `npm run build` and output directory to `dist`.

### Backend to Render
1. Create a **Web Service** on Render connected to the repository.
2. Select **Python** runtime and use the root directory `/backend`.
3. Specify Build Command: `pip install -r requirements.txt`.
4. Specify Start Command: `uvicorn app.main:app --host 0.0.0.0 --port 8000`.
5. Populate Environment variables matching `.env`.
