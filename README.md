# Upskill MVP

A MERN (MongoDB, Express, React, Node.js) stack application for an online skill-learning platform with an adaptive recommendation engine that personalizes learning paths in real-time.

## 🎯 Overview

Upskill is an MVP platform designed around 4 core features:

1. **🛠️ Catalog** - Content library (assets, courses, topics, levels)
2. **👤 User Progress** - Track learner activity and course enrollments
3. **🧠 Adaptive Engine** - Resequence learning paths based on performance
4. **🧪 Quiz System** - Attempt tracking and score-based format switching

## 📁 Project Structure

```
MVP/
├── client/
│   ├── src/
│   │   ├── components/        # Reusable React components (SidebarLayout, etc.)
│   │   ├── pages/             # Page components (Dashboard, Path, Quiz, Asset)
│   │   ├── services/          # API service calls (api.js)
│   │   ├── utils/             # Utility functions (formatTitle, activeUser, etc.)
│   │   ├── App.jsx            # Main App component
│   │   └── main.jsx           # React entry point
│   ├── index.html             # HTML template
│   ├── vite.config.js         # Vite configuration
│   ├── package.json           # Client dependencies
│   └── .env.example           # Example env variables
├── server/
│   ├── src/
│   │   ├── config/            # Configuration files (db.js)
│   │   ├── controllers/       # Route handlers (catalog, user, engine)
│   │   ├── data/              # Seed data (JSON files for seeding)
│   │   ├── models/            # MongoDB data models (User, Course, Asset, Path, Attempt, etc.)
│   │   ├── routes/            # API route definitions (catalog, user, engine)
│   │   ├── services/          # Business logic (engine resequencing, quiz scoring)
│   │   ├── app.js             # Express app setup
│   │   └── server.js          # Server entry point
│   ├── seed.js                # MongoDB seed script
│   ├── package.json           # Server dependencies
│   └── .env.example           # Example env variables
├── .gitignore                 # Git ignore rules
└── README.md                  # This file
```

## 🚀 Running Locally

### Prerequisites

- Node.js 16+
- MongoDB running locally or Atlas connection string

### Installation & Setup

**1. Install dependencies:**

```bash
# Server
cd server
npm install

# Client
cd ../client
npm install
```

**2. Configure environment variables:**

**server/.env:**

```
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/upskill
```

**client/.env:**

```
VITE_API_URL=http://localhost:5000
```

**3. Seed database (one-time):**

```bash
cd server
npm run seed
```

**4. Start the application:**

**Terminal 1 (Server):**

```bash
cd server
npm start
```

**Terminal 2 (Client):**

```bash
cd client
npm run dev
```

Server runs on `http://localhost:5000`  
Client runs on `http://localhost:5173`

## 📊 Data Models

| Model          | Purpose            | Key Fields                                                            |
| -------------- | ------------------ | --------------------------------------------------------------------- |
| **User**       | Learner profile    | userId, name, role, email                                             |
| **Course**     | Learning program   | courseId, title, moduleAssetIds, level                                |
| **Asset**      | Content item       | assetId, title, format (video/doc/lab), level, expectedTimeMin        |
| **Path**       | Learner's sequence | userId, courseId, nodes (assetId + status), currentIndex, nextAssetId |
| **Attempt**    | Quiz/format result | assetId, userId, score, timeSpentSec, format, status (pass/fail)      |
| **Enrollment** | User-Course link   | userId, courseId, status (active/paused)                              |
| **Question**   | Quiz questions     | questionId, topic, difficulty, options, correctAnswer                 |

## 🧠 Adaptive Logic (Resequencing Rules)

The engine automatically adjusts learning paths based on attempt results:

| Scenario                 | Action                                              |
| ------------------------ | --------------------------------------------------- |
| **Fail Video**           | Switch to Doc format at same level                  |
| **Fail Doc**             | Drop one level (Advanced → Intermediate → Beginner) |
| **Pass**                 | Advance to next asset in sequence                   |
| **Incomplete (timeout)** | Retry same asset                                    |

**Signals used:**

- `score` - Quiz performance (pass threshold: 70%)
- `format` - Content type (video, doc, lab)
- `level` - Difficulty tier (beginner, intermediate, advanced)
- `timeSpentSec` - Duration (compared to expectedTimeMin)
- `attemptNo` - Number of tries

## 📋 Current API Routes

### Catalog Routes (`/api/catalog`)

| Method  | Endpoint                         | Purpose                               |
| ------- | -------------------------------- | ------------------------------------- |
| **GET** | `/api/catalog/assets`            | List all assets                       |
| **GET** | `/api/catalog/courses`           | List all courses                      |
| **GET** | `/api/catalog/assets/:assetId`   | Get single asset                      |
| **GET** | `/api/catalog/courses/:courseId` | Get single course with moduleAssetIds |

### User Routes (`/api/user`)

| Method   | Endpoint                             | Purpose                                                |
| -------- | ------------------------------------ | ------------------------------------------------------ |
| **GET**  | `/api/user/all`                      | List all users                                         |
| **GET**  | `/api/user/:userId/dashboard`        | Get user dashboard (active course + path + next asset) |
| **GET**  | `/api/user/:userId/enrollments`      | List user's enrollments                                |
| **POST** | `/api/user/:userId/enroll/:courseId` | Enroll user in course (activates + pauses others)      |

### Engine Routes (`/api/engine`)

| Method   | Endpoint                          | Purpose                                  |
| -------- | --------------------------------- | ---------------------------------------- |
| **GET**  | `/api/engine/:userId/quiz`        | Get quiz for user (topic-based attempts) |
| **POST** | `/api/engine/:userId/quiz/submit` | Submit attempt + trigger resequencing    |

## 🔑 Key Features

### ✅ Dynamic Path Resequencing

- Real-time adaptation based on performance
- Format switching (video ↔ doc) on fail
- Level dropping on repeated failures
- Transparent engine decision logging

### ✅ Multi-User Support

- localStorage-based user switching (dev/testing)
- Separate paths per user per course
- Enrollment management (active/paused)

### ✅ Asset Title Formatting

- Removes course prefix from titles (e.g., "Git: Version Control Basics" → "Version Control Basics")
- Cleans up "(Corporate Track)" tags
- Collapses extra whitespace

### ✅ Quiz & Scoring System

- Attempts tracked per asset + format
- Pass/fail determination (70% threshold)
- Time spent vs. expected time comparison
- Deferred "needs_review" status for borderline scores

## 🌐 Frontend Pages

- **Dashboard** (`/`) - Active course overview, recent activity
- **My Path** (`/path`) - NOW/NEXT/Upcoming/Review/Completed lanes
- **Courses** (`/courses`) - Browse available courses
- **Asset** (`/asset/:assetId`) - View content + timer + complete asset
- **Quiz** (`/quiz`) - Take assessments + submit attempts

## 🔐 Environment Variables

**server/.env:**

```
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/upskill
```

**client/.env:**

```
VITE_API_URL=http://localhost:5000
```

## 🏗️ Architecture Philosophy

- **Feature-based modular design** - Each domain (catalog, user, engine) has clear routes/controllers/services
- **Service-oriented backend** - Business logic in services, routes handle HTTP contracts
- **Real-time adaptation** - Immediate resequencing on attempt submit (no batch jobs)
- **Centralized state management** - localStorage for user context, MongoDB for persistence
- **Composable frontend** - Cards + lanes = flexible learning UI

## 🚀 Deployment

_Coming soon: Docker, vercel/heroku steps_

## 📧 Contact

For questions or feedback, open an issue or contact the team.
