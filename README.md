# 🎓 College Management System — SaaS Multi-Tenant Platform

A scalable, secure, enterprise-grade SaaS College Management System with multi-tenant architecture, subscription billing, Cloudinary file handling, and real-time chat.

---

## 🧱 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Node.js + Express.js |
| **Database** | MongoDB + Mongoose |
| **Auth** | JWT (Access + Refresh Tokens) |
| **File Storage** | Cloudinary |
| **Payments** | Stripe |
| **Real-time** | Socket.io |
| **Mobile App** | React Native CLI + TypeScript |
| **State Management** | Redux Toolkit + RTK Query |
| **UI** | React Native Paper |

---

## 🏢 Architecture

```
Super Admin (Platform Owner)
   ↓
Multiple Colleges (Tenants)  ← Isolated via collegeId
   ↓
College Admin
   ↓
Departments → Classes → Students & Teachers
```

---

## 👑 Roles

| Role | Capabilities |
|------|-------------|
| `SUPER_ADMIN` | Manage entire platform, all colleges, analytics |
| `COLLEGE_ADMIN` | Manage one college, teachers, students |
| `TEACHER` | Attendance, exams, results, chat |
| `STUDENT` | View attendance, results, notices, chat |

---

## 💳 Subscription Plans

| Plan | Students | Teachers | Storage | Features |
|------|----------|----------|---------|---------|
| FREE | 50 | 5 | 1 GB | Attendance, Notices |
| BASIC | 200 | 20 | 5 GB | + Exams, Results |
| PRO | 1,000 | 100 | 20 GB | + Chat, Syllabus |
| ENTERPRISE | Unlimited | Unlimited | 100 GB | All Features |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB 7.0
- React Native development environment

---

### Backend Setup

```bash
cd backend
cp .env.example .env
# Fill in your environment variables
npm install
npm run seed      # Seed super admin + 2 colleges
npm run dev       # Development with hot reload
```

### Frontend Setup

```bash
cd frontend
cp .env.example .env
# Fill in API_BASE_URL
npm install
# iOS
npx pod-install ios
npm run ios
# Android
npm run android
```

---

### Docker Setup

```bash
# Copy and configure env
cp backend/.env.example backend/.env
# Edit backend/.env with your values

# Start everything
docker-compose up -d

# Seed data
docker-compose exec backend npm run seed
```

---

## 📁 Project Structure

```
authai/
├── backend/                    # Node.js + Express API
│   ├── server.js               # Entry point
│   ├── socket/                 # Socket.io handlers
│   ├── scripts/seed.js         # Database seeder
│   └── src/
│       ├── config/             # DB, Cloudinary, Stripe config
│       ├── controllers/        # Request handlers
│       ├── middleware/         # Auth, RBAC, tenant isolation
│       ├── models/             # Mongoose models (all with collegeId)
│       ├── repositories/       # Data access layer
│       ├── routes/             # API routes
│       ├── services/           # Business logic
│       ├── utils/              # Helpers, logger, response
│       └── validators/         # Joi validators
│
└── frontend/                   # React Native CLI app
    ├── App.tsx                 # Root component
    └── src/
        ├── components/         # Reusable UI components
        ├── hooks/              # Custom hooks
        ├── navigation/         # React Navigation
        ├── screens/            # All screens by role
        ├── services/           # API + Socket service
        ├── store/              # Redux + RTK Query
        ├── theme/              # Colors, typography, spacing
        ├── types/              # TypeScript interfaces
        └── utils/              # Constants, helpers, storage
```

---

## 🔐 API Authentication

All protected routes require:
```
Authorization: Bearer <access_token>
```

Token refresh:
```
POST /api/v1/auth/refresh-token
Body: { refreshToken: "..." }
```

---

## 🌐 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register-college` | Register new college (creates tenant) |
| POST | `/api/v1/auth/login` | Login (all roles) |
| POST | `/api/v1/auth/refresh-token` | Refresh access token |
| POST | `/api/v1/auth/logout` | Logout |
| POST | `/api/v1/auth/forgot-password` | Send reset OTP |
| POST | `/api/v1/auth/reset-password` | Reset password |

### Colleges (Super Admin)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/colleges` | List all colleges |
| GET | `/api/v1/colleges/:id` | Get college details |
| PUT | `/api/v1/colleges/:id` | Update college |
| DELETE | `/api/v1/colleges/:id` | Delete college |
| GET | `/api/v1/colleges/:id/stats` | College statistics |

### Students
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/students` | List students (paginated, filterable) |
| POST | `/api/v1/students` | Create student |
| GET | `/api/v1/students/:id` | Get student |
| PUT | `/api/v1/students/:id` | Update student |
| DELETE | `/api/v1/students/:id` | Delete student |
| GET | `/api/v1/students/:id/attendance` | Attendance summary |
| GET | `/api/v1/students/:id/results` | All results |

### Attendance
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/attendance/bulk` | Mark bulk attendance for class |
| GET | `/api/v1/attendance/class/:classId` | Get by class + date |
| GET | `/api/v1/attendance/student/:studentId/summary` | Attendance % |

### Subscriptions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/subscriptions/plans` | Get all plans |
| GET | `/api/v1/subscriptions/current` | Current subscription |
| POST | `/api/v1/subscriptions/checkout` | Create Stripe session |
| POST | `/api/v1/subscriptions/webhook` | Stripe webhook |
| PUT | `/api/v1/subscriptions/upgrade` | Upgrade plan |
| PUT | `/api/v1/subscriptions/cancel` | Cancel subscription |

---

## 🧪 Running Tests

```bash
cd backend
npm test                    # Run all tests
npm test -- --coverage      # With coverage report
```

---

## 🌱 Seed Data

After running `npm run seed` you get:

| Account | Email | Password | Role |
|---------|-------|----------|------|
| Super Admin | superadmin@platform.com | SuperAdmin@123 | SUPER_ADMIN |
| College A Admin | admin@alphauniversity.edu | Admin@123 | COLLEGE_ADMIN |
| College B Admin | admin@betacollege.edu | Admin@123 | COLLEGE_ADMIN |
| Teacher (College A) | teacher1@alphauniversity.edu | Teacher@123 | TEACHER |
| Student (College A) | student1@alphauniversity.edu | Student@123 | STUDENT |

---

## 📊 Multi-Tenant Security

Every database query is scoped by `collegeId`:
- All models include a `collegeId` field (required, indexed)
- `tenantIsolation` middleware enforces this on every request
- SUPER_ADMIN can query any college by providing `?collegeId=...`
- Cross-tenant data access is blocked at middleware level

---

## ☁️ Cloudinary Structure

```
college-management/
  colleges/{collegeId}/
    students/          ← Profile photos
    teachers/          ← Profile photos
    chat/              ← Media messages
    syllabus/          ← PDF uploads
    notices/           ← Attachments
```

---

## 🔄 Real-time Chat (Socket.io)

Events:
- `join-room` → Join a chat room
- `send-message` → Send a message
- `new-message` → Receive a message
- `typing` → Typing indicator
- `read-receipt` → Message read

---

## 📦 Environment Variables

See `backend/.env.example` and `frontend/.env.example` for all required variables.

---

## 🤝 Contributing

1. Create feature branch from `main`
2. Make changes
3. Write/update tests
4. Submit PR

---

## 📄 License

MIT License — © 2024 College Management Platform
