const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// CORS configuration for production
const corsOptions = {
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3000'],
    methods: ['GET', 'POST'],
    credentials: true
};

// Middleware
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, './')));

// Email configuration using environment variables
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

// Store OTPs temporarily (in production, use a database)
const otpStore = new Map();

// Generate OTP
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP email
app.post('/send-otp', async (req, res) => {
    const { email } = req.body;
    const otp = generateOTP();

    // Store OTP with timestamp
    otpStore.set(email, {
        otp,
        timestamp: Date.now()
    });

    // Email content
    const mailOptions = {
        from: 'inventrack.services@gmail.com',
        to: email,
        subject: 'Your OTP for Registration',
        text: `Your OTP for registration is: ${otp}. This OTP will expire in 5 minutes.`
    };

    try {
        await transporter.sendMail(mailOptions);
        res.json({ success: true, message: 'OTP sent successfully' });
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ success: false, message: 'Failed to send OTP' });
    }
});

// Verify OTP
app.post('/verify-otp', (req, res) => {
    const { email, otp } = req.body;
    const storedData = otpStore.get(email);

    if (!storedData) {
        return res.status(400).json({ success: false, message: 'OTP expired or not found' });
    }

    // Check if OTP is expired (5 minutes)
    if (Date.now() - storedData.timestamp > 5 * 60 * 1000) {
        otpStore.delete(email);
        return res.status(400).json({ success: false, message: 'OTP expired' });
    }

    if (storedData.otp === otp) {
        otpStore.delete(email);
        res.json({ success: true, message: 'OTP verified successfully' });
    } else {
        res.status(400).json({ success: false, message: 'Invalid OTP' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
}); 
