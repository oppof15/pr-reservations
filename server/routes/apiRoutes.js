// File: server/routes/apiRoutes.js (Updated for SQL)

const express = require('express');
const db = require('../db'); // Import our SQL pool
const requireAdmin = require('../middleware/requireAdmin');

const router = express.Router();

// --- 1. TRIP SEARCH ROUTE ---
router.get('/api/trips/search', async (req, res) => {
    try {
        const { origin, destination, date } = req.query;

        // Start building the query
        let sql = 'SELECT * FROM trips WHERE 1=1';
        let params = [];

        // Add case-insensitive search
        if (origin) {
            sql += ' AND LOWER(origin) = ?';
            params.push(origin.toLowerCase());
        }
        if (destination) {
            sql += ' AND LOWER(destination) = ?';
            params.push(destination.toLowerCase());
        }

        // Add date logic
        if (date) {
            const startDate = new Date(date);
            startDate.setHours(0, 0, 0, 0); 
            const endDate = new Date(date);
            endDate.setHours(23, 59, 59, 999);

            sql += ' AND departureTime >= ? AND departureTime <= ?';
            params.push(startDate, endDate);
        }

        const [trips] = await db.query(sql, params);
        res.json(trips);

    } catch (err) {
        console.error('Error in /api/trips/search:', err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// --- 2. GET SINGLE TRIP ROUTE ---
router.get('/api/trips/:id', async (req, res) => {
    try {
        const [trips] = await db.query('SELECT * FROM trips WHERE id = ?', [req.params.id]);
        if (trips.length === 0) {
            return res.status(404).json({ message: 'Trip not found' });
        }
        
        // De-serialize the bookedSeats JSON string
        const trip = trips[0];
        trip.bookedSeats = JSON.parse(trip.bookedSeats || '[]'); 
        
        res.json(trip);
    } catch (err) {
        console.error('Error in /api/trips/:id:', err);
        res.status(500).json({ message: 'Server Error' });
    }
});


// --- 3. GET MY BOOKINGS ROUTE ---
router.get('/api/bookings/my-bookings', async (req, res) => {
    if (!req.user) {
        return res.status(401).send({ message: 'You must be logged in.' });
    }

    try {
        // This is a SQL JOIN to replace Mongoose 'populate'
        const sql = `
            SELECT 
                b.id, b.bookingTime, b.selectedSeats, b.totalPrice,
                t.id AS tripId, t.busName, t.origin, t.destination, t.departureTime
            FROM bookings b
            JOIN trips t ON b.tripId = t.id
            WHERE b.userId = ?
        `;
        
        const [bookings] = await db.query(sql, [req.user.id]);
        
        // De-serialize selectedSeats and re-format to match old structure
        const formattedBookings = bookings.map(b => ({
            _id: b.id,
            bookingTime: b.bookingTime,
            selectedSeats: JSON.parse(b.selectedSeats || '[]'),
            totalPrice: b.totalPrice,
            _trip: { // Re-create the populated _trip object
                _id: b.tripId,
                busName: b.busName,
                origin: b.origin,
                destination: b.destination,
                departureTime: b.departureTime
            }
        }));

        res.json(formattedBookings);

    } catch (err) {
        console.error('Error fetching bookings:', err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// --- 4. CREATE BOOKING ROUTE ---
router.post('/api/bookings/book', async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: 'You must be logged in to book.' });
    }
    
    // We will use a connection to handle this "transaction"
    let connection;
    try {
        const { tripId, selectedSeats, totalPrice } = req.body;
        
        connection = await db.getConnection(); // Get a connection from the pool
        await connection.beginTransaction();  // Start a transaction

        // 1. Get the trip and lock the row for update
        const [trips] = await connection.query(
            'SELECT bookedSeats FROM trips WHERE id = ? FOR UPDATE', 
            [tripId]
        );
        
        if (trips.length === 0) {
            throw new Error('Trip not found.');
        }

        // 2. Check seat availability
        const currentBookedSeats = JSON.parse(trips[0].bookedSeats || '[]');
        const isSeatTaken = selectedSeats.some(seat => currentBookedSeats.includes(seat));
        
        if (isSeatTaken) {
            throw new Error('Sorry, one or more seats were just booked.');
        }

        // 3. Create the new booking
        const newBooking = {
            userId: req.user.id,
            tripId: tripId,
            selectedSeats: JSON.stringify(selectedSeats), // Store as JSON string
            totalPrice: totalPrice
        };
        const [bookingResult] = await connection.query(
            'INSERT INTO bookings (userId, tripId, selectedSeats, totalPrice) VALUES (?, ?, ?, ?)',
            [newBooking.userId, newBooking.tripId, newBooking.selectedSeats, newBooking.totalPrice]
        );

        // 4. Update the trip's bookedSeats
        const updatedBookedSeats = JSON.stringify([...currentBookedSeats, ...selectedSeats]);
        await connection.query(
            'UPDATE trips SET bookedSeats = ? WHERE id = ?',
            [updatedBookedSeats, tripId]
        );

        // 5. If all good, commit the transaction
        await connection.commit();
        
        res.status(201).json({ id: bookingResult.insertId, ...newBooking });

    } catch (err) {
        // 6. If anything failed, roll back
        if (connection) await connection.rollback();
        
        console.error('Booking Error:', err);
        res.status(500).json({ message: err.message || 'Server error during booking.' });
    } finally {
        // 7. Always release the connection
        if (connection) connection.release();
    }
});

// --- 5. ADMIN: CREATE A NEW TRIP ---
router.post('/api/trips', requireAdmin, async (req, res) => {
    try {
        const { busName, origin, destination, departureTime, arrivalTime, price, totalSeats } = req.body;
        
        const newTrip = {
            busName, origin, destination, departureTime, arrivalTime, price, totalSeats,
            bookedSeats: JSON.stringify([]) // Start with empty array
        };

        const [result] = await db.query(
            'INSERT INTO trips (busName, origin, destination, departureTime, arrivalTime, price, totalSeats, bookedSeats) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [...Object.values(newTrip)]
        );

        res.status(201).json({ id: result.insertId, ...newTrip });
    
    } catch (err) {
        console.error('Error creating trip:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// --- 6. ADMIN: DELETE A TRIP ---
router.delete('/api/trips/:id', requireAdmin, async (req, res) => {
    try {
        // We should also delete bookings for this trip
        await db.query('DELETE FROM bookings WHERE tripId = ?', [req.params.id]);
        await db.query('DELETE FROM trips WHERE id = ?', [req.params.id]);
        
        res.json({ message: 'Trip and associated bookings deleted' });
    
    } catch (err) {
        console.error('Error deleting trip:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// --- 7. ADMIN: CHECK AUTH STATUS ---
router.get('/api/admin/check', requireAdmin, (req, res) => {
    res.json({ message: 'Success, you are an admin.' });
});

module.exports = router;