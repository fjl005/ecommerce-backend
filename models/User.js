const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: String,
    price: Number,
    description: String,
    fileType: String
})

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
        name: String,
        price: Number,
        description: String,
        fileType: String
    }],
    saved: [{
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
    orders: [{
        items: [{
            name: String,
            price: Number,
            description: String,
            fileType: String
        }],
        orderDate: String
    }]
});

const User = mongoose.model('User', userSchema);

module.exports = User;