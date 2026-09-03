# Enterprise CRM System

A modern, scalable, and secure Customer Relationship Management (CRM) system built with the MERN stack (MongoDB, Express, React, Node.js). This CRM is designed to handle multiple user roles (Admin, Employee, Vendor) with granular Role-Based Access Control (RBAC) and dynamic user interfaces.

## 🚀 Features

- **Role-Based Access Control (RBAC):** Dynamic sidebars, protected routes, and API endpoints tailored for Admins, Employees, and Vendors.
- **Granular Permissions:** Specific access rights based on employee departments, designations, and custom permissions.
- **Dynamic Dashboards:** Personalized dashboard views displaying real-time statistics, revenue charts, and recent activities.
- **Secure Authentication:** JWT-based authentication with HttpOnly cookies for refresh tokens to prevent XSS and CSRF attacks.
- **Modern UI/UX:** Built with React, TailwindCSS, and Lucide Icons for a clean, responsive, and beautiful interface.
- **Security First:** Backend hardened with Helmet, Rate Limiting, HTTP Parameter Pollution protection, and NoSQL injection sanitization.

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 19 + Vite
- **Routing:** React Router DOM (v7)
- **Styling:** Tailwind CSS (v4)
- **Icons:** Lucide React
- **State/Auth Management:** Context API & js-cookie
- **HTTP Client:** Axios
- **Notifications:** React Hot Toast

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB (Mongoose)
- **Authentication:** JWT (JSON Web Tokens), bcryptjs
- **Security:** Helmet, express-rate-limit, cors, express-mongo-sanitize

## 📂 Project Structure

The repository is divided into two main directories:

- `/frontend` - Contains the React Vite application.
- `/Backend` - Contains the Node.js/Express server and MongoDB models.

## ⚙️ Local Development Setup

Follow these instructions to run the project locally.

### Prerequisites
- Node.js (v18+ recommended)
- MongoDB (Local instance or MongoDB Atlas cluster)

### 1. Backend Setup
Navigate to the Backend directory:
```bash
cd Backend
```
Install dependencies:
```bash
npm install
```
Create a `.env` file in the `Backend` directory (refer to the environment variables section below).

Start the development server:
```bash
npm run dev
# or
nodemon server.js
```

### 2. Frontend Setup
Navigate to the frontend directory:
```bash
cd frontend
```
Install dependencies:
```bash
npm install
```
Create a `.env` file in the `frontend` directory:
```env
VITE_API_URL=http://localhost:5000/api/v1/
```
Start the Vite development server:
```bash
npm run dev
```

## 🔐 Environment Variables

### Backend (`Backend/.env`)
```env
PORT=5000
NODE_ENV=development
MONGOURL=mongodb+srv://<user>:<password>@cluster.mongodb.net/
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# JWT Configuration
JWT_ACCESS_SECRET=your_access_secret_key
JWT_REFRESH_SECRET=your_refresh_secret_key
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d

# Initial Admin Creation Secret
ADMIN_CREATION_SECRET=your_admin_secret
```

### Frontend (`frontend/.env`)
```env
VITE_API_URL=http://localhost:5000/api/v1/
```

## 🤝 Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.
