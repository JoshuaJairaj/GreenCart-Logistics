# GreenCart Logistics Management System

GreenCart Logistics is a **full-stack** delivery management and simulation platform built to manage drivers, orders, routes, and optimize delivery efficiency with an advanced simulation engine.

This repository contains **both the backend (Node.js + Express + MongoDB)** and **frontend (React + Vite + Tailwind)** in separate folders.

---

## 📌 Features

### Frontend
- Modern **React.js** UI using Tailwind CSS
- Fully responsive design (mobile + desktop)
- Secure **JWT-based Authentication**
- **Dashboard** with charts & KPIs
- CRUD Management for:
  - Drivers 👨‍✈️
  - Delivery Routes 🗺️
  - Orders 📦
- Pagination, Search, & Filters
- **Simulation UI** with real-time results visualization

### Backend
- RESTful API with **Node.js** & Express
- MongoDB database with Mongoose models
- JWT authentication & role-based access
- Data validation with **express-validator**
- Pass/Fail Simulation Engine with:
  - Driver fatigue management
  - Fuel cost calculation
  - Penalty & bonus calculation
- Seed/sample data loader

---

## 🛠 Tech Stack

**Frontend:**
- React 18
- Vite
- Tailwind CSS
- Chart.js + react-chartjs-2
- React Hot Toast

**Backend:**
- Node.js
- Express.js
- MongoDB + Mongoose
- JWT Auth + bcryptjs
- express-validator
- Helmet & CORS

---

## 📂 Project Structure

greencart-logistics/
│
├── backend/ # Node.js Backend API
│ ├── src/
│ │ ├── controllers/
│ │ ├── middleware/
│ │ ├── models/
│ │ ├── routes/
│ │ ├── utils/
│ │ └── app.js
│ ├── package.json
│ └── .env.example
│
├── frontend/ # React Frontend (Vite)
│ ├── src/
│ │ ├── components/
│ │ ├── contexts/
│ │ ├── pages/
│ │ ├── services/
│ │ ├── App.jsx
│ │ └── main.jsx
│ ├── package.json
│ └── .env.example
│
├── README.md
└── .gitignore

text

---

## ⚙ Installation & Setup

### **1️⃣ Clone the Repository**
git clone https://github.com/<your-username>/greencart-logistics.git
cd greencart-logistics

text

### **2️⃣ Backend Setup**
cd backend
npm install
cp .env.example .env

text

**Edit `.env` file** with your actual MongoDB URI and JWT secret:
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/greencart
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d
BCRYPT_ROUNDS=12
CORS_ORIGIN=http://localhost:3000

text

**Start Backend:**
npm run dev # development
npm start # production

text

**(Optional) Load Sample Data**
npm run load-data

text

### **3️⃣ Frontend Setup**
cd ../frontend
npm install
cp .env.example .env

text

**Edit `.env` file:**
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=GreenCart Logistics
VITE_APP_VERSION=1.0.0

text

**Start Frontend:**
npm run dev

text

---

## 🔑 Default Login Credentials (after `npm run load-data`)
**Admin:**
Username: admin
Password: admin123

text
**Manager:**
Username: manager
Password: manager123

text

---

## 📡 API Routes

### Auth
- POST `/api/auth/register`
- POST `/api/auth/login`
- GET `/api/auth/profile`

### Drivers
- GET `/api/drivers`
- POST `/api/drivers`
- PUT `/api/drivers/:id`
- DELETE `/api/drivers/:id`

### Routes
- GET `/api/routes`
- POST `/api/routes`
- PUT `/api/routes/:id`
- DELETE `/api/routes/:id`

### Orders
- GET `/api/orders`
- POST `/api/orders`
- PUT `/api/orders/:id`
- DELETE `/api/orders/:id`

### Simulation
- POST `/api/simulation/run`
- GET `/api/simulation/history`
- GET `/api/simulation/:id`

---

## 🖥 Development Commands

**Backend**
npm run dev # Start dev server
npm start # Start production server
npm run load-data # Seed DB with sample data

text

**Frontend**
npm run dev # Start Vite dev server
npm run build # Build for production
npm run preview # Preview production build

text

---

## 🚀 Deployment

1. **Backend** → Deploy to Render / Railway / Heroku  
   Add backend `.env` variables on hosting panel.  
2. **Frontend** → Deploy to Vercel / Netlify  
   Add `VITE_API_URL` in env config pointing to backend URL.

---

## 🛡 Security
- All **credentials** must be kept in `.env` (never commit to GitHub)
- `.gitignore` already excludes `.env` files

---

## 🤝 Contributing
1. Fork the repository
2. Create a feature branch  
git checkout -b feature-name

text
3. Commit changes  
git commit -m "feat: Description of changes"

text
4. Push branch  
git push origin feature-name
