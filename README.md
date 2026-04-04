# Finance Dashboard — Full Stack

A full-stack finance dashboard system built with **Django REST Framework** and **React**. The system supports role-based access control across four user levels, full financial record management, and a rich analytics page with interactive charts.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend language | Python 3.11+ |
| Backend framework | Django 4.x / Django REST Framework |
| Authentication | JWT via `djangorestframework-simplejwt` |
| Database | SQLite (dev) — PostgreSQL ready |
| Filtering and search | `django-filter` |
| API documentation | `drf-spectacular` — Swagger UI |
| Frontend | React 18 |
| HTTP client | Axios |
| Charts | Recharts |
| Routing | React Router v6 |
| CORS | `django-cors-headers` |

---

## Features

### Backend
- JWT authentication with access token (2 hr) and refresh token (7 days)
- Four-level role-based access control — Viewer, Analyst, Admin, Superadmin
- Full CRUD for financial transactions with soft delete
- Filtering by date range, category, and type
- Search across category and notes fields
- Paginated list responses (20 per page)
- Aggregated dashboard summary API
- Dedicated analytics API with daily, monthly, and category breakdowns
- Auto-generated Swagger UI at `/api/docs/`

### Frontend
- Login page with JWT auth and automatic token refresh
- Role-aware navigation — each role sees only what they are allowed to access
- Transactions page — read-only for Viewer and Analyst, full CRUD for Admin and Superadmin
- Dashboard page — blocked for Viewer, available for Analyst and above
- Analytics page — income vs expense line chart, net balance over time, monthly bar chart, category pie chart, and category breakdown table with progress bars
- Date range presets (Last 30 / 60 / 90 days) plus a custom date picker
- User management page — Superadmin only, create users and change roles inline

---

## Role Permission Matrix

| Action | Viewer | Analyst | Admin | Superadmin |
|---|---|---|---|---|
| View transactions | ✓ | ✓ | ✓ | ✓ |
| Filter and search transactions | ✓ | ✓ | ✓ | ✓ |
| Create transaction | ✗ | ✗ | ✓ | ✓ |
| Edit transaction | ✗ | ✗ | ✓ | ✓ |
| Delete transaction (soft) | ✗ | ✗ | ✓ | ✓ |
| View dashboard summary | ✗ | ✓ | ✓ | ✓ |
| View analytics and charts | ✗ | ✓ | ✓ | ✓ |
| Create users | ✗ | ✗ | ✗ | ✓ |
| Assign and change roles | ✗ | ✗ | ✗ | ✓ |
| Activate and deactivate users | ✗ | ✗ | ✗ | ✓ |

---

## Project Structure

```
finance_dashboard/
├── core/                        Django project config
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── users/                       User management app
│   ├── models.py                Custom User model with role field
│   ├── serializers.py
│   ├── views.py                 UserViewSet with set_role and toggle_status
│   ├── permissions.py           IsSuperAdmin, IsAdminOrAbove, IsAnalystOrAbove, IsViewerOrAbove
│   └── admin.py
├── finance/                     Financial records app
│   ├── models.py                Transaction model with soft delete
│   ├── serializers.py
│   ├── views.py                 TransactionViewSet
│   └── filters.py               Date, category, type filters
├── dashboard/                   Aggregation and analytics app
│   └── views.py                 DashboardSummaryView and AnalyticsView
├── frontend/                    React application
│   └── src/
│       ├── api/
│       │   └── axios.js         Axios instance with JWT interceptor and auto refresh
│       ├── context/
│       │   └── AuthContext.js   Global auth state with role
│       ├── components/
│       │   ├── Navbar.jsx
│       │   ├── PrivateRoute.jsx
│       │   ├── AdminRoute.jsx
│       │   ├── SuperAdminRoute.jsx
│       │   └── AnalyticsRoute.jsx
│       └── pages/
│           ├── Login.jsx
│           ├── Dashboard.jsx
│           ├── Transactions.jsx
│           ├── Analytics.jsx
│           └── Users.jsx
├── seed_data.py                 Fake data script for testing
├── manage.py
└── requirements.txt
```

---

## Data Models

### User

| Field | Type | Description |
|---|---|---|
| `id` | AutoField | Primary key |
| `username` | CharField | Unique login name |
| `email` | EmailField | Optional email |
| `password` | CharField | Hashed by Django |
| `role` | CharField | viewer / analyst / admin / superadmin |
| `is_active` | BooleanField | Account active or inactive |
| `date_joined` | DateTimeField | Auto-set on creation |

### Transaction

| Field | Type | Description |
|---|---|---|
| `id` | AutoField | Primary key |
| `user` | ForeignKey | Linked to User who created it |
| `amount` | DecimalField | Must be greater than zero |
| `type` | CharField | income or expense |
| `category` | CharField | e.g. salary, rent, food |
| `date` | DateField | Transaction date |
| `notes` | TextField | Optional description |
| `is_deleted` | BooleanField | Soft delete flag — default False |
| `created_at` | DateTimeField | Auto-set on creation |
| `updated_at` | DateTimeField | Auto-updated on save |

---

## API Reference

### Authentication

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/login/` | Public | Get access and refresh tokens |
| POST | `/api/auth/refresh/` | Public | Get a new access token |

**Login request body:**
```json
{
  "username": "admin",
  "password": "yourpassword"
}
```

**Login response:**
```json
{
  "access": "eyJhbGci...",
  "refresh": "eyJhbGci..."
}
```

Add this header to every protected request:
```
Authorization: Bearer <access_token>
```

---

### Users — Superadmin only

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/users/` | List all users |
| POST | `/api/users/` | Create a new user |
| GET | `/api/users/{id}/` | Get a specific user |
| PATCH | `/api/users/{id}/set_role/` | Change user role |
| PATCH | `/api/users/{id}/toggle_status/` | Activate or deactivate user |

---

### Transactions

| Method | Endpoint | Role required | Description |
|---|---|---|---|
| GET | `/api/transactions/` | All roles | List with filters and pagination |
| POST | `/api/transactions/` | Admin, Superadmin | Create a transaction |
| PATCH | `/api/transactions/{id}/` | Admin, Superadmin | Partial update |
| DELETE | `/api/transactions/{id}/` | Admin, Superadmin | Soft delete |

**Supported query parameters:**

| Param | Example | Description |
|---|---|---|
| `type` | `?type=income` | Filter by income or expense |
| `category` | `?category=rent` | Filter by category name |
| `date_from` | `?date_from=2024-01-01` | Start date filter |
| `date_to` | `?date_to=2024-12-31` | End date filter |
| `search` | `?search=salary` | Search notes and category |
| `ordering` | `?ordering=-amount` | Sort by field |
| `page` | `?page=2` | Page number |

---

### Dashboard — Analyst and above

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/dashboard/` | Total income, expenses, balance, categories, recent activity, monthly trend |

---

### Analytics — Analyst and above

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/analytics/` | Full chart data for the selected date range |

**Query parameters:**

| Param | Default | Description |
|---|---|---|
| `date_from` | 30 days ago | Start of date range (YYYY-MM-DD) |
| `date_to` | Today | End of date range (YYYY-MM-DD) |

**Response includes:**
- Period summary — total income, total expenses, net balance
- Daily income and expense data for the line chart
- Running net balance per day
- Monthly grouped totals for the bar chart
- Category totals with type for the pie chart and table

---

### API Docs

| Endpoint | Description |
|---|---|
| `/api/docs/` | Interactive Swagger UI |
| `/api/schema/` | OpenAPI schema in JSON |

---

## Setup and Installation

### Prerequisites

- Python 3.9 or above
- Node.js 18 or above
- pip

---

### Backend Setup

**1. Clone the repository**
```bash
git clone https://github.com/yourusername/finance-dashboard.git
cd finance-dashboard
```

**2. Create and activate a virtual environment**
```bash
python -m venv venv

# Mac and Linux
source venv/bin/activate

# Windows
venv\Scripts\activate
```

**3. Install Python dependencies**
```bash
pip install -r requirements.txt
```

**4. Apply database migrations**
```bash
python manage.py makemigrations
python manage.py migrate
```

**5. Create a superadmin user**
```bash
python manage.py createsuperuser
```

Then open the shell and assign the superadmin role:
```bash
python manage.py shell
```
```python
from users.models import User
u = User.objects.get(username='your_username')
u.role = 'superadmin'
u.save()
print(u.username, u.role)
```

**6. Start the development server**
```bash
python manage.py runserver
```

---

### Frontend Setup

```bash
cd frontend
npm install
npm start
```

React app opens at `http://localhost:3000`.

---

### requirements.txt

```
django>=4.2
djangorestframework>=3.14
djangorestframework-simplejwt>=5.3
django-filter>=23.0
drf-spectacular>=0.27
django-cors-headers>=4.3
python-decouple>=3.8
```

---

## Load Sample / Fake Data

To populate the database with 6 months of realistic fake transactions, open the Django shell:

```bash
python manage.py shell
```

Paste and run the contents of `seed_data.py`. It generates approximately 300 to 500 transactions including:

| Data | Pattern |
|---|---|
| Salary | 1st of every month |
| Rent | 2nd of every month |
| Utilities | Between 5th and 10th each month |
| Insurance | 15th of each month |
| Food, transport, entertainment | Daily random entries |
| Freelance income | Random — roughly 8% of days |
| Investment returns | Random — roughly 5% of days |
| Bonus | Random — roughly 2% of days |
| Healthcare, education, gym | Occasional random entries |
| Rental income | 5th of each month, 40% chance |

To clear all existing transactions before seeding:
```python
from finance.models import Transaction
Transaction.objects.all().delete()
```

---

## Creating Users

### Via the Django Admin panel
Visit `http://127.0.0.1:8000/admin/`, log in with your superuser, and create users with roles from the Users section.

### Via the API
```bash
# Step 1 — Login
curl -X POST http://127.0.0.1:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username": "superadmin", "password": "yourpassword"}'

# Step 2 — Create a user
curl -X POST http://127.0.0.1:8000/api/users/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"username": "alice", "password": "alice123", "role": "analyst"}'

# Step 3 — Change a role
curl -X PATCH http://127.0.0.1:8000/api/users/2/set_role/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"role": "admin"}'
```

### Via the Django shell
```python
from users.models import User

User.objects.create_user(username='alice',   password='alice123',   role='viewer')
User.objects.create_user(username='bob',     password='bob123',     role='analyst')
User.objects.create_user(username='charlie', password='charlie123', role='admin')
```

---

## Running Both Servers

```bash
# Terminal 1 — Django backend
python manage.py runserver

# Terminal 2 — React frontend
cd frontend && npm start
```

| Service | URL |
|---|---|
| Django API | http://127.0.0.1:8000/api/ |
| Swagger UI | http://127.0.0.1:8000/api/docs/ |
| Django Admin | http://127.0.0.1:8000/admin/ |
| React Frontend | http://localhost:3000 |

---

## Error Handling

| Status code | Meaning |
|---|---|
| `200 OK` | Success |
| `201 Created` | Resource created successfully |
| `204 No Content` | Successful delete — no body returned |
| `400 Bad Request` | Validation error — details returned in response body |
| `401 Unauthorized` | Missing or expired JWT token |
| `403 Forbidden` | Authenticated but role is insufficient |
| `404 Not Found` | Resource does not exist |

**Example validation error:**
```json
{
  "amount": ["This field must be a positive number."],
  "type": ["Value must be income or expense."]
}
```

---

## Design Decisions and Tradeoffs

| Area | Decision and reasoning |
|---|---|
| SQLite | Used for development simplicity. The Django ORM is database-agnostic — switching to PostgreSQL requires only updating `DATABASES` in `settings.py` |
| Four roles | Viewer, Analyst, Admin, Superadmin map cleanly to real-world finance dashboard use cases with clear separation of concerns |
| Soft delete | Transactions are never permanently removed. Financial records need audit trails even after deletion |
| Role in JWT | The user role is embedded in the JWT payload so the frontend can render role-aware UI without an extra API call on every page load |
| Superadmin-only user management | Only one role can create users and change roles, preventing privilege escalation by regular admins |
| Analyst read access | Analysts can view all transactions and analytics but cannot create or modify any financial records |
| DateField on Transaction | Uses `DateField` rather than `DateTimeField` because transactions belong to a calendar day, not a specific time |
| Pagination | Default page size of 20 on all list endpoints to prevent oversized API responses |
| CORS | Configured for `localhost:3000` in development — update `CORS_ALLOWED_ORIGINS` in `settings.py` before deploying |

---

## Optional Enhancements Implemented

All optional features from the project brief are included:

- JWT Authentication with access and refresh tokens
- Pagination on all list endpoints
- Search support across category and notes
- Soft delete on transactions — data is never permanently erased
- Swagger UI auto-generated at `/api/docs/`
- Full React frontend with role-aware navigation and UI
- Analytics page with four interactive Recharts visualisations
- Fake data seed script for immediate testing and demonstration

---

## Author

Built as a backend engineering assessment project demonstrating API design, access control, data modeling, and full-stack integration.

**Stack:** Python · Django REST Framework · React 18 · SQLite · JWT · Recharts
