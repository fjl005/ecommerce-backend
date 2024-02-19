const express = require('express');
const ordersRouter = express.Router();
const authenticate = require('../authenticate');
const Order = require('../models/Order');
const mongoose = require('mongoose');

ordersRouter.get('/', authenticate.checkAdmin, authenticate.sessionValidation, async (req, res) => {

    try {
        const orders = await Order.find();
        if (orders) {
            orders.sort((a, b) => b.orderDate.getTime() - a.orderDate.getTime());
            const totalBalance = orders.reduce((acc, order) => {
                return acc + order.items.reduce((subTotal, item) => subTotal + item.price, 0);
            }, 0);
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
        console.error('Error: ', error);
        res.status(500).json({ message: 'Server error' });
    }
});

ordersRouter.put('/user', authenticate.sessionValidation, async (req, res) => {
    const { currUsername, newUsername } = req.body;

    try {
        const orders = await Order.find({ username: currUsername });

        if (orders) {
            orders.sort((a, b) => b.orderDate.getTime() - a.orderDate.getTime());
            for (let order of orders) {
                order.username = newUsername
                await order.save();
            }

            return res.json(orders);
        }

        return res.send('No orders');
    } catch (error) {
        console.error('Error: ', error);
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
        console.error('Error: ', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = ordersRouter;