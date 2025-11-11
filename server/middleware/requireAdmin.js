// File: server/middleware/requireAdmin.js (Updated)

module.exports = (req, res, next) => {
    // 1. Check if user is logged in
    if (!req.user) {
        return res.status(401).send({ message: 'You must be logged in.' });
    }

    // 2. Get the list of admin IDs from the .env file
    //
    //    *** THIS IS THE FIX: ***
    //    We split by comma, then 'map' over the array
    //    and 'trim()' any hidden spaces from each ID.
    //
    const adminIds = process.env.ADMIN_GOOGLE_IDS.split(',').map(id => id.trim());

    // 3. Check if the logged-in user's ID is IN the admin list
    if (!adminIds.includes(req.user.googleId)) {
        return res.status(403).send({ message: 'You are not authorized.' });
    }

    // If both checks pass, continue
    next();
};