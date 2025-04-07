require('dotenv').config();
const express = require('express');
const rateLimit = require('express-rate-limit');
const inchargesRoutes = require('./routes/incharges');
const sendOtpRoutes = require('./routes/sendOtp');
const locationRoutes = require('./routes/location');
const commonRoutes = require('./routes/common');
const checkpointRoutes = require('./routes/checkpoint');
const checklistRoutes = require('./routes/checklist');
const roleRoutes = require('./routes/role');


const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 100, 
    message: 'Too many requests from this IP, please try again later.',
    headers: true,
});
const app = express();
const cors = require('cors');
// Middleware
app.use(express.json());
app.use(cors());
app.use(limiter);
app.disable('x-powered-by');
app.use((req, res, next) => {
    res.removeHeader('Server');
    next();
});
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});
// Routes
app.use('/api/incharges', inchargesRoutes);
app.use('/api/sendSMS',sendOtpRoutes);
app.use('/api/location',locationRoutes);
app.use('/api/common',commonRoutes);
app.use('/api/checkpoint',checkpointRoutes);
app.use('/api/checklist',checklistRoutes);
app.use('/api/role',roleRoutes);

// Increase body size limit
app.use(express.json({ limit: '50mb' }));      // Increase JSON limit
app.use(express.urlencoded({ limit: '50mb', extended: true })); // Increase URL-encoded limit
app.use(express.raw({ limit: '50mb' }));       // Increase raw data limit
app.use(express.text({ limit: '50mb' }));      // Increase text data limit

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
