/* Require the classics: 

(1) DOTENV, (2a) Express, (2b) App (to use Express), 
(3) Mongoose (to interact with MongoDB), 
(4) CookieParser (to parse/handle HTTP cookies from incoming requests),
(5) Passport (which was configured from a separate file),
(6) Sessions from Express (for user authorization),

*/
require('dotenv').config();
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const passport = require('./passport-config'); // passport was imported in passport-config and configured in that file.
const session = require('express-session');



/* Next, add middlewares to the Express Application:

(1) Express.json (parses incoming requests with JSON payloads, attaching it to the req.body property)
(2) CookieParser (to access incoming cookies)
(3) URLEncoded (to handle HTML form data eventually)
(4) Passport 
(5) Save session for later, because we need to create the Store first.

Middleware functions have access to the request and response objects. App.use() adds this middleware globally to our application.

*/
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));
app.use(passport.initialize());



/* Next, create the MongoDB Store to store session data. */
const MongoDBStore = require('connect-mongodb-session')(session);
const store = new MongoDBStore({
    uri: process.env.MONGODB_URI,
    collection: 'sessions',
});

store.on('error', (error) => {
    console.error('Error connecting to MongoDB for session store:', error);
});

// Need to connect to Mongo DB Database to add TTL
const connect = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useUnifiedTopology: true,
            useNewUrlParser: true
        });
        console.log('Connected to MongoDB');
        createTTLIndex();

        // Create a Time to Live (TTL) index so the session immediately deletes after expiration. It will search for the 'sessions' collection in the database defined by our store and create the index with two paramaters:
        // (1) expires: 1 means that it will add the index to the 'expires' field, and the '1' means that it will sort in ascending order, so the oldest (soonest to expire) will be on top.
        // (2) expireAfterSeconds: 0 means that once expired, it will immediately delete the session from the database.
        // store.client.db().collection('sessions').createIndex(
        //     { expires: 1 },
        //     { expireAfterSeconds: 0 }
        // );

    } catch (error) {
        console.error(error);
    }
}
connect();

const createTTLIndex = () => {
    store.client.db().collection('sessions').createIndex(
        { expires: 1 },
        { expireAfterSeconds: 0 }
    );
    console.log('ttl added');
}

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
        maxAge: 1000 * 2, // 5 seconds


        // HttpOnly makes the cookie inaccessible to JavaScript on the client side, making it more secure and less prone to cross-site scripting attacks.
        httpOnly: true,
    },
}));



/* Next, add the Router middleware and define our routes. */
const router = express.Router();
const productsRouter = require('./routes/productsRouter');
const userRouter = require('./routes/userRouter');

// Mount the router onto the app so we can use the routes.
app.use('/', router);

router.use('/products', productsRouter);
router.use('/users', userRouter);



/* The last of our imports: import any other miscellaneous files. */
const sessionValidation = require('./sessionValidation');



/* Add basic routes that are related to the homepage. */
app.post('/', sessionValidation, (req, res) => {
    res.send('Hello World');
});

app.get('/', sessionValidation, (req, res) => {
    res.send('Hello World');
});



/* Last part: set up the server connection. */
const port = 5000;
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});