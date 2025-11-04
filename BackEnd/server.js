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
const encryphelperRoutes = require('./routes/encyHelp');
const reportsRoutes = require('./routes/reports');
const { logWrite } = require('./config/logfile');
const cron = require('node-cron');
const { sendMonthlyEmailJob, send15thEmails, send20thEmails } = require('./config/scheduledEmailJob');

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
const router = express.Router();
const helmet = require('helmet');
app.use(helmet());
// Health check
router.get('/ping', (req, res) => {
    res.status(200).json({
        status: 'OK',
        message: 'API is live',
        timestamp: new Date().toISOString()
    });
});
// Routes
router.use('/incharges', inchargesRoutes);
router.use('/sendSMS', sendOtpRoutes);
router.use('/location', locationRoutes);
router.use('/common', commonRoutes);
router.use('/checkpoint', checkpointRoutes);
router.use('/checklist', checklistRoutes);
router.use('/role', roleRoutes);
router.use('/officetype', officetypeRoutes);
router.use('/encryphelper', encryphelperRoutes);
router.use('/reports', reportsRoutes);

// Mount everything under /wiportalbakcend/api
app.use('/bywipapi/api', router);

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});



// Run on 15th every month at 10 AM
cron.schedule('0 10 15 * *', () => {
  logWrite('Running 15th-of-month email job');
  send15thEmails();
});

// Optional: 20th of each month
cron.schedule('0 10 20 * *', () => {
  logWrite('Running 20th-of-month email job');
  send20thEmails();
});

// cron.schedule('*/2 * * * *', () => {
//   logWrite('Running every-2-minute email job');
//   sendMonthlyEmailJob(); 
// });