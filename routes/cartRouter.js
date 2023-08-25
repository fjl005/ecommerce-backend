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

        console.log('user cart', user.cart);

        res.json({ cart: user.cart });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

cartRouter.post('/', authenticate.sessionValidation, async (req, res) => {
    const data = req.body.product;
    console.log('data: ', data);
    const product = {
        name: data.name,
        price: data.price,
        description: data.description,
        productType: data.productType
    }

    console.log('product: ', product);

    try {
        const userId = req.session.user._id.toString();
        const updatedUser = await User.findByIdAndUpdate(
            { _id: userId },
            {
                $push: { cart: product }
            },
            { new: true },
        );
        console.log('updated user: ', updatedUser);

        res.json(updatedUser);
    } catch (error) {
        console.log('error: ', error);
        res.status(500).json({ message: 'Server error' });
    }
});

cartRouter.delete('/:id', authenticate.sessionValidation, async (req, res) => {
    const cartItemId = req.params.id;

    try {
        const userId = req.session.user._id.toString();
        const user = await User.findById(userId);

        // Find the index of the first occurrence of the product, since the same item may be added in the cart multiple times.
        // const indexOfProduct = user.cart.indexOf(productId);

        // Filter out the cart item with the specified _id
        const originalCartLength = user.cart.length;

        user.cart = user.cart.filter((cartItem) => {
            return cartItem._id.toString() !== cartItemId;
        });
        // console.log('filtered cart length: ', filteredCart);
        await user.save();
        res.json(user);

        // Check if the cart item was found and removed
        // if (filteredCart.length !== originalCartLength) {
        //     // Save the updated user
        //     user.cart = filteredCart;
        //     const updatedUser = await user.save();
        //     res.json(updatedUser);
        // } else {
        //     res.status(404).json({ message: 'Product not found in cart.' });
        // }

        // user.cart.filter((cartItem) => cartItem._id === cartItemId);


        // if (indexOfProduct !== -1) {
        //     // If it exist, then remove just that one item from the cart. 
        //     user.cart.splice(indexOfProduct, 1);
        //     // Save the updated user
        //     const updatedUser = await user.save();
        //     res.json(updatedUser);
        // } else {
        //     res.status(404).json({ message: 'Product not found in cart.' });
        // }
    } catch (error) {
        console.log('made it here')
        console.log('error: ', error);

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

cartRouter.post('/saved/:id', authenticate.sessionValidation, async (req, res) => {
    const productId = req.params.id;

    try {
        const userId = req.session.user._id.toString();
        const user = await User.findById(userId);
        const indexOfProduct = user.cart.indexOf(productId);
        console.log('user: ', user);

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