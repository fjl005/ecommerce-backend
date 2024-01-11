const express = require('express');
const mongoose = require('mongoose');
const ordersRouter = express.Router();
const Product = require('../models/Product');
const User = require('../models/User');
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
                    console.log('item: ', item);
                    console.log('item cost: ', item.price);
                    console.log(typeof (item.price))
                    console.log('total balance: ', totalBalance);
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
            console.log('orders: ', orders);
            return res.json(orders);
        }

        console.log('orders: ', orders);

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
            console.log('order: ', order);
            return res.json(order);
        }

        return res.send('No orders');
    } catch (error) {
        console.log('here');
        console.log('error: ', error);
        res.status(500).json({ message: 'Server error' });
    }
});



module.exports = ordersRouter;