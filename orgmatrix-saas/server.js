const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Initialize app and port
const app = express();

// 🛡️ Security Middleware
app.use(helmet({
    contentSecurityPolicy: false, // Disabled for local development ease with CDNs if any
}));

// 🛡️ Rate Limiting
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per 15 mins
    message: { message: 'Too many requests, please try again later.' }
});

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});
const PORT = process.env.PORT || 3001;

// Make io accessible to our routes
app.set('io', io);

const onlineUsers = new Map(); // Map of userId to socketId

io.on('connection', (socket) => {
    console.log(`[SOCKET_SUCCESS]: User connected: ${socket.id}`);
    
    socket.on('register-user', (userId) => {
        socket.userId = userId;
        onlineUsers.set(userId, socket.id);
        io.emit('presence-update', Array.from(onlineUsers.keys()));
    });

    socket.on('join-tenant', (tenantId) => {
        socket.join(tenantId);
        console.log(`[SOCKET_INFO]: User joined tenant room: ${tenantId}`);
    });

    socket.on('disconnect', () => {
        if (socket.userId) {
            onlineUsers.delete(socket.userId);
            io.emit('presence-update', Array.from(onlineUsers.keys()));
        }
        console.log(`[SOCKET_INFO]: User disconnected`);
    });
});

// 1. ✅ SERVER CONNECTION CHECK
// This function in config/db.js connects and logs success/failure
connectDB(); 

// 2. Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'pages')));
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/js', express.static(path.join(__dirname, 'js')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 3. ✅ ROUTE REGISTRATION (PLURALIZED)
app.use('/api/', apiLimiter); // Apply rate limiting to all API endpoints
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/company', require('./routes/companyRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/projects', require('./routes/projectRoutes'));
app.use('/api/tasks',    require('./routes/taskRoutes'));
app.use('/api/services', require('./routes/serviceRoutes'));
app.use('/api/logs',     require('./routes/logRoutes'));
app.use('/api/billing',  require('./routes/billingRoutes')); // 💳 New Billing Routes
app.use('/api/notifications', require('./routes/notificationRoutes')); // 🔔 Notifications
app.use('/api/analytics', require('./routes/analyticsRoutes')); // 📊 Analytics
app.use('/api/search', require('./routes/searchRoutes')); // 🔍 Global Search
app.use('/api/comments', require('./routes/commentRoutes')); // 💬 Comments
app.use('/api/templates', require('./routes/templateRoutes')); // 📋 Templates



// Default redirect to login
app.get('/', (req, res) => {
    res.redirect('/login.html');
});

// 7. ✅ ERROR LOGGING (GLOBAL HANDLER)
app.use((err, req, res, next) => {
    const statusCode = res.statusCode ? res.statusCode : 500;
    console.error(`[CRITICAL_SERVER_ERROR]: ${err.message}`);
    res.status(statusCode).json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
});

server.listen(PORT, () => {
    console.log(`[SERVER_SUCCESS]: SaaS Dashboard with Real-Time active on port ${PORT}`);
});
