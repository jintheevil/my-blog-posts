const express = require('express');
const router = express.Router();
const auth = require('firebase/auth');
const jwt = require('jsonwebtoken');

// Register API
router.post('/signup', (req, res) => {
    // Gets email and password from request body
    const { email, password } = req.body;

    // Attempts to create new user using email and password from request body
    auth.createUserWithEmailAndPassword(auth.getAuth(), email, password).then((response) => {
        // Logs the response
        console.log(response);
        // Sends JSON with success message
        res.status(201).json({
            message: "User successfully created!"
        })
    }).catch((err) => {
        // Logs the error
        console.log(err);
        // Sends JSON with error message
        res.status(500).json({
            errCode : err.code,
            message: err.message
        })
    })
})

// Login API
router.post('/login', (req, res) => {
    // Gets email and password from request body
    const { email, password } = req.body;

    auth.signInWithEmailAndPassword(auth.getAuth(), email, password).then((userInfo) => {
        // Logs userInfo upon success
        console.log(userInfo);
        // Converts userInfo into JWT and saves it into cookies
        const accessToken = jwt.sign(
            {
                user: {
                    uid: userInfo.user.uid,
                    email: userInfo.user.email,
                }
            },
            'secret',
            {
                expiresIn: '1h'
            }
        )
        res.cookie('token', accessToken , {
            httpOnly: true, // Helps protect against XSS attacks
            secure: process.env.NODE_ENV === 'production', // Set to true in production (use HTTPS)
            maxAge: 60 * 60 * 1000, // Cookie expires after 1 hour (in milliseconds)
            sameSite: 'strict', // Helps protect against CSRF attacks
        });

        // Sends JSON with success message
        res.status(200).json({
            message: 'Login successful'
        })
    }).catch((err) => {
        // Logs error
        console.log(err);
        // Sends JSON with error message
        res.status(500).json({
            errCode: err.code,
            message: err.message
        })
    })
})

module.exports = router;