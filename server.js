require('dotenv').config();
const express = require('express');
// Create instance of Express application, which will be used to define routes and middleware.
const app = express();
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');

// This adds middleware to the Express application; middleware functions have access to the request and response objects. Express.json() is a built-in middleware provided by the Express framework that parses incoming requests with JSON payloads, attaching it to the req.body property. App.use() adds this middleware globally to our application. CookieParser allows us to handle cookies properly throughout our application.
app.use(express.json());
app.use(cookieParser());

const flash = require('express-flash');
const passport = require('passport');
const session = require('express-session');

// Bodyparser
app.use(express.urlencoded({ extended: false }));

// Express session
// app.use(session({
//     secret: process.env.SESSION_SECRET,
//     resave: false,
//     saveUninitialized: false
// }));

// Passport middleware
app.use(passport.initialize());
// app.use(passport.session());

// Connect flash
app.use(flash());

const { validateToken, requireAuth } = require('./JWT');

const router = express.Router();
const productsRouter = require('./routes/productsRouter');
const userRouter = require('./routes/userRouter');

router.use('/products', productsRouter);
router.use('/users', userRouter);

// Mount the router as middleware on the main app
app.use('/', router);

app.post('/', validateToken, (req, res) => {
    res.send('Hello World');
});

app.get('/', validateToken, requireAuth, (req, res) => {
    res.send('Hello World');
});

const connect = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI), {
            useUnifiedTopology: true,
            useNewUrlParser: true
        };
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error(error);
    }
}

connect();

const port = 5000;
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});