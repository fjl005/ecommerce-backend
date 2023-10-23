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
    productType: {
        type: String,
        required: true
    },
    files: {
        type: String
    },
    pictures: [{
        url: String,
        publicId: String,
    }],
    reviews: {
        type: String
    },
    // datePosted: {
    //     type: Date,
    //     required: true,
    // },
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;