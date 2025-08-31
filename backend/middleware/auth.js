const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        console.log('🔐 Auth middleware - Token received:', token ? 'YES' : 'NO');
        console.log('🔐 Auth middleware - JWT_SECRET:', process.env.JWT_SECRET ? 'SET' : 'NOT SET');

        if (!token) {
            return res.status(401).json({ message: 'No token, authorization denied' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('🔐 Auth middleware - Token decoded successfully:', decoded);

        const user = await User.findById(decoded.userId).select('-password');

        if (!user) {
            return res.status(401).json({ message: 'Token is not valid' });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('🔐 Auth middleware - Token verification failed:', error.message);
        res.status(401).json({ message: 'Token is not valid' });
    }
};

module.exports = auth;
