
const jwt = require('jsonwebtoken');
 const secretKey = 'qwertyuiopasdfghjklzxcvbnm12345678900987654321mnbvcxzlkjhgfdsapoiuytrewq';


 const verifyToken = (req, res, next) => {
    const token = req.headers['authorization'];

    if (!token) {
        return res.status(401).json({ msg: 'Access denied. No token provided.' });
    }

    jwt.verify(token.replace('Bearer ', ''), secretKey, (err, decoded) => {
        if (err) {
            return res.status(403).json({ msg: 'Invalid or expired token.' });
        }
        req.user = decoded; // Attach decoded user info to request
        next();
    });
};

module.exports = { verifyToken, secretKey };