const express = require('express');
const ordersRouter = express.Router();
const Product = require('../models/Product');
const User = require('../models/User');
const authenticate = require('../authenticate');
const Order = require('../models/Order');

ordersRouter.get('/', authenticate.sessionValidation, async (req, res) => {

    try {
        const userId = req.session.user._id.toString();
        const user = await User.findById(userId);

        const orders = user.orders;

        if (orders) {
            orders.sort((a, b) => b.orderDate.getTime() - a.orderDate.getTime());
            return res.json(orders);
        }

        return res.send('No orders');
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});


ordersRouter.get('/all', authenticate.checkAdmin, authenticate.sessionValidation, async (req, res) => {

    try {

        const orders = await Order.find();

        if (orders) {
            orders.sort((a, b) => b.orderDate.getTime() - a.orderDate.getTime());
            console.log('orders: ', orders);
            return res.json(orders);
        }

        return res.send('No orders');
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});



module.exports = ordersRouter;