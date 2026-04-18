const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    type: { type: String }, // e.g., vegetable, fruit, grain
    price: { type: Number, required: true },
    quantity: { type: String, required: true }, // e.g., '10 kg'
    location: { type: String, required: true },
    locationCoords: {
        lat: { type: Number },
        lon: { type: Number }
    },
    imageUrl: { type: String },
    farmer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['Available', 'Sold'], default: 'Available' },
    isPurchased: { type: Boolean, default: false },
    searchCount: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
