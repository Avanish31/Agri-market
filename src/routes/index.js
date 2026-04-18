const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const Notification = require('../models/Notification');
const { optionalAuth, protect, authorize } = require('../middleware/auth');
const getDistanceFromLatLonInKm = require('../utils/distance');

// Home page
router.get('/', optionalAuth, async (req, res) => {
    try {
        let dbQuery = {};
        if (req.query.search) {
            dbQuery.name = { $regex: req.query.search, $options: 'i' };
        }
        if (req.query.type) {
            dbQuery.type = req.query.type;
        }
        
        let products = await Product.find(dbQuery).populate('farmer', 'name').lean();
        console.log(products);
        // Increment search count if search term is provided
        if (req.query.search && products.length > 0) {
            const productIds = products.map(p => p._id);
            await Product.updateMany({ _id: { $in: productIds } }, { $inc: { searchCount: 1 } });
            
            // Update local objects for immediate display if needed
            products = products.map(p => {
                p.searchCount = (p.searchCount || 0) + 1;
                return p;
            });
        }
        if (req.query.nearMe === 'true' && req.user && req.user.role === 'buyer') {
            const userCoords = req.user.locationCoords;
            if (userCoords && userCoords.lat && userCoords.lon) {
                products = products.map(p => {
                    if (p.locationCoords && p.locationCoords.lat && p.locationCoords.lon) {
                        p.distanceKm = getDistanceFromLatLonInKm(
                            userCoords.lat, userCoords.lon, 
                            p.locationCoords.lat, p.locationCoords.lon
                        );
                    }
                    return p;
                });

                // Sort: items with distance first (sorted by distance ascending)
                products.sort((a, b) => {
                    if (a.distanceKm === undefined && b.distanceKm === undefined) return 0;
                    if (a.distanceKm === undefined) return 1;
                    if (b.distanceKm === undefined) return -1;
                    return a.distanceKm - b.distanceKm;
                });
            }
        }

        res.render('pages/index', { products, user: res.locals.user, query: req.query });
    } catch (error) {
        console.error("Home route error:", error);
        res.status(500).send('Server Error');
    }
});

// Product Details
router.get('/product/:id', optionalAuth, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).populate('farmer', 'name email phone');
        if (!product) return res.status(404).send('Product not found');
        res.render('pages/product-detail', { product, user: res.locals.user });
    } catch (error) {
        res.status(500).send('Server Error');
    }
});

// Cart (Buyer Route)
router.get('/cart', protect, authorize('buyer'), async (req, res) => {
    try {
        let cart = await Cart.findOne({ buyer: req.user._id }).populate({
            path: 'products',
            populate: { path: 'farmer', select: 'name email' }
        });
        
        if (!cart) {
            cart = { products: [] };
        }
        
        res.render('pages/cart', { cart });
    } catch (error) {
        res.status(500).send('Server Error');
    }
});

// Add to Cart
router.post('/cart/add/:productId', protect, authorize('buyer'), async (req, res) => {
    try {
        let cart = await Cart.findOne({ buyer: req.user._id });
        if (!cart) {
            cart = await Cart.create({ buyer: req.user._id, products: [req.params.productId] });
        } else {
            if (!cart.products.includes(req.params.productId)) {
                cart.products.push(req.params.productId);
                await cart.save();
            }
        }
        res.redirect('/cart');
    } catch (error) {
        res.status(500).send('Server Error');
    }
});

// Remove from cart
router.post('/cart/remove/:productId', protect, authorize('buyer'), async (req, res) => {
    try {
        let cart = await Cart.findOne({ buyer: req.user._id });
        if (cart) {
            cart.products = cart.products.filter(p => p.toString() !== req.params.productId);
            await cart.save();
        }
        res.redirect('/cart');
    } catch (error) {
        res.status(500).send('Server Error');
    }
});

// Checkout
router.post('/cart/checkout', protect, authorize('buyer'), async (req, res) => {
    try {
        const cart = await Cart.findOne({ buyer: req.user._id }).populate('products');
        if (!cart || cart.products.length === 0) {
            return res.redirect('/cart');
        }

        const io = req.app.locals.io;
        const onlineUsers = req.app.locals.onlineUsers;

        const farmerNotifications = {};

        for (let product of cart.products) {
            product.status = 'Sold';
            product.isPurchased = true;
            await product.save();

            const farmerId = product.farmer.toString();
            if (!farmerNotifications[farmerId]) {
                farmerNotifications[farmerId] = `Your product ${product.name} was successfully bought by ${req.user.name}.`;
            } else {
                farmerNotifications[farmerId] += ` | Your product ${product.name} was successfully bought by ${req.user.name}.`;
            }
        }

        for (let [farmerId, message] of Object.entries(farmerNotifications)) {
            await Notification.create({ user: farmerId, message });
            
            if (onlineUsers && io) {
                const socketId = onlineUsers.get(farmerId);
                if (socketId) {
                    io.to(socketId).emit('notification', message);
                }
            }
        }

        cart.products = [];
        await cart.save();

        res.render('pages/checkout-success');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

// Notifications
router.get('/notifications', protect, async (req, res) => {
    try {
        const notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.render('pages/notifications', { notifications });
    } catch (error) {
        res.status(500).send('Server Error');
    }
});

module.exports = router;
