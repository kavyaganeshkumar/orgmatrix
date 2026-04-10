const jwt = require('jsonwebtoken');

// 5. ✅ TENANT AUTH MIDDLEWARE
const protect = (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            
            // Verify JWT
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');

            // Inject user and tenant information for strict data isolation
            req.user = decoded; 
            
            // Debug check for tenant injection properties (id, role, tenantId)
            if (!req.user.tenantId) {
                console.error('[AUTH_MIDDLEWARE_CRITICAL]: User token verified but TENANT_ID is missing');
            } else {
                console.log(`[AUTH_MIDDLEWARE] Authorized user: ${req.user.id} for Tenant: ${req.user.tenantId}`);
            }

            return next();
        } catch (error) {
            console.error('[AUTH_MIDDLEWARE_ERROR]: Token verification failed', error.message);
            return res.status(401).json({ message: 'Token is invalid or expired' });
        }
    }

    if (!token) {
        console.error('[AUTH_MIDDLEWARE_ERROR]: No Bearer token provided');
        return res.status(401).json({ message: 'Access denied: Authentication token required' });
    }
};

module.exports = { protect };
