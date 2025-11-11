// File: public/js/bookings.js

document.addEventListener('DOMContentLoaded', () => {
    const userInfoContainer = document.getElementById('user-info');
    const bookingsList = document.getElementById('bookings-list');

    // --- 1. Fetch the Current User ---
   async function fetchUser() {
    const navLinksContainer = document.getElementById('nav-links-container');
    try {
        const res = await fetch('/api/current_user');
        if (!res.ok) throw new Error('Not logged in');

        const user = await res.json();

        if (user) {
            // Show user info
            userInfoContainer.innerHTML = `<p>Welcome, ${user.name}!</p>`;

            // Set the navbar links
            navLinksContainer.innerHTML = `
                <a href="/booking.html">Book Tickets</a>
                <a href="/bookings.html">My Bookings</a>
                <a href="/api/logout" class="logout-button">Logout</a>
            `;

            // Fetch their bookings
            fetchBookings();
        } else {
            throw new Error('Not logged in');
        }

    } catch (error) {
        userInfoContainer.innerHTML = '<p>You are not logged in. <a href="/">Go Home to log in</a>.</p>';
        bookingsList.innerHTML = '';

        // Set navbar for logged-out user
        navLinksContainer.innerHTML = `
            <a href="/booking.html">Book Tickets</a>
            <a href="/auth/google" class="login-button">Login with Google</a>
        `;
    }
}
    // --- 3. Fetch the User's Bookings ---
    async function fetchBookings() {
        try {
            const res = await fetch('/api/bookings/my-bookings');
            if (!res.ok) throw new Error('Could not fetch bookings');
            
            const bookings = await res.json();
            renderBookings(bookings);
            
        } catch (error) {
            bookingsList.innerHTML = `<p>${error.message}</p>`;
        }
    }

    // --- 4. Render the Bookings to the Page ---
    function renderBookings(bookings) {
        if (bookings.length === 0) {
            bookingsList.innerHTML = '<h2>Your Bookings</h2><p>You have no bookings yet.</p>';
            return;
        }

        // Clear "loading..."
        bookingsList.innerHTML = '<h2>Your Bookings</h2>';

        bookings.forEach(booking => {
            const bookingCard = document.createElement('div');
            bookingCard.className = 'trip-card'; // Reuse our CSS class
            
            const trip = booking._trip; 
            
            // *** THIS IS THE UPDATE ***
            // Format the date to be friendly
            const departure = new Date(trip.departureTime);
            const friendlyDate = departure.toLocaleString('en-US', {
                dateStyle: 'short',
                timeStyle: 'short'
            });

            bookingCard.innerHTML = `
                <h3>${trip.origin} to ${trip.destination}</h3>
                <p><strong>Bus:</strong> ${trip.busName}</p>
                <p><strong>Departure:</strong> ${friendlyDate}</p>
                <p><strong>Your Seats:</strong> ${booking.selectedSeats.join(', ')}</p>
                <p><strong>Total Paid:</strong> ₹${booking.totalPrice}</p>
            `;
            bookingsList.appendChild(bookingCard);
        });
    }

    // --- Start the process ---
    fetchUser();
});