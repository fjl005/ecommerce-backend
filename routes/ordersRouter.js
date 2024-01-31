const express = require('express');
const mongoose = require('mongoose');
const ordersRouter = express.Router();
const authenticate = require('../authenticate');
const Order = require('../models/Order');

ordersRouter.get('/', authenticate.checkAdmin, authenticate.sessionValidation, async (req, res) => {

    try {
        const orders = await Order.find();
        let totalBalance = 0;
        if (orders) {
            orders.sort((a, b) => b.orderDate.getTime() - a.orderDate.getTime());
            for (let order of orders) {
                for (let item of order.items) {
                    totalBalance += item.price;
                }
            }
            return res.json({ orders, totalBalance });
        }
        return res.send('No orders');
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

ordersRouter.get('/user', authenticate.sessionValidation, async (req, res) => {
    try {
        const userId = req.session.user._id.toString();
        const orders = await Order.find({ userId });

        if (orders) {
            orders.sort((a, b) => b.orderDate.getTime() - a.orderDate.getTime());
            return res.json(orders);
        }

        return res.send('No orders');
    } catch (error) {
        console.log('error: ', error);
        res.status(500).json({ message: 'Server error' });
    }
});

ordersRouter.get('/user/:orderId', authenticate.sessionValidation, async (req, res) => {
    const orderId = req.params.orderId;
    const orderIdObj = new mongoose.Types.ObjectId(orderId);

    try {
        const userId = req.session.user._id.toString();
        const order = await Order.findOne({ userId, _id: orderIdObj });

        if (order) {
            return res.json(order);
        }

        return res.send('No orders');
    } catch (error) {
        console.log('error: ', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = ordersRouter;