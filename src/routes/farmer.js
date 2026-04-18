const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const geocode = require('../utils/geocode');

// Apply auth middleware to all farmer routes
router.use(protect);
router.use(authorize('farmer'));

// Farmer Dashboard
router.get('/dashboard', async (req, res) => {
    try {
        const products = await Product.find({ farmer: req.user._id });
        res.render('pages/farmer-dashboard', { products });
    } catch (error) {
        res.status(500).send('Server Error');
    }
});

// Analyze Market
router.get('/analyze-market', async (req, res) => {
    try {
        const products = await Product.aggregate([
            {
                $group: {
                    _id: { $toLower: "$name" },
                    name: { $first: "$name" },
                    type: { $first: "$type" },
                    // Calculate average price excluding current farmer
                    otherFarmersAvgPrice: { 
                        $avg: { 
                            $cond: [{ $ne: ["$farmer", req.user._id] }, "$price", null] 
                        } 
                    },
                    // Also keep global average just in case
                    globalAvgPrice: { $avg: "$price" },
                    searchCount: { $max: "$searchCount" },
                    quantity: { $first: "$quantity" }
                }
            },
            {
                $project: {
                    _id: 0,
                    name: 1,
                    type: 1,
                    price: { $ifNull: ["$otherFarmersAvgPrice", "$globalAvgPrice"] },
                    searchCount: 1,
                    quantity: 1
                }
            },
            { $sort: { searchCount: -1 } }
        ]);

        // Format the average price
        products.forEach(p => {
            if (p.price) {
                p.price = Number(p.price).toFixed(2);
            }
        });

        res.render('pages/farmer-analyze-market', { products });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

// Render Add Product Form
router.get('/add', (req, res) => {
    res.render('pages/farmer-add-product');
});

// Handle Add Product
router.post('/add', upload.single('image'), async (req, res) => {
    try {
        const { name, type, price, quantity, location } = req.body;
        const imageUrl = req.file ? `/uploads/${req.file.filename}` : '';

        let locationCoords = null;
        if (location) {
            locationCoords = await geocode(location);
        }

        await Product.create({
            name,
            type,
            price,
            quantity,
            location,
            locationCoords,
            imageUrl,
            farmer: req.user._id
        });

        res.redirect('/farmer/dashboard');
    } catch (error) {
        res.status(500).send('Server Error');
    }
});

// Toggle Status
router.post('/product/:id/status', async (req, res) => {
    try {
        const product = await Product.findOne({ _id: req.params.id, farmer: req.user._id });
        if (product) {
            if (product.isPurchased) {
                return res.redirect('/farmer/dashboard');
            }
            product.status = product.status === 'Available' ? 'Sold' : 'Available';
            await product.save();
        }
        res.redirect('/farmer/dashboard');
    } catch (error) {
        res.status(500).send('Server Error');
    }
});

// Delete Product
router.post('/product/:id/delete', async (req, res) => {
    try {
        await Product.findOneAndDelete({ _id: req.params.id, farmer: req.user._id });
        res.redirect('/farmer/dashboard');
    } catch (error) {
        res.status(500).send('Server Error');
    }
});

module.exports = router;
