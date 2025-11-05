# Resume Builder API Documentation

## Base URL
```
http://localhost:4000
```

## Authentication & User Management

## Endpoint: Register

### 1. Register with Email/Password

**POST** `/users/register`

Registers a new user in the system using email and password. Returns an authentication token upon successful registration.

#### Request Body

The request body must be a JSON object with the following structure:

```
{
  "fullname": {
    "firstname": "string (min 3 chars, required)",
    "lastname": "string (min 3 chars, optional)"
  },
  "email": "string (valid email, min 5 chars, required)",
  "password": "string (min 6 chars, must contain at least 1 capital letter and 1 special character, required)"
}
```

##### Example

```
{
  "fullname": {
    "firstname": "John",
    "lastname": "Doe"
  },
  "email": "john.doe@example.com",
  "password": "securePassword123"
}
```

#### Responses

- **201 Created**: Returns JWT token and user object.
- **400 Bad Request**: Validation errors or user already exists.


## Endpoint: Profile

### 1. Get User Profile

**GET** `/users/profile`

**Description:**
Returns the authenticated user's profile data, including personal info, resume, and account details.

**Authentication:**
- Requires JWT token in cookie or `Authorization` header (Bearer token).

**Headers Example:**
```
Authorization: Bearer <jwt_token>
```
or cookie `token=<jwt_token>`

**Response:**
- **200 OK**
  ```json
  {
    "success": true,
    "user": {
      "_id": "<user_id>",
      "fullname": { "firstname": "John", "lastname": "Doe" },
      "email": "john.doe@example.com",
      "provider": "local|google|github",
      "personalInfo": { ... },
      "experience": [ ... ],
      "education": [ ... ],
      "skills": { ... },
      "projects": [ ... ],
      "certifications": [ ... ],
      "awards": [ ... ],
      "volunteer": [ ... ],
      "interests": [ ... ]
    }
  }
  ```
- **404 Not Found**
  ```json
  { "message": "User not found" }
  ```
- **401/400**: Invalid or missing token

---

### 2. Update User Profile

**PUT** `/users/profile`

**Description:**
Updates the authenticated user's profile data. Only allowed fields are updated. Password and OAuth IDs cannot be updated here.

**Authentication:**
- Requires JWT token in cookie or `Authorization` header (Bearer token).

**Request Body Example:**
```
{
  "fullname": {
    "firstname": "shyam",
    "lastname": "gupta"
  },
  "profile": {
    "phone": "+1-555-123-4567",
    "address": {
      "street": "123 Main St",
      "city": "New York",
      "state": "NY",
      "zipCode": "10001",
      "country": "USA"
    },
    "linkedIn": "https://linkedin.com/in/shyam",
    "github": "https://github.com/shyam",
    "portfolio": "https://shyam.dev",
    "summary": "Experienced full-stack developer with 5+ years in web development, specializing in React, Node.js, and cloud technologies."
  },
  "experience": [
    {
      "company": "Tech Solutions Inc",
      "position": "Senior Full Stack Developer",
      "startDate": "2022-01-15",
      "endDate": null,
      "isCurrentJob": true,
      "location": "New York, NY",
      "description": "Led development of enterprise web applications using React and Node.js",
      "responsibilities": [
        "Developed and maintained 5+ web applications",
        "Led a team of 3 junior developers",
        "Implemented CI/CD pipelines"
      ],
      "achievements": [
        "Improved application performance by 40%",
        "Reduced deployment time by 60%"
      ]
    },
    {
      "company": "StartupXYZ",
      "position": "Frontend Developer",
      "startDate": "2020-06-01",
      "endDate": "2021-12-31",
      "isCurrentJob": false,
      "location": "San Francisco, CA",
      "description": "Developed responsive web interfaces for e-commerce platform",
      "responsibilities": [
        "Built responsive UI components",
        "Optimized web performance",
        "Collaborated with design team"
      ],
      "achievements": [
        "Increased conversion rate by 25%",
        "Reduced page load time by 50%"
      ]
    }
  ],
  "education": [
    {
      "institution": "University of Technology",
      "degree": "Bachelor of Science",
      "fieldOfStudy": "Computer Science",
      "startDate": "2016-09-01",
      "endDate": "2020-05-15",
      "gpa": 3.8,
      "location": "Boston, MA",
      "description": "Focused on software engineering and web technologies"
    }
  ],
  "skills": {
    "technical": [
      "JavaScript",
      "React.js",
      "Node.js",
      "MongoDB",
      "PostgreSQL",
      "Docker",
      "AWS",
      "Git"
    ],
    "soft": [
      "Team Leadership",
      "Problem Solving",
      "Communication",
      "Project Management"
    ],
    "languages": [
      {
        "language": "English",
        "proficiency": "Native"
      },
      {
        "language": "Spanish",
        "proficiency": "Intermediate"
      }
    ]
  },
  "projects": [
    {
      "title": "E-commerce Platform",
      "description": "Full-stack e-commerce solution with React frontend and Node.js backend",
      "technologies": ["React", "Node.js", "MongoDB", "Stripe API"],
      "startDate": "2023-03-01",
      "endDate": "2023-08-15",
      "projectUrl": "https://myecommerce.com",
      "githubUrl": "https://github.com/johnsmith/ecommerce-platform",
      "images": [
        "https://example.com/project1-img1.jpg",
        "https://example.com/project1-img2.jpg"
      ]
    },
    {
      "title": "Task Management App",
      "description": "Real-time collaborative task management application",
      "technologies": ["Vue.js", "Express.js", "Socket.io", "MySQL"],
      "startDate": "2022-11-01",
      "endDate": "2023-01-30",
      "projectUrl": "https://taskmanager.com",
      "githubUrl": "https://github.com/johnsmith/task-manager"
    }
  ],
  "certifications": [
    {
      "name": "AWS Certified Developer",
      "issuer": "Amazon Web Services",
      "issueDate": "2023-05-15",
      "expiryDate": "2026-05-15",
      "credentialId": "AWS-DEV-12345",
      "credentialUrl": "https://aws.amazon.com/verification/AWS-DEV-12345"
    },
    {
      "name": "MongoDB Certified Developer",
      "issuer": "MongoDB Inc",
      "issueDate": "2022-09-20",
      "expiryDate": "2025-09-20",
      "credentialId": "MONGO-12345"
    }
  ],
  "awards": [
    {
      "title": "Best Innovation Award",
      "issuer": "Tech Solutions Inc",
      "date": "2023-12-01",
      "description": "Awarded for developing an innovative automation tool that saved 200+ hours monthly"
    }
  ],
  "volunteer": [
    {
      "organization": "Code for Good",
      "position": "Volunteer Developer",
      "startDate": "2021-06-01",
      "endDate": "2022-05-31",
      "description": "Developed websites for non-profit organizations"
    }
  ],
  "interests": [
    "Open Source Development",
    "Machine Learning",
    "Photography",
    "Hiking"
  ],
  "resumeSettings": {
    "template": "professional",
    "theme": "blue",
    "fontSize": 11,
    "sections": {
      "showSummary": true,
      "showExperience": true,
      "showEducation": true,
      "showSkills": true,
      "showProjects": true,
      "showCertifications": true,
      "showAwards": false,
      "showVolunteer": false,
      "showInterests": true
    }
  }
}

```

**Response:**
- **200 OK**
  ```json
  {
    "success": true,
    "message": "Profile updated successfully",
    "user": { ...updated profile data... }
  }
  ```
- **404 Not Found**
  ```json
  { "message": "User not found" }
  ```
- **401/400**: Invalid or missing token, or invalid data

---

### 2. Continue with Google

**GET** `/users/auth/google`

Redirects the user to Google for authentication. On success, the user is created (if new) and logged in. The backend sets a JWT token cookie and redirects to the frontend profile page.

**Callback:** `/users/auth/google/callback`

**Frontend Flow:**
- User clicks "Continue with Google".
- Frontend opens `/users/auth/google`.
- On success, user is redirected to `/profile?token=...&first_login=true` on the frontend with a JWT token.

---

### 3. Continue with GitHub

**GET** `/users/auth/github`

Redirects the user to GitHub for authentication. On success, the user is created (if new) and logged in. The backend sets a JWT token cookie and redirects to the frontend profile page.

**Callback:** `/users/auth/github/callback`

**Frontend Flow:**
- User clicks "Continue with GitHub".
- Frontend opens `/users/auth/github`.
- On success, user is redirected to `/profile?token=...&first_login=true` on the frontend with a JWT token.

---

## Endpoint: Login

### 1. Login with Email/Password

**POST** `/users/login`

Authenticates an existing user using email and password. Returns a JWT token and user object if credentials are valid.

#### Request Body

The request body must be a JSON object with the following structure:

```
{
  "email": "string (valid email, required)",
  "password": "string (min 6 chars, required)"
}
```

##### Example

```
{
  "email": "shyam.gupta@example.com",
  "password": "securePassword123"
}
```

#### Responses

- **200 OK**: Returns JWT token and user object.
  ```json
  {
    "token": "<jwt_token>",
    "user": {
      "_id": "<user_id>",
      "fullname": {
        "firstname": "shyam",
        "lastname": "gupta"
      },
      "email": "shyamGupta@example.com"
      // ...other user fields
    },
    "redirectTo": "/profile"
  }
  ```
- **400 Bad Request**:
  - Invalid input data (validation errors)
  - User not found
  - Invalid password
  - **Body:**
    ```json
    { "error": [ { "msg": "Error message", ... } ] }
    ```
    or
    ```json
    { "message": "User not found" }
    ```
    or
    ```json
    { "message": "Invalid password" }
    ```

---

### 2. Continue with Google

**GET** `/users/auth/google`

Redirects the user to Google for authentication. On success, the user is logged in (or registered if new). The backend sets a JWT token cookie and redirects to the frontend profile page.

**Callback:** `/users/auth/google/callback`

**Frontend Flow:**
- User clicks "Continue with Google".
- Frontend opens `/users/auth/google`.
- On success, user is redirected to `/profile?token=...&first_login=true` on the frontend with a JWT token.

---

### 3. Continue with GitHub

**GET** `/users/auth/github`

Redirects the user to GitHub for authentication. On success, the user is logged in (or registered if new). The backend sets a JWT token cookie and redirects to the frontend profile page.

**Callback:** `/users/auth/github/callback` 

**Frontend Flow:**
- User clicks "Continue with GitHub".
- Frontend opens `/users/auth/github`.
- On success, user is redirected to `/profile?token=...&first_login=true` on the frontend with a JWT token.

---

## CV Generation Endpoints

### 1. Generate CV PDF

**POST** `/api/pdf/generate-cv-pdf`

Generates a PDF version of the CV based on user profile data and selected template.

**Authentication Required:** Yes (JWT Token)

#### Request Body
```json
{
  "template": {
    "name": "string (required) - One of: professional, creative, modern, minimal, technical",
    "color": "string (optional) - Primary theme color",
    "font": "string (optional) - Primary font family"
  },
  "sections": {
    "showSummary": "boolean (default: true)",
    "showExperience": "boolean (default: true)",
    "showEducation": "boolean (default: true)",
    "showSkills": "boolean (default: true)",
    "showProjects": "boolean (default: true)",
    "showCertifications": "boolean (default: true)",
    "showAwards": "boolean (optional)",
    "showVolunteer": "boolean (optional)",
    "showInterests": "boolean (optional)"
  },
  "formatting": {
    "fontSize": "number (optional, default: 11)",
    "lineSpacing": "number (optional, default: 1.15)",
    "marginSize": "string (optional, default: 'normal')"
  }
}
```

#### Response
- **200 OK**: Returns PDF file
- **400 Bad Request**: Invalid template or formatting options
- **401 Unauthorized**: Invalid/missing token
- **500 Server Error**: PDF generation failed

### 2. Save CV History

**POST** `/api/cv/save`

Saves a generated CV to user's history.

**Authentication Required:** Yes (JWT Token)

#### Request Body
```json
{
  "cvData": {
    "template": "string (required)",
    "sections": "object (required)",
    "formatting": "object (required)"
  },
  "metadata": {
    "title": "string (required)",
    "description": "string (optional)",
    "tags": ["string (optional)"]
  }
}
```

#### Response
- **201 Created**: CV saved successfully
- **400 Bad Request**: Invalid data
- **401 Unauthorized**: Invalid/missing token

### 3. Get CV History

**GET** `/api/cv/history`

Retrieves user's CV generation history.

**Authentication Required:** Yes (JWT Token)

**Query Parameters:**
- page: number (optional, default: 1)
- limit: number (optional, default: 10)
- sort: string (optional, default: 'createdAt')
- order: string (optional, 'asc' or 'desc', default: 'desc')

#### Response
- **200 OK**: Returns CV history
- **401 Unauthorized**: Invalid/missing token

## Cover Letter Endpoints

### 1. Generate Cover Letter

**POST** `/api/cover-letter/generate`

Generates an AI-powered cover letter based on job description and user profile.

**Authentication Required:** Yes (JWT Token)

#### Request Body
```json
{
  "jobDescription": "string (required, min: 100 chars)",
  "company": "string (required)",
  "role": "string (required)",
  "tone": "string (optional) - professional|casual|enthusiastic",
  "highlights": ["string (optional) - Key points to emphasize"],
  "customization": {
    "includeSalary": "boolean (optional)",
    "includeAvailability": "boolean (optional)",
    "emphasizeSkills": ["string (optional)"]
  }
}
```

#### Response
- **200 OK**: Returns generated cover letter
- **400 Bad Request**: Invalid input
- **401 Unauthorized**: Invalid/missing token
- **429 Too Many Requests**: Rate limit exceeded

### 2. Save Cover Letter

**POST** `/api/cover-letter/save`

Saves a generated cover letter.

**Authentication Required:** Yes (JWT Token)

#### Request Body
```json
{
  "content": "string (required)",
  "metadata": {
    "company": "string (required)",
    "role": "string (required)",
    "date": "string (required, ISO format)",
    "tags": ["string (optional)"]
  }
}
```

#### Response
- **201 Created**: Cover letter saved
- **400 Bad Request**: Invalid data
- **401 Unauthorized**: Invalid/missing token

## Learning Resources Endpoints

### 1. Get Course Recommendations

**GET** `/api/learning/recommendations`

Get personalized course recommendations based on skills and career goals.

**Authentication Required:** Yes (JWT Token)

**Query Parameters:**
- skills: string[] (required) - Current skills
- goals: string[] (optional) - Career goals
- difficulty: string (optional) - beginner|intermediate|advanced
- type: string (optional) - video|interactive|reading
- limit: number (optional, default: 10)

#### Response
- **200 OK**: Returns course recommendations
- **400 Bad Request**: Invalid parameters
- **401 Unauthorized**: Invalid/missing token

## Rate Limits

- Authentication endpoints: 5 requests per minute per IP
- CV Generation: 10 requests per hour per user
- Cover Letter Generation: 5 requests per hour per user
- Course Recommendations: 20 requests per hour per user

## General Notes and Requirements

### Authentication
- Passwords must be at least 6 characters with 1 capital letter and 1 special character
- JWT tokens are valid for 24 hours
- Email addresses must be unique and verified
- OAuth tokens are refreshed automatically

### Data Validation
- All dates must be in ISO format
- URLs must be valid and include protocol (http/https)
- File uploads limited to 5MB
- Image formats supported: JPG, PNG, PDF
- Rich text fields support markdown formatting

### Error Handling
All endpoints may return these standard errors:
```json
{
  "error": {
    "code": "string",
    "message": "string",
    "details": "object (optional)"
  }
}
```

### Security Requirements
- All endpoints use HTTPS
- CORS is enabled for frontend domain only
- API requests require API key in headers
- File uploads are virus scanned
- Rate limiting per IP and user
- Input sanitization on all endpoints
