const User = require('../models/User');

async function getUser(userId) {
    try {
        console.log('here');
        return await User.findById({ _id: userId });
    } catch (error) {
        throw new Error("User not found");
    }
}

module.exports = {
    getUser,
};
