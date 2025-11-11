// File: public/js/seats.js

document.addEventListener('DOMContentLoaded', () => {
    // --- 1. GET ELEMENTS & TRIP ID ---
    const seatMapContainer = document.getElementById('seat-map-container');
    const loadingContainer = document.getElementById('loading-container'); // From spinner update
    const selectedSeatsDisplay = document.getElementById('selected-seats-display');
    const totalPriceDisplay = document.getElementById('total-price-display');
    const bookNowButton = document.getElementById('book-now-button');

    const urlParams = new URLSearchParams(window.location.search);
    const tripId = urlParams.get('tripId');

    // --- These variables are GLOBAL to this file ---
    let tripPrice = 0; // We store the price here, so other functions can use it
    let selectedSeats = []; 

    // --- 2. FETCH TRIP DATA FROM THE API ---
    async function fetchTripData() {
        if (loadingContainer) {
             loadingContainer.innerHTML = '<div class="spinner"></div>'; // Add spinner
        }

        try {
            const response = await fetch(`/api/trips/${tripId}`);
            if (!response.ok) throw new Error('Trip data not found');
            
            // 'trip' is LOCAL to this function
            const trip = await response.json(); 
            
            // *** THE FIX IS HERE ***
            // We save the price to the GLOBAL 'tripPrice' variable
            tripPrice = trip.price; 
            
            if (loadingContainer) loadingContainer.innerHTML = ''; // Clear spinner
            renderSeatMap(trip.totalSeats, trip.bookedSeats);

        } catch (error) {
            if (loadingContainer) {
                loadingContainer.innerHTML = `<p>Error: ${error.message}</p>`;
            } else {
                seatMapContainer.innerHTML = `<p>Error: ${error.message}</p>`;
            }
        }
    }

    // --- 4. RENDER FUNCTION ---
    function renderSeatMap(totalSeats, bookedSeats) {
        // (This function is the same as before, no 'trip' variable needed)
        for (let i = 1; i <= totalSeats; i++) {
            const seat = document.createElement('div');
            seat.classList.add('seat');
            const seatNumber = i;
            seat.dataset.seatNumber = seatNumber;
            seat.innerText = seatNumber;

            if (bookedSeats.includes(String(seatNumber))) {
                seat.classList.add('booked');
                seat.disabled = true;
            } else {
                seat.classList.add('available');
                seat.addEventListener('click', toggleSeatSelection);
            }
            seatMapContainer.appendChild(seat);
        }
    }

    // --- 5. SEAT CLICK HANDLER ---
    function toggleSeatSelection(event) {
        const seat = event.target;
        if (seat.classList.contains('booked')) return; 

        if (seat.classList.contains('selected')) {
            seat.classList.remove('selected');
            seat.classList.add('available');
            selectedSeats = selectedSeats.filter(s => s !== seat.dataset.seatNumber);
        } else {
            seat.classList.remove('available');
            seat.classList.add('selected');
            selectedSeats.push(seat.dataset.seatNumber);
        }
        updateBookingSummary();
    }

    // --- 6. UPDATE SUMMARY ---
    function updateBookingSummary() {
        if (selectedSeats.length === 0) {
            selectedSeatsDisplay.innerText = 'None';
        } else {
            selectedSeatsDisplay.innerText = selectedSeats.join(', ');
        }
        
        // *** THE FIX IS HERE ***
        // This function correctly uses 'tripPrice', not 'trip'
        const totalPrice = selectedSeats.length * tripPrice;
        totalPriceDisplay.innerText = totalPrice;
    }

    // --- 7. START THE PROCESS ---
    if (tripId) {
        fetchTripData();
    } else {
        seatMapContainer.innerHTML = '<p>Error: No trip ID provided.</p>';
    }

    // --- 8. BOOK NOW BUTTON HANDLER ---
    bookNowButton.addEventListener('click', handleBooking);

    async function handleBooking() {
        if (selectedSeats.length === 0) {
            alert('Please select at least one seat.');
            return;
        }

        bookNowButton.disabled = true;
        bookNowButton.innerText = 'Booking...';

        try {
            // *** THE FIX IS HERE ***
            // This function also correctly uses 'tripPrice'
            const totalPrice = selectedSeats.length * tripPrice;

            const response = await fetch('/api/bookings/book', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tripId: tripId,
                    selectedSeats: selectedSeats,
                    totalPrice: totalPrice
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Booking failed.');
            }

            alert('Booking successful!');
            window.location.href = '/bookings.html';

        } catch (error) {
            alert(`Error: ${error.message}`);
            bookNowButton.disabled = false;
            bookNowButton.innerText = 'Book Now';
        }
    }
});