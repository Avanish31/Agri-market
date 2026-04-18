const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const geocode = require('../utils/geocode');

// Render Signin Page
router.get('/signin', (req, res) => {
    res.render('pages/signin', { error: null });
});

// Render Signup Page
router.get('/signup', (req, res) => {
    res.render('pages/signup', { error: null });
});

// Handle Sign Up
router.post('/signup', async (req, res) => {
    try {
        const { name, email, password, role, address } = req.body;
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.render('pages/signup', { error: 'Email already in use' });
        }

        let locationCoords = null;
        if (address) {
            locationCoords = await geocode(address);
        }

        const user = await User.create({ name, email, password, role, address, locationCoords });
        
        // Auto signin after signup
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
        res.cookie('jwt', token, { httpOnly: true, maxAge: 30 * 24 * 60 * 60 * 1000 });

        if (user.role === 'farmer') {
            res.redirect('/farmer/dashboard');
        } else {
            res.redirect('/');
        }
    } catch (error) {
        console.error("Signup error:", error);
        res.render('pages/signup', { error: 'Error creating account: ' + error.message });
    }
});

// Handle Sign In
router.post('/signin', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (user && (await user.comparePassword(password))) {
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
            res.cookie('jwt', token, { httpOnly: true, maxAge: 30 * 24 * 60 * 60 * 1000 });
            
            if (user.role === 'farmer') {
                res.redirect('/farmer/dashboard');
            } else {
                res.redirect('/');
            }
        } else {
            res.render('pages/signin', { error: 'Invalid credentials' });
        }
    } catch (error) {
        res.render('pages/signin', { error: 'Error logging in' });
    }
});

// Handle Sign Out
router.get('/signout', (req, res) => {
    res.clearCookie('jwt');
    res.redirect('/');
});

module.exports = router;
