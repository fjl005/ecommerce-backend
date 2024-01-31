require('dotenv').config();
const express = require('express');
const favoritesRouter = express.Router();
const User = require('../models/User');
const authenticate = require('../authenticate');
const Product = require('../models/Product');
const { getUser } = require('../utils/userUtils');


favoritesRouter.get('/', authenticate.sessionValidation, async (req, res) => {
    try {
        const user = await getUser(req.session.user._id.toString());
        user.favorites;
        await user.save();
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

favoritesRouter.delete('/', authenticate.sessionValidation, async (req, res) => {
    try {
        const user = await getUser(req.session.user._id.toString());
        user.favorites = [];
        await user.save();
        res.json({ message: 'Favorites deleted successfully', favorites: user.favorites });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

favoritesRouter.put('/moveItemFromCart', authenticate.sessionValidation, async (req, res) => {
    const { productId, origin } = req.body;

    try {
        const user = await getUser(req.session.user._id.toString());
        user.favorites.push(productId);

        if (origin === 'cart') {
            user.cart.splice(user.cart.indexOf(productId), 1);
        } else if (origin === 'saved') {
            user.saved.splice(user.saved.indexOf(productId), 1);
        }

        await user.save();
        res.json({ message: 'Favorites moved to Cart.', cart: user.cart, favorites: user.favorites });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});


favoritesRouter.put('/allToCart', authenticate.sessionValidation, async (req, res) => {
    try {
        const user = await getUser(req.session.user._id.toString());
        user.cart.push(...user.favorites);
        user.favorites = [];
        await user.save();
        res.json({ message: 'Favorites moved to Cart.', cart: user.cart, favorites: user.favorites });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

favoritesRouter.delete('/:productId', authenticate.sessionValidation, async (req, res) => {
    const productId = req.params.productId;

    try {
        const user = await getUser(req.session.user._id.toString());
        const indexOfProduct = user.favorites.indexOf(productId);

        if (indexOfProduct !== -1) {
            user.favorites.splice(indexOfProduct, 1);
            const updatedUser = await user.save();
            return res.json(updatedUser);
        }
        return res.status(404).json({ message: 'Product not found in Favorites.' });
    } catch (error) {
        console.log('error: ', error);
        res.status(500).send(`Error with deleting item (product id ${productId})from Favorites.`);
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


favoritesRouter.post('/cart/:productId', authenticate.sessionValidation, async (req, res) => {
    const productId = req.params.productId;

    try {
        const user = await getUser(req.session.user._id.toString());
        const indexOfProduct = user.favorites.indexOf(productId);
        if (indexOfProduct !== -1) {
            user.favorites.splice(indexOfProduct, 1);
            user.cart.push(productId);
            const updatedUser = await user.save();
            return res.json(updatedUser);
        }
        return res.status(404).json({ message: 'Product cannot be added to Cart from Favorites.' });
    } catch (error) {
        console.log('error: ', error);
        res.status(500).send(`Error with deleting item (product id ${productId})from Favorites.`);
    }
});

module.exports = favoritesRouter;