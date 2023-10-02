const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    items: [{
        productId: String,
        name: String,
        price: Number,
        description: String,
        productType: String,
        hasReview: {
            type: Boolean,
            default: false
        }
    }],
    orderDate: {
        type: String,
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
    }
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;