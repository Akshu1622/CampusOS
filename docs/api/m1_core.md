# M1 Core Platform API Documentation

Base Path: `/api/v1`

All responses are mapped to standard HTTP status codes, and exceptions are formatted as:
```json
{
  "code": "ERROR_CODE",
  "message": "Human readable message",
  "field_errors": [],
  "request_id": null
}
```

## Authentication

### `POST /auth/login`
**Roles:** None
**Request:** `OAuth2PasswordRequestForm` (`username`, `password`)
**Response:** `{"access_token": "jwt", "token_type": "bearer", "refresh_token": "jwt"}`
**Errors:** 401 UNAUTHORIZED, 403 ACCOUNT_LOCKED, 403 FORBIDDEN

### `POST /auth/refresh`
**Roles:** None
**Request:** `{"refresh_token": "jwt"}`
**Response:** `{"access_token": "jwt", "token_type": "bearer", "refresh_token": "jwt"}`
**Errors:** 401 UNAUTHORIZED

### `POST /auth/logout`
**Roles:** None
**Request:** `{"refresh_token": "jwt"}`
**Response:** `204 No Content`

## Users

### `GET /me`
**Roles:** Any Authenticated
**Response:** `UserResponse`
**Description:** Get current logged-in user details.

### `PUT /me/change-password`
**Roles:** Any Authenticated
**Request:** `{"old_password": "...", "new_password": "..."}`
**Response:** `204 No Content`

### `GET /users`
**Roles:** ADMIN, SUPERADMIN
**Request:** `?page=1&page_size=20`
**Response:** `PaginatedUsers`

### `POST /users`
**Roles:** ADMIN, SUPERADMIN
**Request:** `UserCreateRequest`
**Response:** `UserResponse`

### `GET /users/{id}`
**Roles:** ADMIN, SUPERADMIN, or Owner
**Response:** `UserResponse`

### `PUT /users/{id}/status`
**Roles:** ADMIN, SUPERADMIN
**Request:** `{"status": "ACTIVE|DEACTIVATED|REVOKED"}`
**Response:** `204 No Content`

### `POST /users/{id}/reset-password`
**Roles:** ADMIN, SUPERADMIN
**Request:** `{"new_password": "..."}`
**Response:** `204 No Content`

### `PUT /users/{id}/roles`
**Roles:** SUPERADMIN
**Request:** `{"roles": ["ADMIN"]}`
**Response:** `204 No Content`

## Roles

### `GET /roles`
**Roles:** ADMIN, SUPERADMIN
**Response:** `List[RoleResponse]`

## Catalog

### `GET /departments`
**Roles:** Any Authenticated
**Response:** `List[DepartmentResponse]`

### `GET /programs`
**Roles:** Any Authenticated
**Response:** `List[ProgramResponse]`

### `GET /terms`
**Roles:** Any Authenticated
**Response:** `List[TermResponse]`

## Students

### `GET /students`
**Roles:** ADMIN, FACULTY, HR
**Request:** `?page=1&page_size=20`
**Response:** `PaginatedStudents`

### `POST /students`
**Roles:** ADMIN
**Request:** `StudentCreateRequest`
**Response:** `StudentResponse`
**Description:** Automatically generates a global student ID using `fn_generate_student_id`.
