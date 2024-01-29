const express = require('express');
const reviewsRouter = express.Router();
const Product = require('../models/Product');
const User = require('../models/User');
const Review = require('../models/Review');
const Order = require('../models/Order');
const authenticate = require('../authenticate');

// Not a route, just a function for DRY
async function updateProductReviewStatus(username, orderId, purchasedItemId, hasReview) {
    const orders = await Order.find({ username });

    for (const order of orders) {
        if (order._id.toString() === orderId) {
            for (const product of order.items) {
                if (product._id.toString() === purchasedItemId) {
                    product.hasReview = hasReview;

                    try {
                        await order.save();
                        console.log('Order object updated with product review status.');
                    } catch (error) {
                        console.log('Error updating user:', error);
                    }

                    break;
                }
            }
            break;
        }
    }
}


reviewsRouter.get('/', async (req, res) => {
    try {
        const reviews = await Review.find();
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

reviewsRouter.get('/user/:username', async (req, res) => {
    const username = req.params.username;

    try {
        const reviews = await Review.find({ username: username }).sort({ reviewDate: -1 });
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

reviewsRouter.post('/', authenticate.sessionValidation, async (req, res) => {
    const { productId, starRating, ratingDescription, reviewDate, orderId, purchasedItemId } = req.body;

    let username;
    if (req.session.user) {
        username = req.session.user.username;
    }

    try {
        let review = await Review.findOne({ purchasedItemId: purchasedItemId });
        console.log('review: ', review);

        if (review) {
            review.productId = productId;
            review.starRating = starRating;
            review.ratingDescription = ratingDescription;
            review.reviewDate = reviewDate;
        } else {
            review = new Review({
                username,
                productId,
                purchasedItemId,
                starRating,
                ratingDescription,
                reviewDate,
                orderIdString: orderId.toString()
            });
        }

        await review.save();

        const orders = await Order.find({ username });

        let foundProduct = null;

        updateProductReviewStatus(username, orderId, purchasedItemId, true);

        res.status(201).json({ message: 'Review submitted successfully.' });
    } catch (error) {
        console.log('error: ', error);
        res.status(500).send('There was a problem with the server.');
    }
});

reviewsRouter.get('/:purchasedItemId', async (req, res) => {
    const purchasedItemId = req.params.purchasedItemId;

    try {
        const review = await Review.findOne({
            purchasedItemId: purchasedItemId
        });

        if (review) {
            console.log('review: ', review);
            res.json(review);
        } else {
            res.status(404).json({ message: 'Review not found' });
        }
    } catch (error) {
        console.log('error: ', error);
        res.status(500).json({ message: 'Server error' });
    }
});

reviewsRouter.delete(`/:purchasedItemId`, async (req, res) => {
    const { purchasedItemId, orderId } = req.params;

    let username;
    if (req.session.user) {
        username = req.session.user.username;
    }

    try {
        const review = await Review.findOne({ purchasedItemId });
        const orderId = review.orderIdString;

        if (review) {
            await Review.findByIdAndRemove(review._id);

            const orders = await Order.find({ username });
            let foundProduct = null;

            updateProductReviewStatus(username, orderId, purchasedItemId, false);

            res.status(200).json({ message: 'Review deleted successfully.' });
        } else {
            console.log('not deleted')
            console.log('review: ', review);
            res.status(404).json({ message: 'Review not found.' });
        }
    } catch (error) {
        console.log('error: ', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = reviewsRouter;