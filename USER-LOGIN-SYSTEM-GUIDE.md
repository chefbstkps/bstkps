# User Login System – Reusable Architecture Guide

This document explains how the user login system works in this webapp so you can replicate the same structure in another project.

---

## Overview

The system uses **custom authentication** (not Supabase Auth). It stores users in a PostgreSQL `app_users` table, hashes passwords with database functions, and keeps the session in **localStorage** on the client. Supabase is used only as the database/backend.

### High-Level Flow

1. User submits username + password on the Login page.
2. `AuthService.login()` checks credentials against `app_users` and verifies the password hash.
3. On success, user data is saved in React state and localStorage.
4. `AuthContext` exposes `signIn`, `signOut`, `user`, and role helpers.
5. `ProtectedRoute` guards routes and redirects unauthenticated users to `/login`.

---

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Login Page    │────▶│   AuthContext    │────▶│  AuthService    │
│  (username/pwd) │     │ (state, signIn)  │     │ (login, logout) │
└─────────────────┘     └──────────────────┘     └────────┬────────┘
                                │                         │
                                │                         ▼
                                │                 ┌─────────────────┐
                                │                 │    Supabase     │
                                │                 │ app_users table │
                                │                 │ verify_password │
                                │                 └─────────────────┘
                                ▼
                        ┌──────────────────┐
                        │ ProtectedRoute   │
                        │ (guards routes)  │
                        └──────────────────┘
```

---

## 1. Database Schema

### Core Tables

**`app_users`**

| Column            | Type      | Description                          |
|-------------------|-----------|--------------------------------------|
| id                | UUID      | Primary key                          |
| username          | TEXT      | Unique, used for login               |
| email             | TEXT      | Unique                               |
| password_hash     | TEXT      | Hashed password                      |
| first_name        | TEXT      |                                      |
| last_name         | TEXT      |                                      |
| role              | TEXT      | `admin`, `super_user`, or `user`     |
| is_active         | BOOLEAN   | Default `true`                       |
| must_change_password | BOOLEAN | Default `true`                      |
| last_login        | TIMESTAMP | Updated on login                     |
| created_at        | TIMESTAMP |                                      |
| updated_at        | TIMESTAMP |                                      |

**`user_activity_logs`**

| Column        | Type      | Description                              |
|---------------|-----------|------------------------------------------|
| id            | UUID      | Primary key                              |
| user_id       | UUID      | FK to `app_users`                        |
| activity_type | TEXT      | `login`, `logout`, `password_change`, `profile_update` |
| success       | BOOLEAN   | Whether the activity succeeded           |
| error_message | TEXT      | Optional error details                   |
| created_at    | TIMESTAMP |                                          |

### Password Functions

```sql
-- Hash password (use bcrypt in production; this is SHA256 + salt for simplicity)
CREATE OR REPLACE FUNCTION hash_password(password TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN encode(digest(password || 'salt', 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Verify password
CREATE OR REPLACE FUNCTION verify_password(password TEXT, hash TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN hash_password(password) = hash;
END;
$$ LANGUAGE plpgsql;
```

> **Security note:** For production, use bcrypt or argon2 instead of SHA256. You’d replace these functions with equivalent bcrypt equivalents.

See `database/auth-system-simple.sql` in this project for a full SQL script.

---

## 2. TypeScript Types

```typescript
export interface AppUser {
  id: string
  username: string
  email: string
  first_name: string
  last_name: string
  role: 'admin' | 'super_user' | 'user'
  is_active: boolean
  must_change_password: boolean
  last_login?: string
  created_at: string
  updated_at: string
}

export interface LoginCredentials {
  username: string
  password: string
}

export interface CreateUserData {
  username: string
  email: string
  first_name: string
  last_name: string
  password: string
  role: 'admin' | 'super_user' | 'user'
}
```

---

## 3. AuthService (`src/services/authService.ts`)

Central service for auth operations. Main methods:

| Method | Description |
|--------|-------------|
| `login(credentials)` | Validates credentials, returns `AppUser` or throws |
| `logout(userId)` | Logs logout activity |
| `getCurrentUser(userId)` | Fetches user by ID |
| `createUser(userData)` | Creates user (admin) |
| `changePassword(userId, data)` | User changes own password |
| `resetPassword(data)` | Admin resets user password |
| `logActivity(userId, type, success, error?)` | Writes to `user_activity_logs` |

### Login Flow (Pseudocode)

```
1. Fetch all users from app_users (or query by username)
2. Find user where username matches (case-insensitive) and is_active = true
3. Call supabase.rpc('verify_password', { password, hash: user.password_hash })
4. If valid:
   - Optional: check device approval (device-specific feature)
   - Update last_login
   - Log activity
   - Return user object
5. If invalid: throw error
```

---

## 4. AuthContext (`src/contexts/AuthContext.tsx`)

React context that holds auth state and methods.

### State

- `user: AppUser | null`
- `loading: boolean` (initial load from localStorage)

### Methods

- `signIn(credentials)` – Calls `AuthService.login`, stores user in state and localStorage
- `signOut()` – Calls `AuthService.logout`, clears user and localStorage
- `refreshUser()` – Re-fetches current user and updates state
- `isAdmin()`, `isSuperUser()`, `isSuperUserOrAdmin()` – Role checks

### Session Storage

User is persisted in `localStorage` under a key (e.g. `estbbq_user`). On app load, the context reads from localStorage to restore the session.

```typescript
// Storage key – change for your app
const STORAGE_KEY = 'your_app_user'

// On init
const storedUser = localStorage.getItem(STORAGE_KEY)
if (storedUser) setUser(JSON.parse(storedUser))

// On signIn
localStorage.setItem(STORAGE_KEY, JSON.stringify(userData))

// On signOut
localStorage.removeItem(STORAGE_KEY)
```

---

## 5. ProtectedRoute (`src/components/ProtectedRoute.tsx`)

Wraps routes that require authentication.

### Logic

1. Show loading while auth state is initializing.
2. If not authenticated → redirect to `/login`.
3. If `requireAdmin` and user is not admin → redirect (e.g. to `/`).
4. Optional: restrict super users from certain paths.
5. Otherwise render children.

### Usage

```tsx
<Route path="/dashboard" element={
  <ProtectedRoute>
    <Dashboard />
  </ProtectedRoute>
} />

<Route path="/admin" element={
  <ProtectedRoute requireAdmin>
    <AdminPanel />
  </ProtectedRoute>
} />
```

---

## 6. Login Page

Basic structure:

- Form: username + password
- `handleSubmit` → `signIn({ username, password })`
- Show error message on failure
- If already authenticated, redirect to home
- Optional: show/hide password toggle

---

## 7. My Profile (`src/pages/Profile.tsx`)

Allows authenticated users to view and update their own account information.

### Features

- **Profile Information tab**
  - View username (read-only)
  - View role (read-only)
  - Edit first name, last name, email
  - View last login time (read-only)
  - Submit updates via `AuthService.updateUser(user.id, profileData)`
  - Call `refreshUser()` after successful update to sync AuthContext

- **Change Password tab**
  - Current password (for verification)
  - New password and confirm password
  - Submit via `AuthService.changePassword(user.id, passwordData)`
  - On success, clears form and shows success message

### AuthService Methods Used

- `AuthService.updateUser(userId, updateData)` – Updates first_name, last_name, email
- `AuthService.changePassword(userId, changePasswordData)` – Verifies current password, hashes and saves new one, logs `password_change` activity

### Types

```typescript
export interface UpdateUserData {
  first_name?: string
  last_name?: string
  email?: string
}

export interface ChangePasswordData {
  current_password: string
  new_password: string
  confirm_password: string
}
```

### Access

- Available to all authenticated users (typically under `/profile`)
- Uses `useAuth()` for `user` and `refreshUser`

---

## 8. User Management (`src/pages/UserManagement.tsx`)

Admin-only page for creating, editing, deleting users and resetting passwords.

### Features

- **User list** – Table of all users (username, name, role, status, last login)
- **Create user** – Modal form with username, email, first name, last name, password, role; optional staff linking
- **Edit user** – Modal to update first name, last name, email, role, is_active, staff link
- **Reset password** – Admin sets new password for any user; sets `must_change_password: true`
- **Delete user** – Confirmation dialog; removes user from `app_users`

### AuthService Methods Used

- `AuthService.getAllUsers()` – Fetch all users
- `AuthService.createUser(createData)` – Creates user with hashed password
- `AuthService.updateUser(userId, editData)` – Updates user fields
- `AuthService.deleteUser(userId)` – Deletes user
- `AuthService.resetPassword({ user_id, new_password })` – Admin resets password

### Access Control

- **Admin only** – Page checks `isAdmin()`; non-admins see "Access Denied"

### Optional: Staff Linking

- `staff_id` on `app_users` links to a `staff` table (for clock-in, HR features)
- Create/Edit forms can include a dropdown to link user to a staff member

### Route

- Typically `/user-management`
- Wrap with `ProtectedRoute requireAdmin` or check `isAdmin()` inside the page

---

## 9. Users Activity Log (`src/pages/UsersLog.tsx`)

Admin-only page that displays audit logs from `user_activity_logs`.

### Features

- **Activity table** – Time, user, activity type, success/failure, IP address, details (error_message, user_agent)
- **Filters**
  - Activity type: login, logout, password_change, profile_update
  - Date range: from date, to date
  - Optional: filter by user
- **Stats** – Total logs, successful count, failed count
- **Refresh** – Reload logs from database

### AuthService Method Used

- `AuthService.getUserActivityLogs()` – Fetches all logs with user info joined; no `userId` argument returns all logs (admin view)

```typescript
// Admin view – all logs
const logs = await AuthService.getUserActivityLogs()

// User view – own logs only
const logs = await AuthService.getUserActivityLogs(user.id)
```

### Activity Types

| Type             | Description                        |
|------------------|------------------------------------|
| `login`          | User logged in                     |
| `logout`         | User logged out                    |
| `password_change`| User changed or admin reset password |
| `profile_update` | User updated profile               |

### Access Control

- **Admin only** – Page checks `isAdmin()`; non-admins see "Access Denied"

### Route

- Typically `/users-log`

---

## 10. App Setup

1. Wrap the app in `AuthProvider`:

```tsx
<AuthProvider>
  <Router>
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/*" element={
        <ProtectedRoute>
          {/* Your app content */}
        </ProtectedRoute>
      } />
    </Routes>
  </Router>
</AuthProvider>
```

2. Use `useAuth()` in components:

```tsx
const { user, signIn, signOut, isAuthenticated, isAdmin } = useAuth()
```

---

## 11. Checklist for Reuse in Another Webapp

### Database

- [ ] Create `app_users` table
- [ ] Create `user_activity_logs` table
- [ ] Add `hash_password` and `verify_password` functions
- [ ] Insert initial admin user
- [ ] Adjust RLS policies if needed
- [ ] Consider bcrypt/argon2 for passwords in production

### Frontend

- [ ] Copy `AuthService` and point to your Supabase client
- [ ] Copy `AuthContext` and change localStorage key
- [ ] Copy `ProtectedRoute` and adjust roles/redirects
- [ ] Copy or adapt `Login` page
- [ ] Copy or adapt `Profile` page (My Profile)
- [ ] Copy or adapt `UserManagement` page (admin only)
- [ ] Copy or adapt `UsersLog` page (admin only)
- [ ] Add types for `AppUser`, `LoginCredentials`, etc.
- [ ] Wrap app with `AuthProvider` and configure routes

### Customization

- [ ] Change storage key (`estbbq_user` → `your_app_user`)
- [ ] Add/remove roles (`admin`, `super_user`, `user`)
- [ ] Add or remove device approval (optional)
- [ ] Add `staff_id` or other FK fields if needed

---

## 12. Optional Features (This Project)

- **Device approval:** Admins must approve new devices before non-admin users can log in. Implemented in `DeviceService` and used inside `AuthService.login`.
- **Super user role:** Extra role with limited admin-like access; restricted from some admin-only routes.
- **Staff linking:** `staff_id` on `app_users` links to a `staff` table for HR/shift features.

These can be omitted in a simpler implementation.

---

## 13. File Reference

| File | Purpose |
|------|---------|
| `src/services/authService.ts` | Login, logout, user CRUD, activity logging |
| `src/contexts/AuthContext.tsx` | Auth state, signIn, signOut, role helpers |
| `src/components/ProtectedRoute.tsx` | Route protection |
| `src/pages/Login.tsx` | Login form |
| `src/pages/Profile.tsx` | My Profile – edit profile, change password |
| `src/pages/UserManagement.tsx` | User Management – admin CRUD, reset password |
| `src/pages/UsersLog.tsx` | Users Activity Log – admin audit log viewer |
| `src/types/index.ts` | `AppUser`, `LoginCredentials`, etc. |
| `database/auth-system-simple.sql` | SQL for tables and functions |
