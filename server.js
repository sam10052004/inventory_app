const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, './')));

// Email configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'inventrack.services@gmail.com', // Replace with your Gmail
        pass: 'klqs lfpf jxfv exhq'     // Replace with your Gmail App Password
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