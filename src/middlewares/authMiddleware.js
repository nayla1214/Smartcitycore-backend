const { verifyToken } = require('../utils/jwt');
const { User } = require('../models');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            
            const decoded = verifyToken(token);
            
            req.user = await User.findByPk(decoded.id, { attributes: { exclude: ['password'] } });
            
            if (!req.user) {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }

            if (!req.user.status) {
                return res.status(401).json({ message: 'User account is deactivated' });
            }

            next();
        } catch (error) {
            console.error(error);
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};

module.exports = { protect };
