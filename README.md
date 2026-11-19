# EmpMonitor V2 - Employee Monitoring System

A modern, streamlined employee tracking and analytics platform. Built from scratch with a unified React + Vite frontend, lightweight Express/SQLite backend, and background tracking agent.

---

## 📂 Project Structure

```
emp-monitor-main/
├── backend/            # Express.js Server & SQLite Database
│   ├── database.js     # Database models, schemas, and seeding
│   ├── server.js       # REST APIs & Socket.io for realtime logs
│   ├── package.json    # Backend dependencies
│   └── uploads/        # Directory where employee screenshots are stored
│
├── desktop-agent/      # Desktop Tracker App
│   ├── agent.js        # Active window & screenshot logging agent
│   ├── tracker.exe     # Standalone compiled desktop application
│   └── package.json    # Agent dependencies
│
├── public/             # Static assets for React Frontend
├── src/                # React (Vite) Frontend application
│   ├── components/     # Reusable UI components
│   ├── context/        # Global Auth & State context
│   ├── layouts/        # Page layouts (Dashboard Layout)
│   ├── pages/          # Application views (Dashboard, Attendance, etc.)
│   ├── App.jsx         # App configuration & React Router
│   └── main.jsx        # App entry point
│
├── package.json        # Frontend project dependencies
└── vite.config.js      # Vite configuration
```

---

## 🚀 Getting Started

### 1. Run the Backend Server
The backend is powered by Node.js, Express, Socket.io, and SQLite.

```bash
# Navigate to the backend directory
cd backend

# Install dependencies
npm install

# Start the server (runs on http://localhost:5000)
npm start
```

### 2. Run the React Frontend
The frontend dashboard is built with React, Tailwind CSS, Recharts, and Vite.

```bash
# In the root directory of the project, install dependencies
npm install

# Run the Vite development server (runs on http://localhost:5173)
npm run dev
```

### 3. Run the Desktop Agent
The desktop agent runs locally on employee machines. It monitors active window titles and captures desktop screenshots, uploading them back to the server.

```bash
# Navigate to the agent directory
cd desktop-agent

# Install dependencies
npm install

# Start the tracking agent
npm start
```

---

## 🛠 Features

- **Realtime Dashboard**: Live websocket-based attendance and app activity feeds.
- **Visual Analytics**: Interactive Recharts displaying daily productivity score and top application usage.
- **Screenshot Auditing**: Time-stamped screen captures of employee desktops.
- **Attendance & Tasks Tracking**: Easily monitor clock-ins, working hours, and assign tasks.
- **Stealth Background Agent**: The desktop agent runs discreetly with a watchdog supervisor process.

---

## 🔒 Security & Environment Config

- Both components support configuring settings via environment variables/`.env` files.
- The desktop agent reads backend server configurations from `agent_config.json` once initialized.
