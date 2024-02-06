const express = require('express');
const cartRouter = express.Router();
const User = require('../models/User');
const authenticate = require('../authenticate');
const { getUser } = require('../utils/userUtils');


cartRouter.get('/', authenticate.sessionValidation, async (req, res) => {
    try {
        const user = await getUser(req.session.user._id.toString());
        res.json({ cart: user.cart });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

cartRouter.delete('/', authenticate.sessionValidation, async (req, res) => {
    try {
        const user = await getUser(req.session.user._id.toString());
        user.cart = [];
        await user.save();
        res.json({ message: 'Cart deleted successfully', cart: user.cart });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

cartRouter.put('/allToFav', authenticate.sessionValidation, async (req, res) => {
    try {
        const user = await getUser(req.session.user._id.toString());
        user.favorites.push(...user.cart);
        user.cart = [];
        await user.save();

        res.json({
            message: 'Moved all items from Cart to Favorites successfully',
            cart: user.cart,
            favorites: user.favorites
        });
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
        const user = await getUser(req.session.user._id.toString());
        const indexOfProduct = user.cart.indexOf(productId);

        if (indexOfProduct !== -1) {
            user.cart.splice(indexOfProduct, 1);
            const updatedUser = await user.save();
            res.json(updatedUser);
        } else {
            res.json({ message: 'Product not found in cart.' });
        }
    } catch (error) {
        res.json({ message: 'Server error' });
    }
});

cartRouter.get('/saved', authenticate.sessionValidation, async (req, res) => {
    try {
        const user = await getUser(req.session.user._id.toString());
        res.json({ saved: user.saved });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});


cartRouter.delete('/all/saved', authenticate.sessionValidation, async (req, res) => {
    try {
        const user = await getUser(req.session.user._id.toString());
        user.saved = [];
        await user.save();

        res.json({ message: 'Saved deleted successfully', saved: user.saved });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

cartRouter.post('/all/tocart', authenticate.sessionValidation, async (req, res) => {
    try {
        const user = await getUser(req.session.user._id.toString());
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
        const user = await getUser(req.session.user._id.toString());
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
        const user = await getUser(req.session.user._id.toString());
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
        const user = await getUser(req.session.user._id.toString());
        const indexOfProduct = user.saved.indexOf(productId);

        if (indexOfProduct !== -1) {
            user.saved.splice(indexOfProduct, 1);
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