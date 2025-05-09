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
const officetypeRoutes = require('./routes/office_type');
const app = express();
// Middleware
app.disable('x-powered-by');
// Rate limiting FIRST
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    message: 'Too many requests from this IP, please try again later.',
    headers: true,
});

app.use(limiter);


const cors = require('cors');
const allowedOrigins = [
    'http://localhost:1236',
    'http://localhost:4200',
    'https://bypltest1.bsesdelhi.com:8121'
];
const corsOptions = {
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('CORS not allowed for this origin'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],  // only allow these methods
    allowedHeaders: ['Content-Type', 'Authorization'], // allow necessary headers
    credentials: true,  // if using cookies/sessions
    optionsSuccessStatus: 200  // some legacy browsers choke on 204
};
// Use CORS only for APIs
app.use(cors(corsOptions));

// Optional: manually handle preflight if needed
app.options('*', cors(corsOptions));

// Increase body size limit
app.use(express.json({ limit: '50mb' }));      // Increase JSON limit
app.use(express.urlencoded({ limit: '50mb', extended: true })); // Increase URL-encoded limit
app.use(express.raw({ limit: '50mb' }));       // Increase raw data limit
app.use(express.text({ limit: '50mb' }));      // Increase text data limit

// Remove Server header
app.use((req, res, next) => {
    res.removeHeader('Server');
    next();
});

const helmet = require('helmet');
app.use(helmet());

// Routes
app.use('/api/incharges', inchargesRoutes);
app.use('/api/sendSMS', sendOtpRoutes);
app.use('/api/location', locationRoutes);
app.use('/api/common', commonRoutes);
app.use('/api/checkpoint', checkpointRoutes);
app.use('/api/checklist', checklistRoutes);
app.use('/api/role', roleRoutes);
app.use('/api/officetype', officetypeRoutes);


// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
