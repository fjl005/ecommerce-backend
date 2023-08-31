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
    starRating: {
        type: Number,
        required: true,
    },
    ratingDescription: {
        type: String,
    },
    currentDate: {
        type: Date,
        required: true,
    },
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;