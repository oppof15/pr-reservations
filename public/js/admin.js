// File: public/js/admin.js

document.addEventListener('DOMContentLoaded', () => {
    const statusEl = document.getElementById('admin-status');
    const contentEl = document.getElementById('admin-content');
    const tripsListEl = document.getElementById('current-trips-list');
    const addTripForm = document.getElementById('add-trip-form');

    // 1. Check if user is the admin (THIS IS THE CORRECTED FUNCTION)
    async function checkAdminStatus() {
        try {
            // Call our new, secure admin-check route
            const res = await fetch('/api/admin/check'); 
            
            if (res.status === 401) {
                throw new Error('You must be logged in.');
            }
            if (res.status === 403) {
                throw new Error('You are not authorized to view this page.');
            }
            if (!res.ok) {
                throw new Error('Authorization check failed.');
            }

            // If we get here, we are admin!
            statusEl.innerText = 'Authorization successful. Welcome, Admin.';
            contentEl.style.display = 'block'; // Show the admin content
            
            // Now, load the trips
            loadAllTrips();

        } catch (err) {
            statusEl.innerText = `Error: ${err.message}`;
        }
    }

    // 2. Load and display all current trips
    async function loadAllTrips() {
        try {
            // This route is public, so we just use it to get data.
            const res = await fetch('/api/trips/search'); // Get ALL trips
            const trips = await res.json();

            tripsListEl.innerHTML = ''; // Clear "Loading..."
            
            if (trips.length === 0) {
                tripsListEl.innerHTML = '<p>No trips currently in the system.</p>';
                return;
            }
            
            trips.forEach(trip => {
                const tripEl = document.createElement('div');
                tripEl.className = 'trip-card';
                tripEl.innerHTML = `
                    <p>${trip.busName} (${trip.origin} to ${trip.destination})</p>
                    <button class="delete-button" data-id="${trip._id}">Delete</button>
                `;
                tripsListEl.appendChild(tripEl);
            });

        } catch (err) {
            tripsListEl.innerHTML = '<p>Error loading trips.</p>';
        }
    }

    // 3. Handle the "Add Trip" form submission
    addTripForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Collect all form data into an object
        const formData = {
            busName: document.getElementById('busName').value,
            origin: document.getElementById('origin').value,
            destination: document.getElementById('destination').value,
            departureTime: document.getElementById('departureTime').value,
            arrivalTime: document.getElementById('arrivalTime').value,
            price: document.getElementById('price').value,
            totalSeats: document.getElementById('totalSeats').value,
        };

        try {
            // This POST route is protected by requireAdmin
            const res = await fetch('/api/trips', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!res.ok) {
                 const err = await res.json();
                 throw new Error(err.message || 'Failed to add trip');
            }

            alert('Trip added successfully!');
            addTripForm.reset(); // Clear the form
            loadAllTrips(); // Refresh the list

        } catch (err) {
            alert(`Error: ${err.message}`);
        }
    });

    // 4. Handle "Delete" button clicks (Event Delegation)
    tripsListEl.addEventListener('click', async (e) => {
        if (e.target.classList.contains('delete-button')) {
            const tripId = e.target.dataset.id;
            
            if (!confirm('Are you sure you want to delete this trip?')) {
                return;
            }

            try {
                // This DELETE route is protected by requireAdmin
                const res = await fetch(`/api/trips/${tripId}`, {
                    method: 'DELETE'
                });
                
                if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.message || 'Failed to delete trip');
                }

                alert('Trip deleted.');
                loadAllTrips(); // Refresh the list

            } catch (err) {
                alert(`Error: ${err.message}`);
            }
        }
    });

    // --- START THE PAGE ---
    checkAdminStatus();
});