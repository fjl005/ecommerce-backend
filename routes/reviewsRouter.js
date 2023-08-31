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

reviewsRouter.get('/:purchaseId', async (req, res) => {
    const purchaseId = req.params.purchaseId;

    try {
        const review = await Review.findOne({ purchaseId });

        if (review) {
            res.json(review);
        } else {
            res.status(404).json({ message: 'Review not found' });
        }
    } catch (error) {
        console.log('error: ', error);
        res.status(500).json({ message: 'Server error' });
    }
});

reviewsRouter.post('/', authenticate.sessionValidation, async (req, res) => {
    const { productId, starRating, ratingDescription, currentDate, orderId, purchaseId } = req.body;

    let username;
    if (req.session.user) {
        username = req.session.user.username;
    }

    try {
        const existingReview = await Review.findOne({ username, purchaseId });

        // COMMENTED OUT FOR DEBUGGING PURPOSES!!!

        // if (existingReview) {
        //     return res.status(400).send('A review by the same person for this product already exists.');
        // }

        const newReview = new Review({
            username,
            productId,
            purchaseId,
            starRating,
            ratingDescription,
            currentDate
        });

        await newReview.save();

        const user = await User.findOne({ username });
        const orders = user.orders;

        let foundProduct = null;

        for (const order of orders) {
            if (order._id.toString() === orderId) {
                for (const product of order.items) {
                    if (product._id.toString() === purchaseId) {
                        foundProduct = product;
                        foundProduct.hasReview = true;

                        try {
                            await user.save();
                            console.log('User object updated with product review status.');
                        } catch (error) {
                            console.log('Error updating user:', error);
                        }
                        break;
                    }
                }
                if (foundProduct) {
                    break;
                }
            }
        }

        if (foundProduct) {
            console.log('Found product:', foundProduct);
        } else {
            console.log('Product not found.');
        }

        res.status(201).json({ message: 'Review submitted successfully.' });
    } catch (error) {
        console.log('error: ', error);
        res.status(500).send('There was a problem with the server.');
    }
});

module.exports = reviewsRouter;