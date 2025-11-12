# 🚀 Business Intelligence Dashboard

A full-stack BI Dashboard built with **React**, **TypeScript**, **Node.js**, and **PostgreSQL**. Features real-time analytics, admin controls, and responsive design.

---

## ✨ Features

* **📊 Interactive Dashboard** - KPIs, charts, and data tables
* **🔐 Authentication** - JWT-based login/register
* **📈 Advanced Analytics** - Trends, forecasts, and insights
* **⚙️ Admin Panel** - Data management and scenarios
* **📱 Responsive Design** - Works on all devices
* **🔔 Real-time Updates** - Live data simulation
* **📤 Data Export** - CSV export functionality

---

## 🛠 Tech Stack

**Frontend:** React, TypeScript, Tailwind CSS, Recharts
**Backend:** Node.js, Express, TypeScript, PostgreSQL
**Tools:** Docker, JWT, bcrypt, date-fns

---

## 🚀 Quick Start

### Option 1: Railway Deployment (Recommended for Production)
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/your-template-link)

### Option 2: Local Development (Using Docker)
```bash
# Start all services
docker-compose up --build
```

**Access Points:**
* Frontend: `http://localhost:3000`
* Backend: `http://localhost:8000`
* API Docs: `http://localhost:8000/docs`

---

## 📁 Project Structure
```bash
business-intelligence-dashboard/
├── frontend/ # React TypeScript app
│ ├── src/
│ │ ├── components/ # Reusable components
│ │ ├── pages/ # Page components
│ │ ├── hooks/ # Custom React hooks
│ │ └── ...
│ ├── package.json
│ └── Dockerfile
├── backend/ # Node.js Express API
│ ├── src/
│ │ └── server.ts # Main server file
│ ├── package.json
│ └── Dockerfile
├── docker-compose.yml # Development setup
└── README.md
```
---

## 🔑 Environment Variables (Required)

### Backend Environment Variables
```env
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=devpassword
POSTGRES_DB=dashboard_db
JWT_SECRET=your_jwt_secret_here
NODE_ENV=development
PORT=8000
```

### Frontend Environment Variables
```env
VITE_API_URL=http://localhost:8000
```

## 📝 API Documentation

Once the backend is running, access interactive API documentation at:
**`http://localhost:8000/docs`**

---

## 👨‍💻 Development Commands

### Backend Development
```bash
cd backend
npm install
npm run dev
```

### Frontend Development
```bash
cd frontend
npm install
npm run dev
```

## 🎯 Key Features Demo
* **Register/Login** - Secure authentication system
* **Dashboard** - View KPIs, charts, and filtered data
* **Analytics** - Explore trends and forecasts
* **Admin Panel** - Manage data and scenarios (`Ctrl+Shift+A`)
* **Real-time Updates** - Watch live data changes
* **Export Data** - Download CSV reports

---

## 🔒 Admin Access

Press `Ctrl+Shift+A` anywhere in the app to open the admin panel for data management and scenario testing.

---

## 🚀 Railway Deployment Notes

* Connect your GitHub repository to Railway
* Railway will automatically detect your project structure
* Set up environment variables in Railway dashboard
* Deploy!

---

## 🐛 Troubleshooting

* **Port already in use**: Change ports in `docker-compose.yml`
* **Database connection**: Ensure PostgreSQL is running
* **Build errors**: Run `docker-compose down && docker-compose up --build`

---

## 📄 License

MIT License - feel free to use this project for learning and development.