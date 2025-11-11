// File: public/js/booking.js

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. GET ALL ELEMENTS ---
    const searchForm = document.getElementById('search-form');
    const originInput = document.getElementById('origin');
    const destinationInput = document.getElementById('destination');
    const dateInput = document.getElementById('date');
    const resultsContainer = document.getElementById('results-container');
    const navLinksContainer = document.getElementById('nav-links-container');

    // --- 2. CHECK LOGIN STATUS (Updated for consistency) ---
    async function checkLoginStatus() {
        try {
            const res = await fetch('/api/current_user');
            const user = await res.json();

            if (user) {
                // User is logged in
                navLinksContainer.innerHTML = `
                    <a href="/booking.html">Book Tickets</a>
                    <a href="/bookings.html">My Bookings</a>
                    <a href="/api/logout" class="logout-button">Logout</a>
                `;
            } else {
                // User is not logged in
                navLinksContainer.innerHTML = `
                    <a href="/booking.html">Book Tickets</a>
                    <a href="/auth/google" class="login-button">Login with Google</a>
                `;
            }
        } catch (err) {
            console.error('Error checking login status:', err);
            navLinksContainer.innerHTML = `
                <a href="/booking.html">Book Tickets</a>
                <a href="/auth/google" class="login-button">Login with Google</a>
            `;
        }
    }

    // --- 3. SET MINIMUM DATE FOR PICKER ---
    function setMinDate() {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
        const dd = String(today.getDate()).padStart(2, '0');
        
        const minDate = `${yyyy}-${mm}-${dd}`;
        dateInput.setAttribute('min', minDate);
        dateInput.value = minDate; // Default to today
    }

    // --- 4. SEARCH FORM EVENT LISTENER (Updated) ---
    searchForm.addEventListener('submit', async (event) => {
        event.preventDefault(); 
        resultsContainer.innerHTML = '<div class="spinner"></div>';

        const origin = originInput.value;
        const destination = destinationInput.value;
        const date = dateInput.value; 

        try {
            const fetchUrl = `/api/trips/search?origin=${origin}&destination=${destination}&date=${date}`;
            const response = await fetch(fetchUrl);
            
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            
            const trips = await response.json();
            displayTrips(trips);

        } catch (error) {
            console.error('Fetch error:', error);
            resultsContainer.innerHTML = '<p>Error searching for trips. Please try again.</p>';
        }
    });

    // --- 5. DISPLAY TRIPS FUNCTION (CORRECTED) ---
    function displayTrips(trips) {
        resultsContainer.innerHTML = '';

        if (trips.length === 0) {
            resultsContainer.innerHTML = '<p>No trips found for this route.</p>';
            return;
        }

        trips.forEach(trip => {
            const tripElement = document.createElement('div');
            tripElement.className = 'trip-card';
            
            const departure = new Date(trip.departureTime);
            
            const friendlyDate = departure.toLocaleString('en-US', {
                dateStyle: 'short', // "11/10/2025"
                timeStyle: 'short'  // "10:00 PM"
            });
            
            // --- THIS IS THE FIX ---
            // Changed 'trip._id' to 'trip.id' for SQL
            tripElement.innerHTML = `
                <h3>${trip.busName}</h3>
                <p>${trip.origin} to ${trip.destination}</p>
                <p>Departure: ${friendlyDate}</p>
                <p>Price: ₹${trip.price}</p>
                <a href="/seats.html?tripId=${trip.id}" class="book-button">Select Seats</a>
            `;
            // --- END OF FIX ---
            
            resultsContainer.appendChild(tripElement);
        });
    }

    // --- 6. RUN ON PAGE LOAD ---
    checkLoginStatus();
    setMinDate();
});