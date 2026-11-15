# 🐛 BugTrail — Bug Tracking and Resolution System

A full-stack bug tracking and project management application built with the MERN stack (MongoDB, Express.js, React, Node.js). BugTrail provides teams with a professional-grade tool for tracking, managing, and resolving software bugs through their entire lifecycle.

![Tech Stack](https://img.shields.io/badge/React-18.3-61DAFB?logo=react)
![Tech Stack](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js)
![Tech Stack](https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb)
![License](https://img.shields.io/badge/License-MIT-blue)

---

## ✨ Features

### Authentication & Authorization
- JWT-based authentication with persistent sessions
- Four user roles: **Admin**, **Developer**, **Tester**, **Reporter**
- Role-based access control (RBAC) on both frontend and backend
- Secure password hashing with bcrypt
- Protected routes and API endpoints
- Account activation/deactivation by admin
- Rate limiting on auth endpoints

### Project Management
- Create, edit, and view projects
- Archive and restore projects
- Unique project keys (e.g., AF, MOB)
- Assign project leads
- Add/remove project members
- Real-time bug count statistics per project

### Bug Management
- Complete bug reporting: title, description, steps to reproduce, expected/actual results
- Priority levels: Low, Medium, High, Critical
- Severity levels: Minor, Major, Critical, Blocker
- Labels/tags for categorization
- Due date tracking with overdue alerts
- Assign/reassign/unassign bugs to developers
- Comprehensive filtering: status, priority, severity, project, assignee, reporter
- Full-text search by bug ID, title, and description
- Sortable results with pagination

### Bug Lifecycle & Workflow
State machine with validated transitions:
```
open → in_progress → in_review → resolved → closed
                                          ↗
closed → reopened → in_progress          ↗
                  → closed
```
- Server-side transition validation
- Automatic `resolvedAt` and `closedAt` timestamps
- Complete activity audit trail for every transition

### Kanban Board
- Visual drag-and-drop board with 6 columns
- HTML5 drag and drop with visual drop zone feedback
- Valid/invalid transition indication during drag
- Filter by project and assignee
- All moves validated through backend state machine

### Comments & Collaboration
- Add, edit, and delete comments on bugs
- Admin comment moderation
- Author avatars and timestamps
- Real-time comment count

### File Attachments
- Upload screenshots, documents, and reproduction files
- Multer-based file handling with type/size validation
- Download and delete attachments
- Supported types: images, PDFs, documents, spreadsheets, videos, archives

### In-App Notifications
- Real-time notification bell with unread count
- Notifications for: assignments, status changes, comments
- Mark individual or all notifications as read
- Click-through to related bugs

### Dashboard & Analytics
- 8 summary stat cards (total, open, resolved, critical, overdue, etc.)
- 6 interactive charts powered by Recharts:
  - Bugs by Status (pie chart)
  - Bugs by Priority (bar chart)
  - Bugs by Severity (bar chart)
  - Bugs over Time (line chart, 30 days)
  - Bugs by Project (horizontal bar)
  - Active Bugs by Developer (horizontal bar)
- Recent bugs and activity feed
- Project-level filtering

### Sprint Management
- Create, edit, and delete sprints
- Assign bugs to sprints
- Sprint progress tracking with visual indicators
- Sprint status: Planning, Active, Completed

### Workspace Navigation
- **Assigned to Me**: Bugs assigned to the logged-in user
- **Watching**: Bugs the user is following
- **Recently Closed**: Bugs closed in the last 30 days

### Admin Panel
- User management: search, filter, role changes
- Account activation/deactivation
- View user project memberships
- Prevents deactivating last admin

### Security
- Helmet HTTP security headers
- Rate limiting on authentication endpoints
- Server-side role authorization on all protected endpoints
- Input validation and sanitization
- CORS configuration
- MongoDB injection prevention
- No credentials in source code

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 18 | UI framework |
| Vite | Build tool & dev server |
| Tailwind CSS | Styling with custom dark theme |
| React Router 6 | Client-side routing |
| Axios | HTTP client |
| Recharts | Data visualization |
| Lucide React | Icon system |
| date-fns | Date formatting |

### Backend
| Technology | Purpose |
|---|---|
| Node.js | Runtime |
| Express.js | Web framework |
| MongoDB | Database |
| Mongoose | ODM |
| JWT | Authentication |
| bcryptjs | Password hashing |
| Multer | File uploads |
| Helmet | Security headers |
| express-rate-limit | Rate limiting |

---

## 📁 Project Structure

```
bug-tracker/
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── axios.js              # Axios instance with interceptors
│   │   ├── components/
│   │   │   ├── Badges.jsx            # Priority, severity, label badges
│   │   │   ├── Common.jsx            # PrivateRoute, StatCard
│   │   │   ├── ConfirmDialog.jsx     # Reusable confirmation modal
│   │   │   ├── CreateBugModal.jsx    # Bug creation form
│   │   │   ├── EmptyState.jsx        # Empty state component
│   │   │   ├── NotificationBell.jsx  # Notification dropdown
│   │   │   ├── Sidebar.jsx           # Main navigation sidebar
│   │   │   ├── Spinner.jsx           # Loading spinner
│   │   │   └── StatusBadge.jsx       # Status indicator component
│   │   ├── context/
│   │   │   ├── AuthContext.jsx       # Authentication state management
│   │   │   └── ToastContext.jsx      # Toast notification system
│   │   ├── pages/
│   │   │   ├── BugDetail.jsx         # Bug detail with comments, attachments, workflow
│   │   │   ├── BugList.jsx           # Filterable bug list with pagination
│   │   │   ├── Dashboard.jsx         # Analytics dashboard with charts
│   │   │   ├── KanbanBoard.jsx       # Drag-and-drop Kanban board
│   │   │   ├── Login.jsx             # Login page
│   │   │   ├── ProjectDetail.jsx     # Project details with member management
│   │   │   ├── Projects.jsx          # Projects list
│   │   │   ├── Register.jsx          # Registration page
│   │   │   ├── SprintManagement.jsx  # Sprint CRUD and bug assignment
│   │   │   ├── UserManagement.jsx    # Admin user management
│   │   │   ├── WorkspaceAssigned.jsx # "Assigned to me" view
│   │   │   ├── WorkspaceWatching.jsx # "Watching" view
│   │   │   └── WorkspaceRecentlyClosed.jsx # Recently closed bugs
│   │   ├── App.jsx                   # Root routes and layout
│   │   ├── main.jsx                  # Entry point
│   │   └── index.css                 # Tailwind + custom styles
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
├── backend/
│   ├── config/
│   │   └── db.js                     # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js         # Auth + user management
│   │   ├── bugController.js          # Bug CRUD + workflow + attachments
│   │   ├── commentController.js      # Comment CRUD
│   │   ├── dashboardController.js    # Dashboard aggregations
│   │   ├── notificationController.js # Notification management
│   │   ├── projectController.js      # Project CRUD + members
│   │   └── sprintController.js       # Sprint CRUD
│   ├── middleware/
│   │   ├── auth.js                   # JWT verification + role authorization
│   │   ├── error.js                  # Error handling middleware
│   │   └── upload.js                 # Multer file upload configuration
│   ├── models/
│   │   ├── ActivityLog.js            # Audit trail model
│   │   ├── Bug.js                    # Bug model with lifecycle fields
│   │   ├── Comment.js                # Comment model
│   │   ├── Notification.js           # Notification model
│   │   ├── Project.js                # Project model
│   │   ├── Sprint.js                 # Sprint model
│   │   └── User.js                   # User model with password hashing
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── bugRoutes.js
│   │   ├── commentRoutes.js
│   │   ├── dashboardRoutes.js
│   │   ├── notificationRoutes.js
│   │   ├── projectRoutes.js
│   │   └── sprintRoutes.js
│   ├── uploads/                      # Uploaded files directory
│   │   └── .gitkeep
│   ├── server.js                     # Express app entry point
│   ├── seed.js                       # Database seeder
│   ├── package.json
│   └── .env.example
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18+ ([download](https://nodejs.org/))
- **MongoDB** 6+ running locally or a MongoDB Atlas account
- **npm** (comes with Node.js)

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/bug-tracker.git
cd bug-tracker
```

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` and set your MongoDB connection string:
```env
MONGO_URI=mongodb://localhost:27017/bugtracker
JWT_SECRET=your_strong_random_secret_here
```

### 3. Seed Demo Data
```bash
npm run seed
```

### 4. Start Backend Server
```bash
npm run dev
```
The API server starts at **http://localhost:5000**

### 5. Frontend Setup
Open a new terminal:
```bash
cd frontend
npm install
npm run dev
```
The frontend starts at **http://localhost:5173**

### 6. Login with Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@bugtracker.dev | password123 |
| Developer | aditi@bugtracker.dev | password123 |
| Developer | rohan@bugtracker.dev | password123 |
| Tester | kavya@bugtracker.dev | password123 |
| Reporter | sam@bugtracker.dev | password123 |

---

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login | No |
| GET | `/api/auth/me` | Get current user | Yes |
| GET | `/api/auth/users` | List all users | Yes |
| GET | `/api/auth/users/:id` | Get user details | Admin |
| PATCH | `/api/auth/users/:id/role` | Change user role | Admin |
| PATCH | `/api/auth/users/:id/toggle-active` | Activate/deactivate | Admin |

### Projects
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/projects` | List projects | Yes |
| POST | `/api/projects` | Create project | Admin/Dev |
| GET | `/api/projects/:id` | Get project details | Yes |
| PATCH | `/api/projects/:id` | Update project | Admin/Dev |
| POST | `/api/projects/:id/members` | Add member | Admin/Dev |
| DELETE | `/api/projects/:id/members` | Remove member | Admin/Dev |

### Bugs
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/bugs` | List bugs (filterable) | Yes |
| POST | `/api/bugs` | Create bug | Yes |
| GET | `/api/bugs/:id` | Get bug details + activity | Yes |
| PATCH | `/api/bugs/:id` | Update bug | Yes |
| DELETE | `/api/bugs/:id` | Delete bug | Admin |
| PATCH | `/api/bugs/:id/status` | Change status | Yes |
| PATCH | `/api/bugs/:id/assign` | Assign bug | Admin/Dev |
| POST | `/api/bugs/:id/watch` | Toggle watch | Yes |
| POST | `/api/bugs/:id/attachments` | Upload attachment | Yes |
| DELETE | `/api/bugs/:id/attachments/:aid` | Remove attachment | Owner/Admin |
| GET | `/api/bugs/my-bugs` | Bugs assigned to me | Yes |
| GET | `/api/bugs/watched` | Bugs I'm watching | Yes |
| GET | `/api/bugs/recently-closed` | Recently closed bugs | Yes |

### Comments
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/bugs/:bugId/comments` | List comments | Yes |
| POST | `/api/bugs/:bugId/comments` | Add comment | Yes |
| PATCH | `/api/comments/:id` | Edit comment | Author |
| DELETE | `/api/comments/:id` | Delete comment | Author/Admin |

### Notifications
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/notifications` | List notifications | Yes |
| GET | `/api/notifications/unread-count` | Get unread count | Yes |
| PATCH | `/api/notifications/:id/read` | Mark as read | Yes |
| PATCH | `/api/notifications/read-all` | Mark all as read | Yes |

### Sprints
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/sprints` | List sprints | Yes |
| POST | `/api/sprints` | Create sprint | Admin/Dev |
| GET | `/api/sprints/:id` | Get sprint details | Yes |
| PATCH | `/api/sprints/:id` | Update sprint | Admin/Dev |
| DELETE | `/api/sprints/:id` | Delete sprint | Admin/Dev |
| POST | `/api/sprints/:id/bugs` | Add bug to sprint | Admin/Dev |
| DELETE | `/api/sprints/:id/bugs` | Remove bug from sprint | Admin/Dev |

### Dashboard
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/dashboard` | Dashboard stats + charts | Yes |

### Health
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/health` | Health check | No |

---

## 🔐 Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MONGO_URI` | ✅ | — | MongoDB connection string |
| `JWT_SECRET` | ✅ | — | Secret key for JWT signing |
| `JWT_EXPIRES_IN` | ❌ | `7d` | JWT token expiration |
| `PORT` | ❌ | `5000` | Backend server port |
| `NODE_ENV` | ❌ | `development` | Environment mode |
| `CLIENT_URL` | ❌ | `*` | Frontend URL for CORS |
| `UPLOAD_DIR` | ❌ | `uploads` | File upload directory |
| `MAX_FILE_SIZE` | ❌ | `5242880` | Max upload size (bytes) |
| `SMTP_HOST` | ❌ | — | Email SMTP host |
| `SMTP_PORT` | ❌ | — | Email SMTP port |
| `SMTP_USER` | ❌ | — | Email SMTP username |
| `SMTP_PASS` | ❌ | — | Email SMTP password |
| `SMTP_FROM` | ❌ | — | Email sender address |

---

## 🚢 Deployment

### Backend (Render / Railway)
1. Set environment variables in the hosting dashboard
2. Set `NODE_ENV=production`
3. Build command: `npm install`
4. Start command: `npm start`

### Frontend (Vercel / Netlify)
1. Set build command: `npm run build`
2. Set output directory: `dist`
3. Add environment variable or update `api/axios.js` baseURL to point to your deployed backend URL

### Database (MongoDB Atlas)
1. Create a free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create a database user
3. Whitelist your server IP
4. Copy the connection string to `MONGO_URI`

---

## 👥 Team

| Member | Contributions |
|--------|--------------|
| **Payal** | Full-stack development — backend APIs, frontend pages, authentication, bug lifecycle |
| **Meghana** | Frontend/UI design — component design, Tailwind theming, responsive layout |
| **Harika** | Testing & documentation — test planning, QA, README, project documentation |
| **Gungun** | Feature development — notifications, sprint management, workspace views |
| **Tammineni** | Feature development — dashboard analytics, Kanban board, file attachments |

---

## 📄 License

This project is licensed under the MIT License.
