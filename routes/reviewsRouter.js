const express = require('express');
const reviewsRouter = express.Router();
const Review = require('../models/Review');
const Order = require('../models/Order');
const authenticate = require('../authenticate');

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
        reviews.sort((a, b) => b.reviewDate.getTime() - a.reviewDate.getTime());
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

reviewsRouter.get('/user/:username', authenticate.sessionValidation, async (req, res) => {
    const username = req.params.username;

    try {
        const reviews = await Review.find({ username: username }).sort({ reviewDate: -1 });
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

reviewsRouter.put('/', authenticate.sessionValidation, async (req, res) => {
    const { currUsername, newUsername } = req.body;

    try {
        const reviews = await Review.find({ username: currUsername });

        for (let review of reviews) {
            review.username = newUsername;
            await review.save();
        }

        res.json(reviews);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

reviewsRouter.post('/', authenticate.sessionValidation, async (req, res) => {
    const {
        starRating,
        ratingDescription,
        reviewDate,
        orderId,
        purchasedItemId,
        productName,
        productId,
        imageURL,
        productType,
    } = req.body;


    let username;
    if (req.session.user) {
        username = req.session.user.username;
    }

    try {
        let review = await Review.findOne({ purchasedItemId: purchasedItemId });

        if (review) {
            review.productId = productId;
            review.starRating = starRating;
            review.ratingDescription = ratingDescription;
            review.reviewDate = reviewDate;
        } else {
            review = new Review({
                username,
                imageURL,
                purchasedItemId,
                starRating,
                ratingDescription,
                reviewDate,
                orderIdString: orderId.toString(),
                productName,
                productId,
                productType,
            });
        }

        await review.save();
        updateProductReviewStatus(username, orderId, purchasedItemId, true);
        res.status(201).json({ message: 'Review submitted successfully.' });
    } catch (error) {
        console.error('Error: ', error);
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
            res.json(review);
        } else {
            res.status(404).json({ message: 'Review not found' });
        }

    } catch (error) {
        console.error('Error: ', error);
        res.status(500).json({ message: 'Server error' });
    }
});

reviewsRouter.delete(`/:purchasedItemId`, async (req, res) => {
    const { purchasedItemId } = req.params;

    let username;
    if (req.session.user) {
        username = req.session.user.username;
    }

    try {
        const review = await Review.findOne({ purchasedItemId });
        const orderId = review.orderIdString;

        if (review) {
            await Review.findByIdAndRemove(review._id);
            updateProductReviewStatus(username, orderId, purchasedItemId);
            res.status(200).json({ message: 'Review deleted successfully.' });
        } else {
            console.log('not deleted')
            console.log('review: ', review);
            res.status(404).json({ message: 'Review not found.' });
        }
    } catch (error) {
        console.error('Error: ', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = reviewsRouter;