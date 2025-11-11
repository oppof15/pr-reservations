// File: public/js/home.js (NEW FILE)

document.addEventListener('DOMContentLoaded', () => {
    const navLinksContainer = document.getElementById('nav-links-container');

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

    checkLoginStatus();
});