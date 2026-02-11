# Upskill MVP

A MERN (MongoDB, Express, React, Node.js) stack application for an online skill-learning platform with a recommendation engine.

## 🎯 Overview

Upskill is an MVP platform designed around 4 core features:

1. **🛠️ Catalog** - Content library and learning resources
2. **👤 User Progress** - Track user activity and learning history
3. **🧠 Recommendation Engine** - Personalized next-step suggestions
4. **🧪 Simulator** - Demo and testing the recommendation engine

## 📁 Project Structure

```
MVP/
├── client/
│   ├── src/
│   │   ├── components/        # Reusable React components
│   │   ├── pages/             # Page components
│   │   ├── services/          # API service calls
│   │   ├── utils/             # Utility functions
│   │   ├── App.jsx            # Main App component
│   │   └── main.jsx           # React entry point
│   ├── index.html             # HTML template
│   ├── vite.config.js         # Vite configuration
│   ├── package.json           # Client dependencies
│   └── .env.example           # Example env variables
├── server/
│   ├── src/
│   │   ├── config/            # Configuration files (db.js)
│   │   ├── controllers/       # Route handlers
│   │   ├── data/              # Mock data (mockCatalog.json)
│   │   ├── models/            # Data models
│   │   ├── routes/            # API route definitions
│   │   ├── services/          # Business logic
│   │   ├── app.js             # Express app setup
│   │   └── server.js          # Server entry point
│   ├── package.json           # Server dependencies
│   └── .env.example           # Example env variables
├── .gitignore                 # Git ignore rules
└── README.md                  # This file
```

## 🚀 Features & API Endpoints

### 1. 🛠️ Catalog (Content Library)

- **Route File:** `server/src/routes/catalog.routes.js`
- **API:** `GET /api/catalog`
- **Purpose:** Serves learning resources and course catalog
- **Frontend:** `client/src/components/` (PathView, etc.)

### 2. 👤 User Progress (Memory)

- **Route File:** `server/src/routes/user.routes.js`
- **API:** `GET /api/user`
- **Purpose:** Manages user profiles and activity tracking
- **Frontend:** `client/src/components/` (StatTiles, etc.)

### 3. 🧠 Recommendation Engine (Brain)

- **Service File:** `server/src/services/engine.service.js`
- **API:** `GET /api/engine`
- **Purpose:** Generates personalized learning recommendations
- **Frontend:** `client/src/components/` (NextAssetCard, etc.)

### 4. 🧪 Simulator (Demo Engine)

- **Route File:** `server/src/routes/engine.routes.js`
- **API:** `POST /api/engine/simulate`
- **Purpose:** Tests recommendation logic
- **Frontend:** `client/src/pages/` (Simulate.jsx)

## 📊 Feature Breakdown

| Feature      | Backend             | Frontend   | Purpose         |
| ------------ | ------------------- | ---------- | --------------- |
| 🛠️ Catalog   | `catalog.routes.js` | Components | Content library |
| 👤 User      | `user.routes.js`    | Components | User tracking   |
| 🧠 Engine    | `engine.service.js` | Components | Recommendations |
| 🧪 Simulator | `engine.routes.js`  | Pages      | Demo/testing    |

## 📦 Mock Data

Sample catalog data in `server/src/data/mockCatalog.json`:

```json
[{ "id": "1", "name": "Intro to Python", "type": "video" }]
```

## 🔐 Environment Variables

Create `.env` files:

**server/.env:**

```
PORT=5000
NODE_ENV=development
```

**client/.env:**

```
VITE_API_URL=http://localhost:5000
```

## 📋 API Reference

### Catalog

```
GET /api/catalog
```

Returns: Array of learning resources

### User

```
GET /api/user
```

Returns: User profile and activity data

### Engine

```
GET /api/engine
```

Returns: Personalized recommendations

## 🏗️ Architecture Philosophy

- **Feature-based modular design** - Each feature has clear backend/frontend separation
- **Service-oriented backend** - Business logic in services, routes handle HTTP
- **Scalable structure** - Easy to add new features without touching existing code
- **API-first approach** - Frontend directly maps to API responsibilities
