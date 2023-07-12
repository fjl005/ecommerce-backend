const express = require('express');
const productsRouter = express.Router();

productsRouter.get('/', (req, res) => {
    res.send('Welcome to the products section');
});

module.exports = productsRouter;