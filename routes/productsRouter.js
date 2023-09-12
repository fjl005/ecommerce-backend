const express = require('express');
const productsRouter = express.Router();
const Product = require('../models/Product');
const User = require('../models/User');

productsRouter.get('/', async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

productsRouter.get('/:productId', async (req, res) => {
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


productsRouter.post('/', async (req, res) => {
    try {
        const newProduct = {
            name: 'Two Page Airbnb Template',
            price: 4.50,
            description: 'This is my product description nice.',
            type: 'Digital',
        };
        Product.create(newProduct)
            .then(() => {
                return res.json('Product created');
            }).catch((err) => {
                return res.status(400).json({ error: err })
            })
    } catch (error) {
        res.status(500).send('Sorry there was an error posting a product.');
    }
});

productsRouter.get('/orders', async (req, res) => {

    try {
        const userId = req.session.user._id.toString();
        const user = await User.findById(userId);

        const orders = user.orders;

        if (orders) {
            return res.json(orders);
        }

        return res.send('No orders');
    } catch (error) {
        // res.status(500).json({ message: 'Server error' });
        res.status(500).json({ message: 'haha' });

    }
});

productsRouter.post('/verifyCard', async (req, res) => {
    try {
        const userId = req.session.user._id.toString();
        const user = await User.findById(userId);

        const adminArr = await User.find({ admin: true });
        const mastercard = adminArr[0].mastercard;

        const fieldsToCompare = [
            'email', 'cardExpires', 'cardNumber', 'cardCVC',
            'firstName', 'lastName', 'streetAddress', 'city',
            'state', 'zipCode'
        ];

        const mismatchedFields = fieldsToCompare.filter(field => req.body[field] !== mastercard[field]);

        if (mismatchedFields.length === 0) {
            // All fields match
            console.log('All card information matched');
            /*

            COUPLE THINGS I NEED TO DO:
            (1) REMOVE THE ITEMS FROM THE CART, THEN PLACE THEM IN AN 'ORDERS' PROPERTY IN MONGODB
            (2) That might be it actually lmao.

            */
            const cart = user.cart;
            const cartInfoByProduct = [];


            // Create an array to store the promises
            const promises = [];

            for (const productIdObject of cart) {
                const productId = productIdObject.toString();
                try {
                    const promise = await Product.findById(productId);
                    console.log('promise: ', promise);
                    promises.push(promise);

                    cartInfoByProduct.push({
                        productId: promise._id.toString(),
                        name: promise.name,
                        price: promise.price,
                        description: promise.description,
                        productType: promise.productType
                    });

                } catch (error) {
                    console.log('error: ', error);
                }
            }

            await Promise.all(promises);

            const currentDate = new Date();

            console.log('cart info to add: ', cartInfoByProduct);

            const orderAdded = {
                items: cartInfoByProduct,
                orderDate: currentDate,
                totalCost: req.body.totalCost
            }

            const updatedUser = await User.findByIdAndUpdate(
                { _id: userId },
                {
                    $push: { orders: orderAdded },
                    $set: { "cart": [] },
                },
                { new: true },
            );

            console.log('user: ', updatedUser);

            return res.status(200).send('All card information matched');
        } else {
            // Some fields do not match
            console.log('Card information does not match for:', mismatchedFields);
            return res.status(400).send('Some card information incorrect');
        }
    } catch (error) {
        res.status(500).send('Sorry there was an error with your card.');
    }
});



module.exports = productsRouter;