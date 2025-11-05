# Resume Builder Frontend Documentation

## Tech Stack
- React + Vite
- Context API for state management
- React Router v6 for routing
- Tailwind CSS for styling
- Axios for API calls

## Getting Started

### Installation
```bash
npm install
npm run dev
```

The application will run on `http://localhost:5173` by default.

## Routes and Components Documentation

### 1. Home Page
**Route:** `/`
**Component:** `Pages/Home.jsx`

Landing page with features overview and getting started section.

**Key Features:**
- Introduction to resume builder
- Feature highlights
- Call-to-action buttons
- Testimonials section

### 2. Authentication Routes

#### Register
**Route:** `/register`
**Component:** `Pages/Register.jsx`

User registration page with form validation.

**Required Fields:**
```javascript
{
  fullname: {
    firstname: string, // min 3 chars
    lastname: string  // optional
  },
  email: string,    // valid email format
  password: string  // min 6 chars, 1 capital letter, 1 special char
}
```

**Features:**
- Form validation
- Password strength indicator
- OAuth options (Google, GitHub)
- Email verification link generation

#### Login
**Route:** `/login`
**Component:** `Pages/Login.jsx`

User login page with authentication options.

**Required Fields:**
```javascript
{
  email: string,    // valid email
  password: string  // min 6 chars
}
```

**Features:**
- Remember me option
- Forgot password link
- OAuth login options
- Error handling display

#### Email Verification
**Route:** `/verify-email/:token`
**Component:** `components/EmailVerification.jsx`

Email verification page after registration.

**URL Parameters:**
- token: JWT verification token

#### Password Reset
**Route:** `/reset-password/:token`
**Component:** `components/PasswordResetVerification.jsx`

Password reset page with validation.

**Required Fields:**
```javascript
{
  newPassword: string,     // min 6 chars, 1 capital, 1 special
  confirmPassword: string  // must match newPassword
}
```

### 3. Dashboard
**Route:** `/dashboard`
**Component:** `Pages/Dashboard.jsx`
**Protection:** Requires Authentication

Main user dashboard with resume management.

**Features:**
- Resume templates gallery
- Recent resumes list
- Quick actions menu
- Profile completion status
- Template recommendations

### 4. Profile Management
**Route:** `/profile`
**Component:** `Pages/Profile.jsx`
**Protection:** Requires Authentication

User profile management page.

**Profile Sections:**
```javascript
{
  personalInfo: {
    phone: string,      // optional, valid format
    address: {
      street: string,   // optional
      city: string,     // optional
      state: string,    // optional
      zipCode: string,  // optional
      country: string   // optional
    },
    socialLinks: {
      linkedin: string, // optional, valid URL
      github: string,   // optional, valid URL
      portfolio: string // optional, valid URL
    }
  },
  experience: [{
    company: string,      // required
    position: string,     // required
    startDate: Date,      // required
    endDate: Date,        // optional if current job
    isCurrentJob: boolean,
    description: string,  // required
    responsibilities: string[],
    achievements: string[]
  }],
  education: [{
    institution: string,  // required
    degree: string,       // required
    fieldOfStudy: string, // required
    startDate: Date,      // required
    endDate: Date,        // required
    gpa: number,          // optional, 0-4 or 0-10
    description: string   // optional
  }],
  skills: {
    technical: string[],
    soft: string[],
    languages: [{
      language: string,
      proficiency: "Beginner" | "Intermediate" | "Advanced" | "Native"
    }]
  }
}
```

### 5. Resume Builder
**Route:** `/builder`
**Component:** `Pages/Builder.jsx`
**Protection:** Requires Authentication

Interactive resume builder interface.

**Features:**
- Real-time preview
- Template switching
- Section management
- Format controls
- Export options (PDF, DOCX)

**Template Options:**
- Professional
- Creative
- Modern
- Minimal
- Technical

**Customization Options:**
```javascript
{
  template: string,    // template name
  theme: {
    primary: string,   // color code
    secondary: string, // color code
    font: string      // font family
  },
  sections: {         // section visibility
    showSummary: boolean,
    showExperience: boolean,
    showEducation: boolean,
    showSkills: boolean,
    showProjects: boolean,
    showCertifications: boolean,
    showAwards: boolean,
    showVolunteer: boolean,
    showInterests: boolean
  }
}
```

### 6. Cover Letter Generator
**Route:** `/cover-letter`
**Component:** `components/CoverLetterGenerator.jsx`
**Protection:** Requires Authentication

AI-powered cover letter generation tool.

**Required Fields:**
```javascript
{
  jobDescription: string,  // min 100 chars
  company: string,        // required
  role: string,          // required
  tone: "professional" | "casual" | "enthusiastic",
  highlights: string[],   // optional key points
  customization: {
    includeSalary: boolean,
    includeAvailability: boolean,
    emphasizeSkills: string[]
  }
}
```

### 7. History
**Route:** `/history`
**Component:** `Pages/History.jsx`
**Protection:** Requires Authentication

Resume and cover letter history management.

**Features:**
- List of generated resumes
- Cover letter history
- Duplicate functionality
- Delete options
- Export capabilities

### 8. CV History Detail
**Route:** `/history/:id`
**Component:** `Pages/CVHistoryDetail.jsx`
**Protection:** Requires Authentication

Detailed view of a specific resume version.

**URL Parameters:**
- id: Resume history ID

## Component Documentation

### Protected Route
**Component:** `components/ProtectedRoute.jsx`

Handles authentication protection for routes.

**Props:**
```javascript
{
  children: ReactNode,
  requireAuth: boolean,
  redirectTo: string
}
```

### Navbar
**Component:** `components/Navbar.jsx`

Main navigation component.

**Features:**
- Responsive design
- Dynamic menu based on auth state
- Profile dropdown
- Notifications

### OAuth Buttons
**Component:** `components/OAuthButtons.jsx`

Social login buttons component.

**Props:**
```javascript
{
  onSuccess: function,
  onError: function,
  providers: string[]
}
```

## Context

### Auth Context
**File:** `Context/AuthContext.jsx`

Manages authentication state throughout the application.

**Provided Values:**
```javascript
{
  user: object | null,
  isAuthenticated: boolean,
  login: function,
  logout: function,
  register: function,
  updateUser: function
}
```

## API Integration

All API calls are handled through the `services/api.jsx` file using Axios.

**Base Configuration:**
```javascript
{
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json'
  }
}
```

## Error Handling

Global error handling through custom hooks and components:
- Network errors
- Authentication errors
- Validation errors
- Server errors

## Environment Variables
Required environment variables in `.env`:
```
VITE_API_URL=http://localhost:4000
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_GITHUB_CLIENT_ID=your_github_client_id
```

## Build and Deployment

```bash
# Development
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

## Browser Support
- Chrome (last 2 versions)
- Firefox (last 2 versions)
- Safari (last 2 versions)
- Edge (last 2 versions)
