const express = require('express');
const productsRouter = express.Router();
const Product = require('../models/Product');
const User = require('../models/User');
const Order = require('../models/Order');
const authenticate = require('../authenticate');


productsRouter.get('/', async (req, res) => {
    try {
        const products = await Product.find();
        products.sort((a, b) => b.datePosted - a.datePosted);
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

productsRouter.get('/:productId', async (req, res) => {
    const productId = req.params.productId;
    try {
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'No Product' });
        }
        res.json(product);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

productsRouter.get('/search/:searchQuery', async (req, res) => {
    const searchQuery = req.params.searchQuery;

    try {
        const allproducts = await Product.find();
        if (allproducts.length === 0) {
            return res.status(404).json({ message: 'No products found for the given id.' });
        }

        const productsWithName = allproducts.filter((product) => product.productName.toLowerCase().includes(searchQuery.toLowerCase()));
        res.json(productsWithName);
    } catch (error) {
        console.error('Error: ', error);
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
        res.status(500).json({ message: 'Server error' });
    }
});


// PUT OPERATIONS
productsRouter.put('/:productId', async (req, res) => {
    const productId = req.params.productId;
    const { productName, price, description, productType, deletePublicIdArr, newImageData, } = req.body.uploadInfo;

    try {
        const updatedImageData = await productSearchImageUpdate(productId, deletePublicIdArr, newImageData);

        const productUpdate = await Product.findByIdAndUpdate(
            { _id: productId },
            {
                productName,
                price,
                description,
                productType,
                pictures: updatedImageData
            },
            { new: true }
        );
        if (!productUpdate) {
            return res.status(404).json({ message: 'No products found for the given id.' });
        }
        res.json(productUpdate);
    } catch (error) {
        console.error('Error: ', error);
        res.status(500).json({ message: 'error in PUT for /product/:productId', error });
    }
});


productsRouter.put('/multiple/items', async (req, res) => {
    const { itemsSelectedIdArr, uploadInfo } = req.body;
    const {
        productName,
        price,
        description,
        productType,
        deletePublicIdArr,
        newImageData
    } = uploadInfo;

    try {
        const updatedProducts = [];

        for (let productId of itemsSelectedIdArr) {

            const updatedImageData = await productSearchImageUpdate(productId, deletePublicIdArr, newImageData);

            const productUpdate = await Product.findByIdAndUpdate(
                { _id: productId },
                {
                    productName,
                    price,
                    description,
                    productType,
                    pictures: updatedImageData
                },
                { new: true }
            );

            if (!productUpdate) {
                return res.status(404).json({ message: 'No product found for the given id.' });
            }

            updatedProducts.push(productUpdate);
        }

        res.json(updatedProducts[0]);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'error in PUT for /product/:productId', error });
    }
});

const productSearchImageUpdate = async (productId, deletePublicIdArr, newImageData) => {

    const productSearch = await Product.findById({ _id: productId });

    const pictures = productSearch.pictures;
    let updatedPictures = pictures;

    if (deletePublicIdArr && deletePublicIdArr.length > 0) {
        // Filter out images with publicIds in deletePublicId
        updatedPictures = pictures.filter(({ publicId }) => !deletePublicIdArr.includes(publicId));
    }

    // Concatenate updatedPictures with newImageData
    return Array.isArray(newImageData) ? [...updatedPictures, ...newImageData] : updatedPictures;
}



// DELETE OPERATIONS
productsRouter.delete('/:productId', authenticate.checkAdmin, async (req, res) => {
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
    const itemsSelectedIdArr = req.body;
    try {

        for (let productId of itemsSelectedIdArr) {
            const productToDelete = await Product.findById(productId);
            if (!productToDelete) {
                return res.status(404).json({ message: 'No products found for the given id.' });
            }

            await Product.findByIdAndDelete(productId);
        }

        res.json({ message: 'Multiple products deleted successfully', deletedProducts: itemsSelectedIdArr });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});


// POST OPERATIONS
productsRouter.post('/', authenticate.checkAdmin, async (req, res) => {
    const { productName, price, description, productType, pictures } = req.body.uploadInfo;
    try {
        const today = new Date();
        const newProduct = {
            productName,
            price,
            description,
            productType,
            pictures,
            datePosted: today
        };

        await Product.create(newProduct);
        res.json({ message: 'product created', product: newProduct });
    } catch (error) {
        console.error('Error: ', error);
        res.status(400).json({ error: error.message || 'Unknown error occurred' });
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

                    let pictureURLArr = [];
                    if (promise.pictures && promise.pictures.length > 0) {
                        let picObj = { url: promise.pictures[0].url };
                        pictureURLArr.push(picObj);
                    }

                    cartInfoByProduct.push({
                        productId: promise._id.toString(),
                        productName: promise.productName,
                        price: promise.price,
                        description: promise.description,
                        productType: promise.productType,
                        pictures: pictureURLArr
                    });

                } catch (error) {
                    console.error('Error: ', error);
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

            await User.findByIdAndUpdate(
                { _id: userId },
                { $set: { "cart": [] }, },
                { new: true },
            );

            const postOrder = await Order.create(orderAdded);

            return res.status(200).json({ message: 'All card information matched', orderId: postOrder._id.toString() });
        } else {
            // Some fields do not match
            console.log('Card information does not match for:', mismatchedFields);
            return res.status(400).send('Some card information incorrect');
        }
    } catch (error) {
        console.error('Error: ', error)
        res.status(500).send('Sorry there was an error with your card.');
    }
});

module.exports = productsRouter;