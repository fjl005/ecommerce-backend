require('dotenv').config();
const express = require('express');
const cloudinaryRouter = express.Router();
const cloudinary = require('../cloudinaryConfig');
const authenticate = require('../authenticate');


cloudinaryRouter.get('/', authenticate.checkAdmin, async (req, res) => {
    try {
        res.statusCode = 200;
        res.send('successful');
    } catch (error) {
        console.log('Error: ', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

cloudinaryRouter.delete(`/:publicId`, authenticate.checkAdmin, async (req, res) => {
    const publicId = req.params.publicId;

    console.log(publicId);
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        if (result.result === 'ok') {
            res.status(200).json({ message: 'Image deleted successfully' });
        } else {
            res.status(200).json({ message: 'Image not found' });
        }
    } catch (error) {
        console.log('Error: ', error);
        res.status(500).json({ error: 'Internal Server Error from .delete for /cloudinary/imgObjId endpoint' });
    }
});

module.exports = cloudinaryRouter;