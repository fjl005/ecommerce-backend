const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
    },
    productId: {
        type: String,
        required: true,
    },
    purchasedItemId: {
        type: String,
        required: true,
    },
    starRating: {
        type: Number,
        required: true,
    },
    ratingDescription: {
        type: String,
    },
    reviewDate: {
        type: Date,
        required: true,
    },
    orderIdString: {
        type: String,
        required: true
    },
    productName: {
        type: String,
        required: true,
    },
    imageURL: {
        type: String,
    },
    productType: {
        type: String,
        required: true,
    },
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;