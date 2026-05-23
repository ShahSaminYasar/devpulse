# DevPulse

A collaborative platform for software teams to report bugs, suggest features, and coordinate resolutions.

**Live URL:** https://ssy-devpulse-server.vercel.app  
**GitHub:** https://github.com/ShahSaminYasar/devpulse  
**Author:** Shah Samin Yasar

---

## Features

- User registration and authentication with JWT
- Role-based access control (contributor, maintainer)
- Create, read, update, and delete issues
- Filter issues by type and status
- Sort issues by newest or oldest
- Secure password hashing with bcrypt
- Modular architecture with TypeScript strict mode

---

## Tech Stack

| Technology         | Usage              |
| ------------------ | ------------------ |
| Node.js (LTS)      | Runtime            |
| TypeScript         | Language           |
| Express.js         | Web framework      |
| PostgreSQL         | Database           |
| pg (native driver) | Raw SQL queries    |
| bcryptjs           | Password hashing   |
| jsonwebtoken       | JWT authentication |
| NeonDB             | Hosted PostgreSQL  |
| Vercel             | Deployment         |

---

## Setup & Installation

### Prerequisites

- Node.js 24.x or higher
- PostgreSQL database (NeonDB recommended)

### Steps

1. Clone the repository

```bash
git clone https://github.com/ShahSaminYasar/devpulse
cd devpulse
```

2. Install dependencies

```bash
npm install
```

3. Create a `.env` file in the root directory

```env
PORT=5000
DB_URI=your_postgresql_connection_string
ACCESS_TOKEN_SECRET=your_jwt_secret
```

4. Start the development server

```bash
npm run dev
```

5. The server will initialize the database tables automatically on startup.

---

## API Endpoints

### Authentication

| Method | Endpoint           | Access | Description           |
| ------ | ------------------ | ------ | --------------------- |
| POST   | `/api/auth/signup` | Public | Register a new user   |
| POST   | `/api/auth/login`  | Public | Login and receive JWT |

### Issues

| Method | Endpoint          | Access          | Description                   |
| ------ | ----------------- | --------------- | ----------------------------- |
| POST   | `/api/issues`     | Authenticated   | Create a new issue            |
| GET    | `/api/issues`     | Public          | Get all issues (with filters) |
| GET    | `/api/issues/:id` | Public          | Get a single issue            |
| PATCH  | `/api/issues/:id` | Authenticated   | Update an issue               |
| DELETE | `/api/issues/:id` | Maintainer only | Delete an issue               |

### Query Parameters for `GET /api/issues`

| Param    | Values                            | Default  |
| -------- | --------------------------------- | -------- |
| `sort`   | `newest`, `oldest`                | `newest` |
| `type`   | `bug`, `feature_request`          | —        |
| `status` | `open`, `in_progress`, `resolved` | —        |

### Authentication Header

```
Authorization: <JWT_TOKEN>
```

---

## Database Schema

### `users`

| Column     | Type         | Notes                                                |
| ---------- | ------------ | ---------------------------------------------------- |
| id         | SERIAL       | Primary key                                          |
| name       | VARCHAR(100) | Required                                             |
| email      | VARCHAR(255) | Required, unique                                     |
| password   | TEXT         | Hashed, never returned                               |
| role       | VARCHAR(20)  | `contributor` or `maintainer`, default `contributor` |
| created_at | TIMESTAMP    | Auto-generated                                       |
| updated_at | TIMESTAMP    | Auto-updated                                         |

### `issues`

| Column      | Type         | Notes                                             |
| ----------- | ------------ | ------------------------------------------------- |
| id          | SERIAL       | Primary key                                       |
| title       | VARCHAR(150) | Required                                          |
| description | TEXT         | Required, min 20 characters                       |
| type        | VARCHAR(20)  | `bug` or `feature_request`                        |
| status      | VARCHAR(20)  | `open`, `in_progress`, `resolved`, default `open` |
| reporter_id | INT          | References users.id                               |
| created_at  | TIMESTAMP    | Auto-generated                                    |
| updated_at  | TIMESTAMP    | Auto-updated                                      |

---

## Project Structure

```
src/
├── config/         # Environment configuration
├── db/             # PostgreSQL pool and DB initialization
├── middleware/     # Auth middleware, global error handler
├── modules/
│   ├── auth/       # Signup and login
│   └── issue/      # Issue CRUD operations
├── types/          # TypeScript interfaces and enums
├── utility/        # sendResponse, AppError, catchDbError
├── app.ts
└── server.ts
```

---

## User Roles & Permissions

| Action                                   | Contributor | Maintainer |
| ---------------------------------------- | ----------- | ---------- |
| Register / Login                         | ✅          | ✅         |
| Create issue                             | ✅          | ✅         |
| View all issues                          | ✅          | ✅         |
| Update own issue (status must be `open`) | ✅          | ✅         |
| Update any issue                         | ❌          | ✅         |
| Delete any issue                         | ❌          | ✅         |
