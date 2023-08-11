const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        required: true
    },
    files: {
        type: String
    },
    pictures: {
        type: String
    },
    reviews: {
        type: String
    }
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;