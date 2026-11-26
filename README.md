# Smart Pantry AI

🚀 **Live Demo:** [Smart Pantry AI](https://smart-pantry1.netlify.app/)

Smart Pantry AI is a modern SaaS web application for tracking pantry, refrigerator, and storage inventory using computer vision. By comparing baseline restock snapshots with follow-up scans, the app calculates item consumption rates, projects run-out dates, and compiles an auto-updating smart shopping list.

---

## Key Features

- **Universal AI Vision Scanning**: Powered by Google Gemini 2.5 Flash with a top-to-bottom, left-to-right spatial sweep prompt, structured JSON schema enforcement, and resilient JSON recovery—working across refrigerators, pantries, shelves, and countertops.
- **Smart Item Deduplication & Product Categories**: Automatically consolidates singular/plural duplicates (e.g., `Egg` + `Eggs` → `Eggs`) while preserving distinct product variants (`Diet Coke` ≠ `Coca-Cola`, `Whole Milk` ≠ `Milk`), and classifies items into categories (`Produce`, `Dairy`, `Snacks & Nuts`, `Beverages`, `Grains & Pantry`, `Frozen`, `Condiments`, `Other`).
- **Paired Restock Cycles & Scan History Viewer**: Groups each Baseline Restock with its Follow-up scans into unified cycles, storing lightweight JPEG preview thumbnails in Firestore and displaying side-by-side cycle comparisons with zoomable photos and whole-pair deletion.
- **Consumption & Depletion Analytics**:
  - `daily_rate = consumed / days_between_scans`
  - `days_left = current_quantity / daily_rate`
  - Classifies stock as **Healthy**, **Low** (≤ 3 days), or **Critical** (≤ 1 day or out of stock).
- **Smart Shopping List & Export**: Automatically queues Low/Critical items, supports custom items, and provides **Copy List** (clipboard) and **Export CSV** actions.
- **Authentication & Signup Validation**: Supports Firebase Email/Password and Google Sign-In, with email trimming/regex validation, an 8+ character password complexity checklist (uppercase, lowercase, number/symbol), live password strength & match indicators, and friendly Firebase error mapping.
- **Responsive Tactile UI & Themes**: MODEL 01 tactile hardware interface with Light/Dark theme support, desktop table + mobile card inventory views, `/favicon` icon assets, and Netlify SPA routing (`_redirects`).
- **Demo & Fallback Support**: Automatically falls back to `localStorage` if Firebase credentials aren't configured, and simulated vision analysis if `GEMINI_API_KEY` is omitted.

---

## Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, Framer Motion, React Router, Lucide Icons
- **Backend**: Node.js, Express, Multer, Google Generative AI SDK (`@google/generative-ai`), Firebase Admin SDK
- **Database & Auth**: Firebase Firestore & Firebase Authentication

---

## Project Structure

```text
backend/
├── package.json
├── src/
│   ├── app.js                   # Express app wiring & middleware
│   ├── server.js                # HTTP server startup (`npm start` / `npm run dev`)
│   ├── config/                  # Env, Firebase Admin, & Gemini Vision config
│   ├── controllers/             # HTTP request/response handlers
│   ├── middlewares/             # Multer in-memory upload middleware
│   ├── routes/                  # Express /api route definitions
│   ├── services/                # Gemini Vision, consumption engine, Firestore persistence
│   └── utils/                   # JSON recovery parser & item normalizer
└── tests/                       # Isolated unit tests (`npm test`) & manual diagnostic scripts

frontend/
├── public/
│   ├── _redirects               # Netlify SPA fallback routing
│   └── favicon/                 # Site icons (favicon.ico, favicon.svg, 180px & 512px PNGs)
└── src/
    ├── components/              # Reusable UI components & modals (InventoryTable, ScanDetailModal, etc.)
    ├── context/                 # AuthContext
    ├── firebase.js              # Firebase client SDK initialization & Google provider
    ├── pages/                   # Route views (LandingPage, Login, Register, Dashboard, ScanUpload, ShoppingList, Insights)
    └── utils/                   # 1920px image compression, thumbnail generator & item normalizer
```

---

## Getting Started

### 1. Environment Configuration

#### Backend (`backend/.env`)
```env
PORT=5000
GEMINI_API_KEY=your_gemini_api_key_here

# Firebase Admin / Firestore configuration
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id_here
FIREBASE_SERVICE_ACCOUNT=        # Optional inline JSON string for Firebase service account
FIREBASE_SERVICE_ACCOUNT_PATH=   # Optional path to Firebase service account JSON file
```

#### Frontend (`frontend/.env`)
```env
VITE_FIREBASE_API_KEY=your_firebase_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain_here
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id_here
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket_here
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id_here
VITE_FIREBASE_APP_ID=your_firebase_app_id_here

VITE_API_URL=http://localhost:5000/api
```

### 2. Run Locally

#### Start Backend
```bash
cd backend
npm install
npm run dev
```
Runs at `http://localhost:5000`.

#### Start Frontend
```bash
cd frontend
npm install
npm run dev
```
Runs at `http://localhost:5173`.

### 3. Run Tests, Lint & Builds
```bash
# Backend unit tests
cd backend && npm test

# Frontend lint & production build
cd frontend && npm run lint
cd frontend && npm run build
```

---

## API Endpoints

- `GET /api/health` — Health check & Gemini availability status
- `POST /api/scan` — Upload pantry image + optional thumbnail, run Gemini Vision, save scan & update predictions
- `PUT /api/scans/:id` — Update items in an existing scan and recalculate predictions
- `DELETE /api/scans/:id` — Delete a scan and resynchronize inventory & predictions
- `POST /api/scans/delete-batch` — Atomically delete a whole scan cycle/pair and resynchronize state
- `POST /api/compare` — Compare a baseline scan against a follow-up scan
- `GET /api/predictions` — Fetch latest depletion predictions for a user
- `GET /api/shopping-list` — Fetch latest shopping list for a user
