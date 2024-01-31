/* STEP ONE: REQUIRE THE CLASSICS
    (1) DOTENV, 
    (2a) Express, 
    (2b) App (to use Express), 
    (3) Mongoose (to interact with MongoDB), 
    (4) CookieParser (to parse/handle HTTP cookies from incoming requests),
    (5) Passport (which was configured from a separate file),
    (6) Sessions from Express (for user authorization),
    (7) CORS (Cross Origin Resource Sharing)
*/
require('dotenv').config();
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const passport = require('./passport-config');
const session = require('express-session');
const cors = require('cors');


/* STEP TWO: ADD MIDDLEWARES TO THE EXPRESS APP
    (1) Express.json (parses incoming requests with JSON payloads, attaching it to the req.body property)
    (2) CookieParser (to access incoming cookies)
    (3) URLEncoded (to handle HTML form data eventually)
    (4) Passport 
    (5) CORS (to allow front end web server to run on different port)
    (6) Session for later, because we need to create the Store first.

Middleware functions have access to the request and response objects. App.use() adds this middleware globally to our application.
*/
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));
app.use(passport.initialize());
app.use(cors({
    credentials: true,
    origin: ['https://verdant-trifle-3e5e76.netlify.app', 'http://localhost:3000']
}));

// app.set("trust proxy", 1);

/* STEP THREE: CREATE THE MONGODB STORE FOR THE SESSIONS */
const MongoDBStore = require('connect-mongodb-session')(session);
const store = new MongoDBStore({
    uri: process.env.MONGODB_URI,
    ttl: 60 * 60 * 24,
    collection: 'sessions',
});

// Handle any errors with the store
store.on('error', (error) => {
    console.error('Error connecting to MongoDB for session store:', error);
});

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: store,
    cookie: {
        maxAge: 1000 * 60 * 60,
        httpOnly: true,
        secure: true,
        sameSite: 'none',
    },
}));


/* STEP FOUR: ADD ROUTER MIDDLEWARE AND ROUTES. */
const router = express.Router();
const productsRouter = require('./routes/productsRouter');
const userRouter = require('./routes/userRouter');
const cartRouter = require('./routes/cartRouter');
const ordersRouter = require('./routes/ordersRouter');
const favoritesRouter = require('./routes/favoritesRouter');
const reviewsRouter = require('./routes/reviewsRouter');
const cloudinaryRouter = require('./routes/cloudinaryRouter');


// Mount the router onto the app so we can use the routes.
app.use('/', router);
router.use('/products', productsRouter);
router.use('/users', userRouter);
router.use('/cart', cartRouter);
router.use('/orders', ordersRouter);
router.use('/favorites', favoritesRouter);
router.use('/reviews', reviewsRouter);
router.use('/cloudinary', cloudinaryRouter);



/* STEP FIVE AKA FINAL STEP: CONNECT MONGODB DATABASE AND SERVER. */
const connect = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useUnifiedTopology: true,
            useNewUrlParser: true
        });
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error(error);
    }
}
connect();

const port = 10000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

