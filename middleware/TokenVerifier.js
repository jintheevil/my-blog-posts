const jwt = require('jsonwebtoken');

// Validates if JWT
const validateToken = (req, res, next) => {
    try {
        // Verify the JWT and get the user ID
        const jwtTokenInfo = jwt.verify(req.cookies.token, 'secret');

        // Add the user ID to the req object
        req.userId = jwtTokenInfo.user.id;

        // Call the next middleware or route handler
        next();
    } catch (error) {
        // Render error page upon unauthorized
        res.render('error', {
            errCode: 401,
            message: "Unauthorized. Token has expired."
        });
        res.status(401).json({
            errCode: 401,
            message: "Unauthorized. Token has expired."
        })
    }
};

module.exports = validateToken;