const express = require('express');
// Create instance of Express application, which will be used to define routes and middleware.
const app = express();

// This adds middleware to the Express application; middleware functions have access to the request and response objects. Express.json() is a built-in middleware provided by the Express framework that parses incoming requests with JSON payloads, attaching it to the req.body property. App.use() adds this middleware globally to our application.
app.use(express.json());

const router = express.Router();
const productsRouter = require('./routes/productsRouter');
const userRouter = require('./routes/userRouter');

router.use('/products', productsRouter);
router.use('/users', userRouter);

// Mount the router as middleware on the main app
app.use('/', router);

app.get('/', (req, res) => {
    res.send('Hello World');
});

const port = 5000;
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
})