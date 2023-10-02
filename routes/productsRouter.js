const express = require('express');
const productsRouter = express.Router();
const Product = require('../models/Product');
const User = require('../models/User');
const Order = require('../models/Order');
const authenticate = require('../authenticate');


// GET OPERATIONS
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
            return res.status(404).json({ message: 'No products found for the given id.' });
        }
        res.json(product);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
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


// PUT OPERATIONS
productsRouter.put('/:productId', async (req, res) => {
    const productId = req.params.productId;
    const { name, price, description, productType } = req.body;

    try {
        const product = await Product.findByIdAndUpdate(
            { _id: productId },
            {
                name,
                price,
                description,
                productType
            },
            { new: true } // Return the updated document
        );
        if (product.length === 0) {
            return res.status(404).json({ message: 'No products found for the given id.' });
        }
        console.log('product: ', product);
        res.json(product);
    } catch (error) {
        res.status(500).json({ message: 'error in PUT for /product/:productId', error });
    }
});


productsRouter.put('/multiple/items', async (req, res) => {
    const { productIds, updatedInfo } = req.body;
    const { name, price, description, productType } = updatedInfo;

    try {
        const updatedProducts = [];

        for (let productId of productIds) {
            const product = await Product.findByIdAndUpdate(
                { _id: productId },
                {
                    name,
                    price,
                    description,
                    productType,
                },
                { new: true } // Return the updated document
            );

            if (!product) {
                return res.status(404).json({ message: 'No product found for the given id.' });
            }

            updatedProducts.push(product);
        }

        console.log('updatedProducts: ', updatedProducts);
        res.json(updatedProducts[0]);
    } catch (error) {
        res.status(500).json({ message: 'error in PUT for /product/:productId', error });
    }
});




// DELETE OPERATIONS
productsRouter.delete('/:productId', async (req, res) => {
    const productId = req.params.productId;
    try {
        const productToDelete = await Product.findById(productId);

        if (!productToDelete) {
            return res.status(404).json({ message: 'No products found for the given id.' });
        }

        await Product.findByIdAndDelete(productId);

        res.json({ message: 'Product deleted successfully', deletedProduct: productToDelete });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

productsRouter.delete('/multiple/items', async (req, res) => {
    const itemSelectedIdArr = req.body;
    console.log('itemSelectedIdArr: ', itemSelectedIdArr);
    try {

        for (let productId of itemSelectedIdArr) {
            const productToDelete = await Product.findById(productId);
            if (!productToDelete) {
                return res.status(404).json({ message: 'No products found for the given id.' });
            }

            await Product.findByIdAndDelete(productId);
        }

        res.json({ message: 'Multiple products deleted successfully', deletedProducts: itemSelectedIdArr });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});


// POST OPERATIONS
productsRouter.post('/', authenticate.checkAdmin, async (req, res) => {
    const { name, price, description, productType } = req.body;
    try {
        const newProduct = {
            name,
            price,
            description,
            productType,
        };
        console.log('new Product: ', newProduct);
        Product.create(newProduct)
            .then(() => {
                return res.json({ message: 'product created', product: newProduct });
            }).catch((err) => {
                console.log('error: ', err);
                return res.status(400).json({ error: err })
            })
    } catch (error) {
        res.status(500).send('Sorry there was an error posting a product.');
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

            // REMOVE THE ITEMS FROM THE CART, THEN PLACE THEM IN AN 'ORDERS' PROPERTY IN MONGODB
            const cart = user.cart;
            const cartInfoByProduct = [];

            // Create an array to store the promises
            const promises = [];

            for (const productIdObject of cart) {
                const productId = productIdObject.toString();
                try {
                    const promise = await Product.findById(productId);
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

            const orderAdded = {
                items: cartInfoByProduct,
                orderDate: currentDate,
                totalCost: req.body.totalCost,
                username: user.username,
                userId: userId,
            }

            // const updatedUser = await User.findByIdAndUpdate(
            //     { _id: userId },
            //     {
            //         $push: { orders: orderAdded },
            //         $set: { "cart": [] },
            //     },
            //     { new: true },
            // );

            const updatedUser = await User.findByIdAndUpdate(
                { _id: userId },
                {
                    $set: { "cart": [] },
                },
                { new: true },
            );

            const postOrder = await Order.create(orderAdded);

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