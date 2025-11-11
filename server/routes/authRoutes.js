// File: server/routes/authRoutes.js

const express = require('express');
const passport = require('passport');
const router = express.Router();

// --- 1. The "Login" Route ---
// When user clicks "Login with Google", it calls this
router.get(
    '/auth/google',
    passport.authenticate('google', {
        scope: ['profile', 'email'] // Ask Google for profile and email
    })
);

// --- 2. The "Callback" Route ---
// Google redirects the user here after they approve the login
router.get(
    '/auth/google/callback',
    passport.authenticate('google'), // Complete the login
    (req, res) => {
        // Login successful! Redirect them to the frontend
        // We'll create a 'bookings.html' page later
        res.redirect('/bookings.html'); 
    }
);

// --- 3. The "Get Current User" API Route ---
// Your frontend JS will call this to see if user is logged in
router.get('/api/current_user', (req, res) => {
    res.send(req.user); // 'req.user' is added by Passport
});

// --- 4. The "Logout" Route ---
router.get('/api/logout', (req, res, next) => {
    req.logout(function(err) { // Pass a callback function
        if (err) { 
            return next(err); // Handle any potential errors
        }
        // Redirect after the logout is complete
        res.redirect('/'); 
    });
});
module.exports = router;