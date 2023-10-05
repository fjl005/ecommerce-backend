const mongoose = require('mongoose');


const userSchema = new mongoose.Schema({
    username: {
        type: String,
        unique: true,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    admin: {
        type: Boolean,
        default: false
    },
    cart: [{
        type: String,
    }],
    saved: [{
        type: String
    }],
    favorites: [{
        type: String
    }],
    mastercard: {
        email: String,
        cardExpires: String,
        cardNumber: Number,
        cardCVC: Number,
        firstName: String,
        lastName: String,
        streetAddress: String,
        city: String,
        state: String,
        zipCode: Number
    },
    // orders: [{
    //     items: [{
    //         productId: String,
    //         name: String,
    //         price: Number,
    //         description: String,
    //         productType: String,
    //         hasReview: {
    //             type: Boolean,
    //             default: false
    //         }
    //     }],
    //     orderDate: Date,
    //     totalCost: Number
    // }]
});

const User = mongoose.model('User', userSchema);

module.exports = User;