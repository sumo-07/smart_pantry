# Smart Pantry AI - Hackathon Project

Smart Pantry AI is a modern SaaS-style web application designed to track pantry and fridge inventory using computer vision. By comparing snapshots taken immediately after restocking with subsequent snapshots, the app calculates item consumption rates, projects run-out dates, and compiles an auto-updating smart shopping checklist.

## Tech Stack

- **Frontend**: React.js, JavaScript, Vite, Tailwind CSS, Framer Motion, React Router, Lucide Icons.
- **Backend**: Node.js, Express.js, Multer (for image upload handling), Google Gemini Vision SDK.
- **Database**: Firebase Firestore.

---

## Getting Started

### 1. Environment Configurations

Create and populate the environment variables in both `frontend` and `backend` directories.

#### Backend (`backend/.env`)
Create a file at `backend/.env` with:
```env
PORT=5000
GEMINI_API_KEY=your_gemini_api_key_here

# Firebase configuration (shares the same keys as frontend)
VITE_FIREBASE_API_KEY=your_firebase_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain_here
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id_here
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket_here
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id_here
VITE_FIREBASE_APP_ID=your_firebase_app_id_here
```

#### Frontend (`frontend/.env`)
Create a file at `frontend/.env` with:
```env
VITE_FIREBASE_API_KEY=your_firebase_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain_here
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id_here
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket_here
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id_here
VITE_FIREBASE_APP_ID=your_firebase_app_id_here

VITE_API_URL=http://localhost:5000/api
```

---

### 2. How to Run Locally

You can run both frontend and backend in parallel.

#### Start Backend
Open a terminal, navigate to the `backend` directory, and run:
```bash
cd backend
npm run dev
```
The backend server will launch at `http://localhost:5000`.

#### Start Frontend
Open a separate terminal, navigate to the `frontend` directory, and run:
```bash
cd frontend
npm run dev
```
The Vite development server will launch at `http://localhost:5173`.

---

## Key Features & Demo Flow

1. **Self-Contained Local Storage Demo Mode**: If you haven't set up the Firebase Firestore credentials yet, the frontend automatically falls back to standard Local Storage. This allows you to explore the app immediately without database connection errors.
2. **Robust Vision Mock Mode**: If `GEMINI_API_KEY` is not supplied, the backend falls back to simulating a successful computer vision analysis. This allows you to test image uploads and watch how baseline vs subsequent scans interact.
3. **Consumption & Depletion Analytics**: The comparison calculation uses the mathematical formula:
   - `daily_rate = consumed / days_between_scans`
   - `days_left = current_quantity / daily_rate`
   - It marks items as **Healthy**, **Low** (depleting in <= 3 days), or **Critical** (depleting in <= 1 day or out-of-stock).
4. **Smart Checklist**: Low and critical items are automatically pushed to the smart shopping list. You can add custom items or check off items as they are restocked.
