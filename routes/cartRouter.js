require('dotenv').config();
const express = require('express');
const cartRouter = express.Router();
const User = require('../models/User');
const authenticate = require('../authenticate');


cartRouter.get('/', authenticate.sessionValidation, async (req, res) => {
    try {
        const userId = req.session.user._id.toString();
        const user = await User.findById(
            { _id: userId }
        );

        res.json({ cart: user.cart });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

cartRouter.delete('/', authenticate.sessionValidation, async (req, res) => {
    try {
        const userId = req.session.user._id.toString();
        const user = await User.findById(
            { _id: userId }
        );

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.cart = [];
        await user.save();

        res.json({ message: 'Cart deleted successfully', cart: user.cart });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

cartRouter.post('/:id', authenticate.sessionValidation, async (req, res) => {
    const productId = req.params.id;

    try {
        const userId = req.session.user._id.toString();
        const updatedUser = await User.findByIdAndUpdate(
            { _id: userId },
            { $push: { cart: productId } },
            { new: true },
        );

        res.json(updatedUser);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

cartRouter.delete('/:id', authenticate.sessionValidation, async (req, res) => {
    const productId = req.params.id;

    try {
        const userId = req.session.user._id.toString();
        const user = await User.findById(userId);

        // Find the index of the first occurrence of the product, since the same item may be added in the cart multiple times.
        const indexOfProduct = user.cart.indexOf(productId);

        if (indexOfProduct !== -1) {
            // If it exist, then remove just that one item from the cart. 
            user.cart.splice(indexOfProduct, 1);
            // Save the updated user
            const updatedUser = await user.save();
            res.json(updatedUser);
        } else {
            res.status(404).json({ message: 'Product not found in cart.' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

cartRouter.get('/saved', authenticate.sessionValidation, async (req, res) => {
    try {
        const userId = req.session.user._id.toString();
        const user = await User.findById(
            { _id: userId }
        );

        res.json({ saved: user.saved });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});


cartRouter.delete('/all/saved', authenticate.sessionValidation, async (req, res) => {
    try {
        const userId = req.session.user._id.toString();
        const user = await User.findById(
            { _id: userId }
        );

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.saved = [];
        await user.save();

        res.json({ message: 'Saved deleted successfully', saved: user.saved });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

cartRouter.post('/all/tocart', authenticate.sessionValidation, async (req, res) => {
    try {
        const userId = req.session.user._id.toString();
        const user = await User.findById(
            { _id: userId }
        );

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.cart.push(...user.saved);
        user.saved = [];
        await user.save();

        res.json({ message: 'Saved items moved to cart successfully', saved: user.saved, cart: user.cart });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

cartRouter.post('/all/tosaved', authenticate.sessionValidation, async (req, res) => {
    try {
        const userId = req.session.user._id.toString();
        const user = await User.findById(
            { _id: userId }
        );

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.saved.push(...user.cart);
        user.cart = [];
        await user.save();

        res.json({ message: 'Saved items moved to cart successfully', saved: user.saved, cart: user.cart });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

cartRouter.post('/saved/:id', authenticate.sessionValidation, async (req, res) => {
    const productId = req.params.id;

    try {
        const userId = req.session.user._id.toString();
        const user = await User.findById(userId);
        const indexOfProduct = user.cart.indexOf(productId);

        if (indexOfProduct !== -1) {
            user.cart.splice(indexOfProduct, 1);
            user.saved.push(productId);
            const updatedUser = await user.save();
            res.json(updatedUser);
        } else {
            return res.status(404).json({ message: 'Product cannot be saved' });
        }

    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

cartRouter.delete('/saved/:id', authenticate.sessionValidation, async (req, res) => {
    const productId = req.params.id;

    try {
        const userId = req.session.user._id.toString();
        const user = await User.findById(userId);

        // Find the index of the first occurrence of the product, since the same item may be added in the cart multiple times.
        const indexOfProduct = user.saved.indexOf(productId);

        if (indexOfProduct !== -1) {
            // If it exist, then remove just that one item from the cart. 
            user.saved.splice(indexOfProduct, 1);
            // Save the updated user
            const updatedUser = await user.save();
            res.json(updatedUser);
        } else {
            res.status(404).json({ message: 'Product not found in cart.' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = cartRouter;