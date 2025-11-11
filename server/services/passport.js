const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const db = require('../db'); // Import our new SQL pool

// 1. Define what to save in the cookie
passport.serializeUser((user, done) => {
    done(null, user.id); // 'user.id' is the primary key from our SQL 'users' table
});

// 2. Define how to find a user from the cookie
passport.deserializeUser(async (id, done) => {
    try {
        const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
        if (rows.length > 0) {
            done(null, rows[0]);
        } else {
            done(new Error('User not found'));
        }
    } catch (err) {
        done(err);
    }
});

// 3. The main Google Login logic
passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: '/auth/google/callback',
            proxy: true
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                // 1. Check if we already have this user
                const [existingUsers] = await db.query(
                    'SELECT * FROM users WHERE googleId = ?', 
                    [profile.id]
                );

                if (existingUsers.length > 0) {
                    // 2. If we do, we're done.
                    console.log('User already exists:', existingUsers[0]);
                    return done(null, existingUsers[0]);
                }

                // 3. If we don't, create a new user
                const newUser = {
                    googleId: profile.id,
                    name: profile.displayName,
                    email: profile.emails[0].value
                };

                const [result] = await db.query(
                    'INSERT INTO users (googleId, name, email) VALUES (?, ?, ?)',
                    [newUser.googleId, newUser.name, newUser.email]
                );
                
                // Fetch the user we just created to get the 'id'
                const [createdUserRows] = await db.query(
                    'SELECT * FROM users WHERE id = ?',
                    [result.insertId]
                );
                
                console.log('New user created:', createdUserRows[0]);
                done(null, createdUserRows[0]);

            } catch (err) {
                done(err);
            }
        }
    )
);