# Fetsy Shop Online Breakdown

[Click here](https://docs.google.com/document/d/1InjN3bFsKLVa0xcN26yEWKxc4qPYFyhpFlj_no1M6ok/edit) to see the full edits on my Google Doc (with pictures).


## Introduction
Rewinding back to June of 2023, there were two key components of my life that intertwined into this project:
- I ran an Etsy Shop (and still do today), selling digital cards and templates of various types
- I finished up my coding bootcamp, and wanted to further my knowledge of user authentication, administrator authorization, and manipulation of data from a data storage via Node.JS, Express, and MongoDB.

I then thought to myself, “wouldn’t it be a great idea to implement what I’ve learned from NuCamp to recreate my own online shop apart from Etsy?”

Thus, the idea was born, and I was ready to commit the next several months to this endeavor.


## Why It Matters
On Etsy, my average product price is about $4.50 per template. Etsy takes essentially half of that from fees and advertising. While the difference between $2.25 and $4.50 isn’t much, the difference is definitely noticeable if I make, for example, 100 sales in a given month ($225 vs $450). 

As a goal to combat these fees, I would like to create my own ecommerce platform so that I don’t need to implement any additional fees, taking nearly 100% of the sales as profit.

I do acknowledge, however, that this project in its entirety will take many months and perhaps years to have every component of the site functioning professionally and perfectly. Beyond the minimum viable product, I’m talking:
- Incorporating seamless user interfaces paired with professional graphic design,
- Managing data storage securely and sustainably to a larger scale,
- Marketing and driving customers to my shop via social media platforms,
- Overseeing and handling actual financial payments,
- Creating a mobile version via React Native,
- Establishing opportunities to run sales and coupons.

So, for this current project, my focus is to create the minimum viable product (MVP). When I successfully transition into the web developer industry, I’ll revisit this project and plan to complete it entirely. 


## The Solution
At its core, the MVP should have login authentication, items available to purchase, and administrator privilege to add/edit products.

More specifically, the MVP should accomplish the following:
- Allow users to log in and out, with their information securely stored and passwords hashed/salted,
- Enable one specific user, the admin, to add more products, edit and delete existing products, and access all orders and reviews.
- Provide the general public (not logged in) the ability to only view products
- Offer ecommerce essential functions, such as adding/removing items to/from your cart, purchasing these items, accessing your orders, and leaving reviews.


## Setting up the Backend
Before even setting up any frontend code, I wanted to make sure that I was able to set up the backend correctly, since user authentication plays a large role in the purpose of this project. So, it made sense to start with crafting the Node.JS server. 

To set up the backend, we’ll need to go through the following:
1. With Node.js, set up Express Application in a server.js file
2. Configure Passport
3. Finish server.js file setup. 

Now, we’ll go through these one by one.

### (1) Set up Express Application in server.js (Part 1)
Before diving into the code, I needed to figure out the requirements for my application. In a nutshell, these include:
- **Express**: the main framework for the backend server that will simplify the process of handling HTTP requests, defining routes, and implementing middleware.
- **User authentication**: People need to login to access their accounts, as well as logout.
- **Session management**: Given the statelessness of HTTP requests, I can’t have logged-in users passing their username and password with following requests; that’d be a major security risk! Instead, I need to use some form of session management.
- **Database storage**: I need to store user info as well as other shop-related items (products, reviews, orders, etc.) in some database. And with this database, I need to perform CRUD operations (create users, get user info, update users, delete users, same principle applied to any other feature).

**With these main principles in mind, let’s go ahead and start by importing the necessary modules.**

#### A) Import Necessary Modules
- **Express**: we need to import express and implement it into our application, which can be accomplished by creating an instance of Express with **const app = express()**. Now, whenever we use the instance ‘app’, we are referring to our instantiated Express application. This will especially come in handy when we start defining our routes and introducing our middleware (more on these later)
- **User Authentication**: Authentication will be handled by a middleware called **Passport**. This will be discussed in further detail later, as a separate file was created to configure the passport. So, we will import the configured passport.
- **Session Management**: When you successfully log in, we will need to create a session so that subsequent HTTP requests can have the session ID attached to authenticate our user. Thus, the following will be needed:
  - **Session**: we’ll need access to session management provided by the express-session package.
  - **CookieParser**: to parse cookies from incoming requests, since the sessions will be stored in the browser’s cookie. Otherwise, without this, we won’t be able to parse the cookies.
  - **CORS (Cross-Origin Resource Sharing)**: this isn’t specific to session, but while on the topic of HTTP requests, we need CORS because the frontend application will be from a different domain. To allow these requests, we need CORS. Due to security reasons, the default is to not allow requests from a different origin.
- **Database Storage**: we need to access sessions, user info, product info, etc. from a database. For this project, we’ll use MongoDB. To interact with MongoDB in Node.js, we need to import mongoose, which allows us to define schemas and perform CRUD operations with MongoDB. Mongoose is an object data modeling (ODM) library. 
  - Additionally, we’ll need a **dotenv** file to connect to the MongoDB database. The dotenv file is used to store environment variables that should be kept secret from the public. 

#### B) Introduce Middlewares
Now, with these imports out of the way, let’s get into middleware functions, which are used in the processing pipeline of incoming HTTP requests and outgoing HTTP responses. They are called “middlewares” because they operate in the middle of the client’s request and the server’s response. Thus, middleware functions have access to the request and response objects. 

In Express, middlewares can be introduced by using the .use method on the ‘app’ instance defined from the previous section. 
The middlewares used in this server include:
- **express.json()**: This parses the req.body property of incoming requests with a Content-Type of application/json, making it available to access. Without this, we would have to manually parse the JSON data with every request.
- **cookieParser()**: As mentioned earlier, this parses cookies attached to the client’s request, making it easier to work with cookies and therefore access the session ID.
- **express.urlencoded()**: This parses incoming request bodies encoded in URL-encoded format that are sent with Content-Type as ‘application/x-www-form-urlencoded’ (typically with form data).
  - **URL-encoded**: refers to data with special characters replaced with ‘%XX’, where the ‘XX’ represents the two hexadecimal digits of the character’s ASCII code. For example, ‘!’ is replaced by ‘%21.’ **This format is used in form submissions and is generally good practice for safety and compatibility.**
  - Without URL encoding, special characters, spaces, and non-ASCII characters would not be transmitted correctly in the URL. This prevents special characters like ‘&’ and ‘=’ from being misinterpreted as part of the URL structure. Additionally, spaces aren’t even allowed in the URL.
  - This function takes an object that could be of select properties, but in this case we set the **extended property to false**. In doing so, we can only utilize the **querystring library** as opposed to the **qs librar**y. Qs library isn’t necessary for our application as it parses nested objects from the request body, which is just too much. Just using the querystring library is simpler and more lightweight. 
- **passport.initialize()**: Passport is a JS library that handles user authentication and persisting sessions. Here, we’re initializing our configured passport to our server, allowing it to work with Express’ middleware system. 
- **cors()**: allows specific requests from varying client URLs.
  - We set **credentials to true** because we need to allow cookies from the frontend application’s requests. By default, browsers will not include credentials in cross-origin requests.
  - The **origin** is specified to only allow requests from our frontend application’s URLs. These URLs may vary from development to deployment, but currently, we only need to allow requests from the second and third URLs.



Since we’ve already mentioned configuring passport and incorporating it as a middleware into our Express application, I think it makes sense to take a little detour from our server.js to talk about Passport!


### (2) Configure and Incorporate Passport in passport-config.js
All right, passport has been mentioned a couple times already. What the heck is it, exactly? It’s a popular authentication middleware for Node.JS applications with various strategies, including username/password (local, which we’ll use), OAuth, etc. Passport will help ease the process of authenticating the user and generating sessions associated with the logged in user!

#### A) Import Necessary Modules
To use passport in our Express application, we need to first configure it given the various strategies available.

We will need to import the following:
- Passport: because, well, we need passport. This imports the Passport.js library into this file.
- LocalStrategy: we are importing specifically the Strategy constructor from the passport-local module. We only need this constructor function to create instances of the local authentication strategy. 
  - There are a wide variety of strategies available on Passport, but we’re sticking with local strategy since we’ll only do a username/password login method.
- Bcrypt: a popular library used for securely salting and hashing passwords, and also comparing them. This is important because we don’t want to store passwords directly into our database for security reasons!
- User: we’re importing the User model, which allows us to access user data from MongoDB.

#### B) Define Local Strategy Authentication
In this passport-config file, we are defining an authentication strategy using Passport's use method. This method takes an instance of the authentication strategy, which, in this case, is LocalStrategy. The LocalStrategy constructor takes two arguments:

- (1) An optional options object, which specifies the configuration options for the strategy.
  - This would be needed if, for example, the ‘username’ and ‘password’ didn’t have those names in the HTML input attributes.
- (2) A ‘verify’ callback function that is invoked when a user attempts to authenticate. This callback function accepts three arguments:
  - The username entered by the user,
  - The password entered by the user
  - A ‘done’ callback function, which indicates whether the authentication was successful or not. The 'done' callback function is a standard pattern used throughout the Passport authentication process. It takes three parameters:
      - Error: If an error occurs during the authentication process, this parameter should be set to the error object. Otherwise, it should be set to null.
      - User object: If authentication is successful, this parameter should contain the user object associated with the authenticated user. If authentication fails, it should be set to false or null.
      - Info: This is an optional argument that provides additional information about the authentication attempt, typically as an error message or other details.

#### C) LocalStrategy ‘Verify’ Callback Function
So, further elaborating on the verify callback function, let’s see what’s going on in the asynchronous function: 

1. First, it finds if the username exists from the MongoDB database. If one doesn’t exist, then that means this username is fake! Or at least it’s not registered yet. Whatever the case, the done callback function is returned, with no error, a null user object, and an error message saying no user was found.
2. Instead, if the username does exist in our database, then we will use bcrypt to compare the entered password with the username’s hashed password from the database. Bcrypt will hash the recently entered password to compare the two. The bcrypt compare method takes three arguments
  - (1) the entered password,
  - (2) the database hashed password,
  - (3) A callback function that takes two parameters: error and isMatch.
      - If there is an error during this process, it will throw an error into the catch block.
      - If it is a match, return the done function with the user object indicating a success. This will trigger the serialization process, which will have access to the user info retrieved from the database (notably, its ID).
      - If the passwords don’t match, we run the ‘done’ function with ‘false’ as the user parameter.

To actually invoke this local strategy, we need to use passport.authenticate associated with the /login endpoint.

Assuming success, a session is generated! But how is the session created? We’ll need to use a method called serializeUser.

#### D) SerializeUser
If authentication is complete and successful, the method serializeUser will be run. This takes a callback function, which has two arguments: 
- (1) the user object
    - During the ‘verify’ callback function, if the hashed password comparison was successful, then the user object retrieved from MongoDB was passed into the ‘done.’ Because it was passed through ‘done’, it’s now available here, and we can serialize the user ID into this session for future HTTP requests.
- (2) A ‘done’ callback function

The serializeUser function will then use this unique identifier (user.id) from the user object and store it in the session data. The session ID should be stored in the browser’s cookie such that in future HTTP requests, we pass along the session that can be deserialized to determine whether the user ID matches that from the MongoDB Database. 

The deserializeUser follows the same format as serializeUser. There are a couple differences:
- The function is asynchronous since we need to interact with the MongoDB database. 
- Its first argument is the ID that was passed from the browser’s session, which we hope will match the ID from MongoDB assuming you’re you! 

After serialization, the user authentication process is complete!

#### To Summarize:
- When we use Local Strategy (authenticating with just username and password), we need to check if both match what’s in our database.
- Ideally, the password would be salted and hashed (which we did via bcrypt) for security purposes.
- Assuming a match, we take the user ID from the database (a unique identifier) and use it to serialize the given session.
- When serialized, the session cookie will store this information and will be held in the browser.
- In subsequent requests, the session cookie will be parsed by our backend server, and will deserialize the user ID in the cookie to verify it matches that from the database.
- Assuming a match, your HTTP requests are golden!


Since we’ve been talking about storing the serialized ID in sessions and using sessions in subsequent requests, it now makes sense to talk about sessions in more detail!
