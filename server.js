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
const passport = require('./passport-config'); // passport was imported in passport-config and configured in that file.
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
    origin: 'https://ambiguous-pest-production.up.railway.app/'
    // origin: 'http://localhost:3000',
}));



/* STEP THREE: CREATE THE MONGODB STORE FOR THE SESSIONS */
const MongoDBStore = require('connect-mongodb-session')(session);
const store = new MongoDBStore({
    uri: process.env.MONGODB_URI,
    // TTL: Time to Live Index, which will automatically delete the session from the Database after number of seconds had expired.
    ttl: 60 * 60 * 24,
    collection: 'sessions',
});

// Handle any errors with the store
store.on('error', (error) => {
    console.error('Error connecting to MongoDB for session store:', error);
});

app.use(session({
    // The secret is used to sign the session ID cookie.
    secret: process.env.SESSION_SECRET,

    // Resave will save the session data to the store on every request, even if the session didn't change. Setting it to false will reduce unnecessary writes to the session store. This is handy if you need to track every request, such as the time of the request sent (which may be used to track activity/inactivity).
    resave: false,

    // Save Uninitialized determines whether to save sessions that did not modify the session data (ex: create sessions for all visitors). In my case, I want it to be false because I only want sessions when people are signed in (aka, updating the session data).
    saveUninitialized: false,

    // Store is the session store used for storing the session data. This comes from MongoDBStore as defined above.
    store: store,

    // Defines options for our cookie
    cookie: {
        // maxAge: 1000 * 60 * 60 * 24, // 1 day (1 second * 60 seconds/min * 60 min/hr * 24 hrs/day)
        maxAge: 1000 * 60 * 60, // 1 hour

        // HttpOnly makes the cookie inaccessible to JavaScript on the client side, making it more secure and less prone to cross-site scripting attacks.
        httpOnly: true,
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


/* STEP FIVE: INCLUDE MISCELLANEOUS IMPORTS. */
const authenticate = require('./authenticate');


/* STEP SIX: ADD BASIC ROUTES FOR THE PAGES. */
app.post('/', authenticate.sessionValidation, (req, res) => {
    res.send('Hello World');
});

app.get('/', authenticate.sessionValidation, (req, res) => {
    res.send('Hello World');
});

// app.post('/cloudinary', async (req, res) => {
//     try {
//         res.statusCode = 200;
//         res.send('successful');
//     } catch (error) {
//         console.log('Error: ', error);
//         res.status(500).json({ error: 'Internal Server Error' });
//     }
// });

// app.delete(`/cloudinary/:publicId`, async (req, res) => {
//     const publicId = req.params.publicId;
//     try {
//         await cloudinary.uploader.destroy(publicId);
//     } catch (error) {
//         console.log('Error: ', error);
//         res.status(500).json({ error: 'Internal Server Error from .delete for /cloudinary/imgObjId endpoint' });
//     }
// });

/* STEP SEVEN AKA FINAL STEP: CONNECT MONGODB DATABASE AND SERVER. */
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

const port = 5000;
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

