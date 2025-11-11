// File: server.js (Updated)
require('dotenv').config();
const express = require('express');
const cookieSession = require('cookie-session');
const passport = require('passport');

// --- 1. SET UP YOUR "APP" ---
const app = express();
const PORT = process.env.PORT || 3000;

// --- 2. "PLUG IN" LOGIN CONFIG ---
// (We require db.js here just to make sure it runs and connects)
require('./server/db'); 
require('./server/services/passport'); // Passport now uses SQL

// --- 3. MIDDLEWARE (The "Proper" Order) ---
app.use(express.json()); 
app.use(express.static('public'));

app.use(
    cookieSession({
        maxAge: 30 * 24 * 60 * 60 * 1000, 
        keys: [process.env.COOKIE_KEY] 
    })
);

app.use(passport.initialize());
app.use(passport.session());

// Passport-session fix middleware
app.use(function(req, res, next) {
    if (req.session && !req.session.regenerate) {
        req.session.regenerate = (cb) => { cb(); };
    }
    if (req.session && !req.session.save) {
        req.session.save = (cb) => { cb(); };
    }
    next();
});

// --- 4. "PLUG IN" YOUR API ROUTES ---
const apiRoutes = require('./server/routes/apiRoutes');
const authRoutes = require('./server/routes/authRoutes');

app.use(apiRoutes);
app.use(authRoutes);

// --- 5. START THE SERVER ---
app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});