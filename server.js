const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cookieParser = require('cookie-parser');
const connectDB = require('./src/config/db');
const http = require('http');
const { Server } = require('socket.io');

// Initialize Express app
const app = express();

// Connect to Database
connectDB();

// Setup EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Make the app look modern - Add locals
app.locals.siteName = "AgriMarket";

// Basic Route structure (to be populated)
app.use('/', require('./src/routes/index'));
app.use('/auth', require('./src/routes/auth'));
app.use('/farmer', require('./src/routes/farmer'));

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);
const io = new Server(server);

const onlineUsers = new Map();

io.on('connection', (socket) => {
    const userId = socket.handshake.query.userId;
    if (userId && userId !== 'undefined') {
        onlineUsers.set(userId, socket.id);
    }

    socket.on('disconnect', () => {
        if (userId) onlineUsers.delete(userId);
    });
});

app.locals.io = io;
app.locals.onlineUsers = onlineUsers;

// Only start the server locally, Vercel will handle it in production
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    server.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

module.exports = app;
