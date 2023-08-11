const express = require('express');
const productsRouter = express.Router();
const Product = require('../models/Product');

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

module.exports = productsRouter;