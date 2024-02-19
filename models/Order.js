const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    items: [{
        productId: String,
        productName: String,
        price: Number,
        description: String,
        productType: String,
        hasReview: {
            type: Boolean,
            default: false
        },
        pictures: [{
            url: String,
        }],
    }],
    orderDate: {
        type: Date,
        required: true,
    },
    totalCost: {
        type: Number,
        required: true,
    },
    username: {
        type: String,
        required: true,
    },
    userId: {
        type: String,
        required: true,
    },
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;