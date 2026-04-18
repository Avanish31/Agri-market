const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;
    if (req.cookies.jwt) {
        token = req.cookies.jwt;
    }
    
    if (!token) {
        return res.redirect('/signin');
    }

    try {
        const decoded = jwt.verify(token, 'supersecretkey_dev_only');
        req.user = await User.findById(decoded.id).select('-password');
        res.locals.user = req.user; // Make user available to EJS templates
        next();
    } catch (error) {
        res.clearCookie('jwt');
        return res.redirect('/signin');
    }
};

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).send('Not authorized to access this route');
        }
        next();
    };
};

const optionalAuth = async (req, res, next) => {
    let token = req.cookies.jwt;
    if (token) {
        try {
            const decoded = jwt.verify(token, 'supersecretkey_dev_only');
            req.user = await User.findById(decoded.id).select('-password');
            res.locals.user = req.user;
        } catch (error) {
            res.locals.user = null;
        }
    } else {
        res.locals.user = null;
    }
    next();
};

module.exports = { protect, authorize, optionalAuth };
