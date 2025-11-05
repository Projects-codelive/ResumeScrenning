const dotenv = require('dotenv');

dotenv.config();

const cors = require('cors');

const express = require('express');

const cookieParser = require('cookie-parser');

const userRoutes = require('./routes/user.route');

const authRoutes = require('./routes/auth.route'); // ✅ Import auth routes

const cvRoutes = require('./routes/cv.route'); // If you have this

const cvHistoryRoutes = require('./routes/cvHistory.route'); // If you have this

const pdfRoutes = require('./routes/pdf.route'); // 🆕 ADD THIS LINE

const roleRoutes = require('./routes/role.route'); // 🆕 ADD THIS LINE FOR ROLE REQUIREMENTS

const session = require('express-session');

const passport = require('./config/passport'); // Import passport config

const connectToDb = require('./db/db');

const learningRoutes = require('./routes/learning.route');

const coverLetterRoutes = require('./routes/coverLetter.route');

const app = express();

// CORS configuration

app.use(cors({

origin: 'http://localhost:5173', // Vite default port

credentials: true,

methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],

allowedHeaders: ['Content-Type', 'Authorization']

}));

// Session middleware (must be before passport)

app.use(session({

secret: process.env.SESSION_SECRET,

resave: false,

saveUninitialized: false,

cookie: {

secure: false, // Set to true in production with HTTPS

maxAge: 24 * 60 * 60 * 1000 // 24 hours

}

}));

// Initialize Passport

app.use(passport.initialize());

app.use(passport.session());

connectToDb();

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

app.get('/', (req, res) => {

res.send('Hello, World!');

});

// ✅ FIXED: Register auth routes WITHOUT /api prefix

app.use('/auth', authRoutes); // ✅ Changed from '/api/auth' to '/auth'

app.use('/users', userRoutes);

app.use('/api/cv', cvRoutes);// This will make /cv/analyze available at /api/cv/analyze

app.use('/api/cv-history', cvHistoryRoutes); // 🆕 ADD THIS LINE (if not already there)

app.use('/api/pdf', pdfRoutes); // 🆕 ADD THIS LINE

app.use('/api', roleRoutes); // 🆕 ADD THIS LINE FOR ROLE REQUIREMENTS

app.use('/api/learning', learningRoutes);

app.use('/api/cover-letter', coverLetterRoutes);

// 🆕 ADD THESE DEBUG LINES

console.log('✅ PDF routes registered at /api/pdf');

console.log('✅ Role routes registered at /api');

module.exports = app;
