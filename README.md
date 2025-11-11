# PR Reservations 🚌

A full-stack bus reservation system built with Node.js, Express.js, and MySQL. This project provides a complete, user-friendly booking experience, from searching for trips to visual seat selection and an admin panel for managing routes.

## ✨ Features

* **User-Friendly Interface:** A clean, dark-mode UI that is fully responsive for mobile devices.
* **Secure Authentication:** Users can sign in easily and securely using their Google accounts (via Passport.js).
* **Dynamic Trip Search:** Search for buses by origin, destination, and date.
* **Visual Seat Selection:** A "Redbus-style" interactive seat map where users can click to select or deselect their seats.
* **User Dashboard:** A "My Bookings" page where users can see all their past and upcoming tickets.
* **Admin Panel:** A secure admin-only page (`/admin.html`) where an admin can add new trips and delete existing ones from the database.

## 🛠️ Tech Stack

* **Backend:** Node.js, Express.js
* **Database:** MySQL (connected with `mysql2`)
* **Authentication:** Passport.js (using `passport-google-oauth20`)
* **Frontend:** Vanilla HTML5, CSS3, and JavaScript (Client-Side Rendering)
* **Database Admin:** phpMyAdmin

## 🚀 How to Run Locally

To get a local copy up and running, follow these steps.

### Prerequisites

* [Node.js](https://nodejs.org/) installed
* [XAMPP](https://www.apachefriends.org/index.html) installed (or any other MySQL server)

1. Install Dependencies
npm install

2. Set Up the Database
Start the Apache and MySQL services in your XAMPP Control Panel.

Go to http://localhost/phpmyadmin/.

Create a new database named pr_reservations_db (with utf8mb4_general_ci collation).

Run the following SQL scripts (from the project) to create your tables:

CREATE TABLE users ...

CREATE TABLE trips ...

CREATE TABLE bookings ...

3. Set Up Environment Variables
Create a file named .env in the root of the project.

Add the following variables. You must get your own Google keys.

# Google API Keys
GOOGLE_CLIENT_ID="YOUR_GOOGLE_CLIENT_ID"
GOOGLE_CLIENT_SECRET="YOUR_GOOGLE_CLIENT_SECRET"

# Cookie Encryption Key
COOKIE_KEY="ANY_RANDOM_STRING_YOU_MAKE_UP"

# Your Admin Google ID(s)
ADMIN_GOOGLE_IDS="YOUR_GOOGLE_ID_FROM_THE_USERS_TABLE"

# MySQL Database Connection
DB_HOST="localhost"
DB_USER="root"
DB_PASSWORD=""
DB_NAME="pr_reservations_db"


Run the Application
npm start
