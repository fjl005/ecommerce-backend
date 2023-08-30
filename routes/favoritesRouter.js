require('dotenv').config();
const express = require('express');
const favoritesRouter = express.Router();
const User = require('../models/User');
const authenticate = require('../authenticate');
const Product = require('../models/Product');


favoritesRouter.get('/', authenticate.sessionValidation, async (req, res) => {
    const username = req.session.user.username;

    try {
        const user = await User.findOne({ username });
        res.json({ favorites: user.favorites });
    } catch (error) {
        console.log('error: ', error);
        res.status(500).send('Error with Favorites Fetch Call.')
    }
});

favoritesRouter.post('/', authenticate.sessionValidation, async (req, res) => {
    const productId = req.body.productId;

    try {
        const userId = req.session.user._id.toString();
        const updatedUser = await User.findByIdAndUpdate(
            { _id: userId },
            { $push: { favorites: productId } },
            { new: true },
        );

        res.json(updatedUser);
    } catch (error) {
        console.log('error: ', error);
        res.status(500).send('Error with Favorites Fetch Call.')
    }
});

favoritesRouter.get('/:productId', authenticate.sessionValidation, async (req, res) => {
    const productId = req.params.productId;

    try {
        const product = await Product.findById(productId);
        if (product.length === 0) {
            return res.status(404).json({ message: 'No products found for the given username.' });
        }
        res.json(product);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});



module.exports = favoritesRouter;