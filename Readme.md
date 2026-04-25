# AgriMarket 🌱

AgriMarket is a modern, real-time web application built to connect farmers directly with buyers. It serves as an agricultural marketplace where farmers can list their produce, analyze market demand, and buyers can easily find and purchase products, specifically prioritizing local options through location-based searching.

## ✨ Features

### 👨‍🌾 For Farmers
- **Dashboard**: A centralized place to manage operations.
- **Product Management**: Add, update, and manage agricultural products with images.
- **Market Analytics**: "Analyze Market" tool tracking buyer search queries to calculate product popularity. Rank products based on search frequency to make data-driven pricing decisions.
- **Real-time Notifications**: Receive instant notifications when a buyer makes a purchase (powered by Socket.io).

### 🛒 For Buyers
- **Product Discovery**: Browse an extensive catalog of fresh agricultural produce.
- **"Near Me" Priority**: Location-based product prioritization using geocoding and the Haversine formula to surface local produce based on the user's registered address.
- **Shopping Cart**: Fully functional cart system.
- **Search & Filtering**: Search for specific products, which feeds into the farmer's market demand analytics.

### 🔐 Core System
- **Authentication**: Secure JWT-based authentication with bcrypt password hashing.
- **Role-Based Access Control**: Distinct experiences for `Farmer` and `Buyer` accounts.
- **Real-Time Communication**: WebSocket integration for instant system updates.

## 🛠️ Tech Stack

- **Frontend**: EJS (Embedded JavaScript templates), HTML, CSS, Vanilla JavaScript
- **Backend**: Node.js, Express.js
- **Database**: MongoDB (Mongoose Object Data Modeling)
- **Real-Time**: Socket.io
- **Authentication**: JSON Web Tokens (JWT), bcryptjs
- **File Uploads**: Multer (for product images)
- **Geocoding**: Custom utilities utilizing the Haversine formula for proximity calculations

## 📁 Project Structure

```text
agri-market/
├── public/               # Static assets (CSS, client-side JS, uploaded images)
├── src/
│   ├── config/           # Database and environment configurations
│   ├── controllers/      # Route controllers containing business logic
│   ├── middleware/       # Express middlewares (Auth, Role checks)
│   ├── models/           # Mongoose schemas (User, Product, Cart, Notification)
│   ├── routes/           # Express route definitions
│   └── utils/            # Utility functions (Geocoding logic)
├── views/                # EJS templates
│   ├── pages/            # Main application pages (Dashboard, Market, Cart, etc.)
│   └── partials/         # Reusable UI components (header, footer)
├── .env                  # Environment variables (Create this file)
├── server.js             # Application entry point
└── package.json          # Project dependencies and scripts
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18.0.0 or higher)
- MongoDB instance (local or Atlas)

### Installation

1. Clone the repository and navigate into the folder:
   ```bash
   cd agri-market
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Environment Variables

Create a `.env` file in the root directory and configure the essential environment variables. Here is an example of what it should look like:

```env
PORT=3000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
```

### Running the Application

**Development Mode (with auto-reload):**
```bash
npm run dev
```

**Production Mode:**
```bash
npm start
```

The application will be running at `http://localhost:3000`.

## 🌐 Deployment

This application is configured and ready to be deployed to platforms like **Vercel** or **Railway**. When deploying, ensure that your environment variables (like `MONGODB_URI` and `JWT_SECRET`) are properly configured in the hosting provider's dashboard.
