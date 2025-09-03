# Architecture Documentation
## Phone Book Application v5.3.4

### **Document Information**
- **Version**: 1.0
- **Date**: September 2, 2025
- **Author**: Development Team
- **Status**: Final - Living Document

> **📋 Maintenance Note**: This document serves as the **single source of truth** for project structure and architecture. It will be updated whenever:
> - New modules/files are added
> - Existing modules are modified or removed
> - Architecture patterns change
> - Dependencies are updated
> - New features affect the overall structure

---

## **1. Architecture Overview**

The Phone Book Application follows a **modular monolithic architecture** built with Flask framework. The application is designed with separation of concerns, using blueprints for route organization, and follows MVC-like patterns for maintainability and scalability.

### **1.1 Architectural Principles**
- **Modularity**: Separated concerns with Flask blueprints
- **Separation of Concerns**: Clear boundaries between presentation, business logic, and data layers
- **Single Responsibility**: Each module handles one specific domain
- **Scalability**: Modular design allows easy feature additions
- **Security**: Built-in authentication and authorization
- **Maintainability**: Clean code structure with comprehensive logging

---

## **2. System Architecture**

### **2.1 High-Level Architecture Diagram**

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Layer (Browser)                   │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐ │
│  │   HTML/CSS  │ │ JavaScript  │ │    Static Assets        │ │
│  │   Templates │ │   Modules   │ │  (Fonts, Images, CSS)   │ │
│  └─────────────┘ └─────────────┘ └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │ HTTP/HTTPS
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Web Server Layer (Waitress)                │
└─────────────────────────────────────────────────────────────┘
                            │ WSGI
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Application Layer (Flask)                 │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐ │
│  │   Routing   │ │ Middleware  │ │    Session Mgmt         │ │
│  │ (Blueprints)│ │  (Auth)     │ │   (Flask Sessions)      │ │
│  └─────────────┘ └─────────────┘ └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Business Logic Layer                      │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌────────┐ │
│  │    Auth     │ │  Contacts   │ │ Companies   │ │ Users  │ │
│  │   Module    │ │   Module    │ │   Module    │ │ Module │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     Data Access Layer                       │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐ │
│  │  Database   │ │   Models    │ │      Utilities          │ │
│  │ Connection  │ │   (SQLite)  │ │   (Logging, Config)     │ │
│  └─────────────┘ └─────────────┘ └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Storage Layer (SQLite)                   │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐ │
│  │  Contacts   │ │ Companies   │ │        Users            │ │
│  │    Table    │ │    Table    │ │        Table            │ │
│  └─────────────┘ └─────────────┘ └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### **2.2 Technology Stack**

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | HTML5, CSS3, JavaScript ES6+ | User interface and interactions |
| **Templating** | Jinja2 | Server-side template rendering |
| **Web Framework** | Flask 2.3+ | Application framework and routing |
| **WSGI Server** | Waitress | Production web server |
| **Database** | SQLite 3 | Data persistence |
| **Authentication** | Werkzeug Security | Password hashing and security |
| **Session Management** | Flask Sessions | User session handling |
| **Logging** | Python logging | Application monitoring |
| **Data Processing** | pandas | Excel import/export |

---

## **7. Recent Changes and Maintenance History**

### **September 2, 2025 - Users Management Module Fix**
**Issue:** "خطا در بارگذاری کاربران: no such column: role"

**Root Cause Analysis:**
- Users table schema: `id`, `username`, `password`, `is_admin`
- Code was querying non-existent columns: `created_at`, `role`
- Password hashing inconsistency between auth and users modules

**Fixes Applied:**
1. **Database Schema Alignment**: 
   - Removed `created_at` from SELECT queries (column doesn't exist)
   - Used `is_admin` column correctly throughout users module

2. **Password Hashing Consistency**:
   - Updated `routes/users.py` to use Werkzeug's secure hashing
   - Replaced `hashlib.sha256()` with `generate_password_hash()`/`check_password_hash()`

3. **Data Conversion**:
   - Convert `is_admin` (0/1) ↔ `role` ("admin"/"normal") for API consistency
   - Maintain backward compatibility with frontend expectations

**Result**: Users management module now works correctly with proper security and schema alignment.

### **3.1 Final Project Structure (v5.3.4)**

```
PHONE BOOK v5.3.4/
├── app.py                    # Main application entry point (FINAL VERSION)
├── auth.py                   # Authentication decorators and utilities
├── config.py                 # Configuration management
├── database.py               # Database connection and initialization
├── phonebook.db              # SQLite database file
├── PRD.md                    # Product Requirements Document
├── ARCHITECTURE.md           # Architecture Documentation (THIS FILE)
├── routes/                   # Modular route blueprints
│   ├── __init__.py          # Blueprint package initialization
│   ├── main.py              # HTML page serving routes
│   ├── auth.py              # Authentication API routes
│   ├── contacts.py          # Contact management API routes
│   ├── companies.py         # Company management API routes
│   └── users.py             # User management API routes
├── templates/               # Jinja2 HTML templates
│   ├── login.html           # User login page
│   ├── register.html        # User registration page
│   ├── dashboard.html       # Main dashboard
│   ├── contacts.html        # Contact list view
│   ├── contacts_entry.html  # Contact add/edit form
│   ├── companies.html       # Company management
│   ├── users_mng.html       # User management (admin only)
│   └── sidebar.html         # Navigation sidebar component
├── static/                  # Static assets
│   ├── styles.css           # Main stylesheet with Persian fonts
│   ├── js/                  # JavaScript modules
│   │   ├── auth.js          # Authentication handling
│   │   ├── contacts.js      # Contact management
│   │   ├── contacts_entry.js# Contact form handling
│   │   ├── contactTable.js  # Contact table functionality
│   │   ├── contactModals.js # Modal dialogs
│   │   ├── companies.js     # Company management
│   │   ├── companyData.js   # Company data handling
│   │   ├── dashboard.js     # Dashboard functionality
│   │   ├── users_mng.js     # User management
│   │   └── utils.js         # Utility functions
│   ├── fonts/               # Custom Persian fonts
│   │   ├── Vazirmatn-Regular.woff2
│   │   └── Vazirmatn-Bold.woff2
│   └── images/              # Application images
│       └── logo.png         # Application logo
└── __pycache__/             # Python cache files (auto-generated)
```

**Note**: This structure represents the final, cleaned version after removing duplicate files (`app_fixed.py`, `app_backup.py`, etc.)

### **3.2 Recent Architecture Evolution**

#### **3.2.1 Modularization Process (September 2025)**
The application underwent a significant refactoring to achieve a clean, modular architecture:

**Phase 1: Code Cleanup**
- Identified and resolved corrupted `app.py` with duplicate route definitions
- Backed up original files and created clean version
- Removed over 900 lines of redundant code from main application file

**Phase 2: Blueprint Modularization**
- Extracted authentication routes to `routes/auth.py`
- Moved contact management to `routes/contacts.py`
- Separated company operations to `routes/companies.py`
- Isolated user management to `routes/users.py`
- Maintained page serving in `routes/main.py`

**Phase 3: Error Resolution**
- Fixed authentication decorators to return JSON for API endpoints
- Resolved database schema compatibility issues
- Corrected template URL references for blueprint routing
- Eliminated internal server errors

**Final Result**: Clean 32-line `app.py` with modular blueprint architecture

### **3.3 Module Responsibilities**

#### **3.3.1 Core Modules**

| Module | File | Responsibility |
|--------|------|---------------|
| **Application Core** | `app.py` | Flask app initialization, blueprint registration, server startup |
| **Configuration** | `config.py` | Environment configuration, secrets, logging setup |
| **Database** | `database.py` | DB connection management, schema initialization, migrations |
| **Authentication** | `auth.py` | Decorators for login/admin requirements, session validation |

> **📝 Note**: The authentication module is split into two files:
> - `auth.py` (root): Authentication decorators and utilities
> - `routes/auth.py`: Authentication endpoints (login, register, logout)

#### **3.3.2 Route Modules (Blueprints)**

| Blueprint | File | URL Prefix | Responsibility |
|-----------|------|------------|---------------|
| **Main Routes** | `routes/main.py` | `/` | HTML page serving, navigation |
| **Auth Routes** | `routes/auth.py` | `/api` | Login, logout, registration, session management |
| **Contact Routes** | `routes/contacts.py` | `/api` | Contact CRUD, search, import/export |
| **Company Routes** | `routes/companies.py` | `/api` | Company CRUD, hierarchy management |
| **User Routes** | `routes/users.py` | `/api` | User CRUD, role management (admin only) |

---

## **4. Data Architecture**

### **4.1 Database Schema**

```sql
-- Users Table
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'normal' CHECK(role IN ('admin', 'normal')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Companies Table
CREATE TABLE companies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_name TEXT UNIQUE NOT NULL,
    sub_company1 TEXT,
    sub_company2 TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Contacts Table
CREATE TABLE contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    main_company TEXT,
    job_title TEXT,
    mobile_phone TEXT NOT NULL,
    office_phone1 TEXT,
    extension1 TEXT,
    office_phone2 TEXT,
    extension2 TEXT,
    office_phone3 TEXT,
    extension3 TEXT,
    email TEXT,
    office_manager_name1 TEXT,
    office_manager_mobile1 TEXT,
    office_manager_name2 TEXT,
    office_manager_mobile2 TEXT,
    office_manager_name3 TEXT,
    office_manager_mobile3 TEXT,
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### **4.2 Entity Relationships**

```
┌─────────────┐         ┌─────────────────┐         ┌─────────────┐
│    Users    │         │    Contacts     │         │ Companies   │
├─────────────┤         ├─────────────────┤         ├─────────────┤
│ id (PK)     │         │ id (PK)         │         │ id (PK)     │
│ username    │         │ full_name       │         │company_name │
│ password    │         │ main_company ○──┼─────────│sub_company1 │
│ role        │         │ job_title       │         │sub_company2 │
│ created_at  │         │ mobile_phone    │         │created_at   │
└─────────────┘         │ office_phone1   │         └─────────────┘
                        │ office_phone2   │
                        │ office_phone3   │
                        │ email           │
                        │ manager_info    │
                        │ address         │
                        │ created_at      │
                        │ updated_at      │
                        └─────────────────┘

Legend: ○ = Foreign Key Reference (Logical)
Note: Uses logical references, not enforced FK constraints
```

### **4.3 Data Flow Architecture**

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Client    │───▶│   Routes    │───▶│  Database   │───▶│   SQLite    │
│ (Browser)   │    │(Blueprints) │    │ Connection  │    │    File     │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       ▲                  │                   │                   │
       │                  ▼                   ▼                   ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Templates  │◀───│ Business    │◀───│    Models   │◀───│    Tables   │
│ (Jinja2)    │    │   Logic     │    │  (Dicts)    │    │ (Contacts,  │
└─────────────┘    └─────────────┘    └─────────────┘    │ Users, etc) │
                                                          └─────────────┘
```

---

## **5. Security Architecture**

### **5.1 Authentication & Authorization Flow**

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│    Login    │───▶│   Verify    │───▶│   Create    │───▶│   Access    │
│  Request    │    │Credentials  │    │  Session    │    │ Protected   │
└─────────────┘    └─────────────┘    └─────────────┘    │  Resource   │
       │                  │                   │          └─────────────┘
       │                  ▼                   ▼                   │
┌─────────────┐    ┌─────────────┐    ┌─────────────┐             │
│ Username/   │    │  Password   │    │   Session   │             │
│ Password    │    │   Hash      │    │    Store    │             │
└─────────────┘    │Verification │    │ (Flask)     │             │
                   └─────────────┘    └─────────────┘             │
                          │                   │                   │
                          ▼                   ▼                   ▼
                   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
                   │   SQLite    │    │ Server-side │    │ Role-based  │
                   │   Users     │    │   Cookie    │    │    Access   │
                   │   Table     │    │             │    │   Control   │
                   └─────────────┘    └─────────────┘    └─────────────┘
```

### **5.2 Security Layers**

| Layer | Implementation | Description |
|-------|---------------|-------------|
| **Input Validation** | Flask request validation | Sanitize all user inputs |
| **Authentication** | Werkzeug password hashing | Secure password storage |
| **Session Management** | Flask sessions + secret key | Server-side session tracking |
| **Authorization** | Custom decorators | Role-based access control |
| **CSRF Protection** | Built-in Flask protection | Cross-site request forgery prevention |
| **SQL Injection** | Parameterized queries | Prevent SQL injection attacks |
| **XSS Protection** | Jinja2 auto-escaping | Prevent cross-site scripting |

### **5.3 Access Control Matrix**

| Feature | Normal User | Admin User |
|---------|------------|------------|
| **View Contacts** | ✅ | ✅ |
| **Add Contacts** | ✅ | ✅ |
| **Edit Contacts** | ✅ | ✅ |
| **Delete Contacts** | ✅ | ✅ |
| **Import/Export** | ✅ | ✅ |
| **View Companies** | ✅ | ✅ |
| **Manage Companies** | ✅ | ✅ |
| **View Users** | ❌ | ✅ |
| **Create Users** | ❌ | ✅ |
| **Edit Users** | ❌ | ✅ |
| **Delete Users** | ❌ | ✅ |
| **Change Own Password** | ✅ | ✅ |
| **Change Others Password** | ❌ | ✅ |

---

## **6. API Architecture**

### **6.1 RESTful API Design**

#### **6.1.1 Authentication Endpoints**
```
POST   /api/register        # User registration
POST   /api/login           # User login
GET    /api/logout          # User logout
GET    /api/users/count     # Get total user count
```

#### **6.1.2 Contact Management Endpoints**
```
GET    /api/contacts               # List all contacts
POST   /api/contacts               # Create new contact
GET    /api/contacts/{id}          # Get specific contact
PUT    /api/contacts/{id}          # Update contact
DELETE /api/contacts/{id}          # Delete contact
GET    /api/contacts/search        # Search contacts
POST   /api/contacts/import        # Import from Excel
```

#### **6.1.3 Company Management Endpoints**
```
GET    /api/companies                    # List all companies
POST   /api/companies                    # Create new company
GET    /api/companies/{id}               # Get specific company
PUT    /api/companies/{id}               # Update company
DELETE /api/companies/{id}               # Delete company
GET    /api/companies/unique_from_contacts # Get unique companies from contacts
```

#### **6.1.4 User Management Endpoints**
```
GET    /api/users                # List all users (admin only)
POST   /api/users                # Create new user (admin only)
GET    /api/users/{id}           # Get specific user (admin only)
PUT    /api/users/{id}           # Update user (admin only)
DELETE /api/users/{id}           # Delete user (admin only)
POST   /api/users/{id}/change_password # Change user password
```

### **6.2 API Response Format**

#### **6.2.1 Success Response**
```json
{
    "data": { ... },
    "message": "Operation successful",
    "status": "success"
}
```

#### **6.2.2 Error Response**
```json
{
    "error": "Error description",
    "status": "error",
    "code": 400
}
```

### **6.3 HTTP Status Codes**

| Code | Description | Usage |
|------|-------------|-------|
| **200** | OK | Successful GET, PUT operations |
| **201** | Created | Successful POST operations |
| **400** | Bad Request | Invalid input data |
| **401** | Unauthorized | Authentication required |
| **403** | Forbidden | Insufficient permissions |
| **404** | Not Found | Resource not found |
| **409** | Conflict | Duplicate resource |
| **500** | Internal Error | Server-side errors |

---

## **7. Frontend Architecture**

### **7.1 Frontend Structure**

```
static/
├── styles.css              # Main stylesheet
├── js/                     # JavaScript modules
│   ├── auth.js            # Authentication handling
│   ├── contacts.js        # Contact management
│   ├── contacts_entry.js  # Contact form handling
│   ├── contactTable.js    # Contact table functionality
│   ├── contactModals.js   # Modal dialogs
│   ├── companies.js       # Company management
│   ├── companyData.js     # Company data handling
│   ├── dashboard.js       # Dashboard functionality
│   ├── users_mng.js       # User management
│   └── utils.js           # Utility functions
├── fonts/                 # Custom fonts
│   ├── Vazirmatn-Regular.woff2
│   └── Vazirmatn-Bold.woff2
└── images/                # Static images
    └── logo.png
```

### **7.2 JavaScript Module Pattern**

Each JavaScript module follows this pattern:
```javascript
// Module pattern with IIFE
(function() {
    'use strict';
    
    // Private variables and functions
    const API_BASE = '/api';
    
    // Public interface
    window.ModuleName = {
        init: function() { ... },
        methodName: function() { ... }
    };
    
    // Auto-initialization
    document.addEventListener('DOMContentLoaded', ModuleName.init);
})();
```

### **7.3 Template Architecture**

Templates use Jinja2 inheritance:
```
base.html                   # Base template (if exists)
├── login.html             # Standalone login page
├── register.html          # Standalone registration page
└── main_layout.html       # Main app layout
    ├── sidebar.html       # Navigation sidebar
    ├── dashboard.html     # Dashboard content
    ├── contacts.html      # Contact list page
    ├── contacts_entry.html # Contact form page
    ├── companies.html     # Company management page
    └── users_mng.html     # User management page
```

---

## **8. Deployment Architecture**

### **8.1 Production Deployment**

```
┌─────────────────────────────────────────────────────────────┐
│                    Production Server                        │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐ │
│  │   Waitress  │ │    Flask    │ │      SQLite DB          │ │
│  │WSGI Server  │ │Application  │ │    (phonebook.db)       │ │
│  │   :5000     │ │             │ │                         │ │
│  └─────────────┘ └─────────────┘ └─────────────────────────┘ │
│                                                              │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐ │
│  │   Static    │ │   Logs      │ │      Backups            │ │
│  │   Files     │ │   Files     │ │   (if implemented)      │ │
│  └─────────────┘ └─────────────┘ └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### **8.2 Development Deployment**

```
┌─────────────────────────────────────────────────────────────┐
│                 Development Environment                     │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐ │
│  │Flask Dev    │ │    Flask    │ │      SQLite DB          │ │
│  │ Server      │ │Application  │ │    (phonebook.db)       │ │
│  │  :5000      │ │(Debug Mode) │ │                         │ │
│  └─────────────┘ └─────────────┘ └─────────────────────────┘ │
│                                                              │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐ │
│  │ Hot Reload  │ │   Console   │ │      Git Repo           │ │
│  │  Enabled    │ │   Logging   │ │                         │ │
│  └─────────────┘ └─────────────┘ └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### **8.3 Configuration Management**

| Environment | Configuration | Database | Logging | Debug |
|-------------|---------------|----------|---------|-------|
| **Development** | `config.py` | Local SQLite | Console + File | Enabled |
| **Production** | Environment variables | Local SQLite | File only | Disabled |
| **Testing** | Test config | In-memory SQLite | Minimal | Enabled |

---

## **9. Performance Architecture**

### **9.1 Performance Considerations**

| Component | Optimization Strategy | Implementation |
|-----------|----------------------|----------------|
| **Database** | Connection pooling | SQLite connection reuse |
| **Queries** | Indexed searches | Proper WHERE clauses |
| **Frontend** | Minification | CSS/JS optimization |
| **Caching** | Browser caching | Static asset headers |
| **Sessions** | Server-side storage | Flask session management |

### **9.2 Scalability Patterns**

```
Current (Single Instance):
┌─────────────┐
│  Flask App  │
│  + SQLite   │
└─────────────┘

Future (Horizontal Scaling):
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│  Flask App  │ │  Flask App  │ │  Flask App  │
│   Node 1    │ │   Node 2    │ │   Node N    │
└─────────────┘ └─────────────┘ └─────────────┘
       │               │               │
       └───────────────┼───────────────┘
                       │
              ┌─────────────┐
              │ PostgreSQL  │
              │  Database   │
              └─────────────┘
```

---

## **10. Monitoring & Observability**

### **10.1 Logging Architecture**

```python
Logging Hierarchy:
├── Application Logger (INFO level)
│   ├── Authentication events
│   ├── CRUD operations
│   ├── User actions
│   └── System events
├── Error Logger (ERROR level)
│   ├── Exception tracking
│   ├── Database errors
│   └── System failures
└── Debug Logger (DEBUG level)
    ├── Development debugging
    └── Performance metrics
```

### **10.2 Health Monitoring**

| Metric | Monitoring Method | Threshold |
|--------|------------------|-----------|
| **Response Time** | Flask logging | < 500ms |
| **Error Rate** | Exception logging | < 1% |
| **Database Performance** | Query logging | < 100ms |
| **Memory Usage** | System monitoring | < 512MB |
| **Disk Usage** | File system monitoring | < 80% |

---

## **11. Migration & Maintenance**

### **11.1 Database Migration Strategy**

```python
Migration Process:
1. Check current schema version
2. Compare with target schema
3. Generate migration scripts
4. Backup current database
5. Apply migrations
6. Verify data integrity
7. Update schema version
```

### **11.2 Backup Strategy**

| Component | Backup Method | Frequency | Retention |
|-----------|--------------|-----------|-----------|
| **Database** | SQLite file copy | Daily | 30 days |
| **Configuration** | Git repository | On change | Infinite |
| **Static Files** | File system backup | Weekly | 90 days |
| **Logs** | Log rotation | Daily | 7 days |

---

## **12. Future Architecture Considerations**

### **12.1 Microservices Migration Path**

```
Current Monolith → Target Microservices:

┌─────────────────┐     ┌─────────────┐ ┌─────────────┐
│   Monolithic    │ ──▶ │   Auth      │ │  Contact    │
│   Flask App     │     │  Service    │ │  Service    │
└─────────────────┘     └─────────────┘ └─────────────┘
                              │               │
                        ┌─────────────┐ ┌─────────────┐
                        │  Company    │ │    User     │
                        │  Service    │ │  Service    │
                        └─────────────┘ └─────────────┘
                              │               │
                        ┌─────────────────────────────┐
                        │      API Gateway            │
                        └─────────────────────────────┘
```

### **12.2 Technology Evolution**

| Current | Future Option | Benefits |
|---------|---------------|----------|
| **SQLite** | PostgreSQL | Better concurrency, ACID compliance |
| **Flask Sessions** | Redis | Distributed sessions, better performance |
| **File Logging** | ELK Stack | Centralized logging, analytics |
| **Manual Deploy** | Docker + K8s | Container orchestration, scaling |
| **Monolith** | Microservices | Service isolation, independent scaling |

---

**Document Approval**

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Technical Architect | | | |
| Senior Developer | | | |
| DevOps Engineer | | | |
| Security Engineer | | | |

---

*This document serves as the official architecture reference for Phone Book Application v5.3.4 and should be consulted for all technical decisions, implementations, and system modifications.*
