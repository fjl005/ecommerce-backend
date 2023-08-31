const express = require('express');
const reviewsRouter = express.Router();
const Product = require('../models/Product');
const User = require('../models/User');
const Review = require('../models/Review');
const authenticate = require('../authenticate');


reviewsRouter.get('/', async (req, res) => {
    try {
        const reviews = await Review.find();
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

reviewsRouter.post('/', authenticate.sessionValidation, async (req, res) => {
    const { productId, starRating, ratingDescription, currentDate } = req.body;

    let username;
    if (req.session.user) {
        username = req.session.user.username;
    }

    try {
        const existingReview = await Review.findOne({ username, productId });

        if (existingReview) {
            return res.status(400).send('A review by the same person for this product already exists.');
        }

        const newReview = new Review({
            username,
            productId,
            starRating,
            ratingDescription,
            currentDate
        });

        await newReview.save();

        res.status(201).json({ message: 'Review submitted successfully.' });
    } catch (error) {
        console.log('error: ', error);
        res.status(500).json({ errorMessage: error });
    }
});

module.exports = reviewsRouter;