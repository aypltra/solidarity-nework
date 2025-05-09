// Step 3: Require/Load the express module
const express = require('express');
// Require the dotenv module to load environment variables
require('dotenv').config(); // This loads the .env file

// Nodemailer for sending email
const nodemailer = require('nodemailer');

// body-parser is used to read data payload from the HTTP request body
const bodyParser = require('body-parser'); 
// path is used to set default directories for MVC and also for the static files
const path = require('path'); 

// Get email credentials from the environment variables
const emailUser = process.env.EMAIL_USER;
const emailPass = process.env.EMAIL_PASS;

// for four-digit verification code
const verificationCodes = new Map();

// Step 4: Create our express server
const app = express();

// Serves static files inside the public folder
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'hbs');
app.use(bodyParser.urlencoded({ extended: true }));

// Set a basic route for when the website initially starts
app.get('/', (req, res) => {
    res.render('index.hbs');
});

// Route to handle sending an email
app.post('/send-email', (req, res) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: emailUser,   // Use the email from .env
            pass: emailPass    // Use the password from .env
        }
});
    const mailOptions = {
        from: emailUser,
        to: req.body.email,  // Email from the user input
        subject: 'Notification about Campaign',
        text: `Thank you for your interest in receiving campaign updates! <br><br><br> If you wish to Unsubscribe from receiving updates, click here: https://aypltra.github.io/unsubscribe?email=${encodeURIComponent(req.body.email)}`,
        html: `Thank you for your interest in receiving campaign updates!<br><br><br>
If you wish to Unsubscribe, click <a href="https://aypltra.github.io/unsubscribe?email=${encodeURIComponent(req.body.email)}">here</a>.`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return res.status(500).send('Error sending email: ' + error.message);
        }
        res.status(200).send('Email sent successfully: ' + info.response);
    });
});

app.post('/request-unsubscribe', (req, res) => {
  const email = req.body.email;

  if (!email) {
    return res.status(400).send('Email is required.');
  }

  // Generate 4-digit code
  const code = Math.floor(1000 + Math.random() * 9000).toString();

  // Store in memory
  verificationCodes.set(email, code);

  // Email setup
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Your Unsubscribe Verification Code',
    html: `<p>Your verification code is: <strong>${code}</strong></p>`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
      return res.status(500).send('Failed to send verification code.');
    }
    console.log(`Code ${code} sent to ${email}`);
    res.send('A 4-digit code has been sent to your email.');
  });
});

app.post('/verify-unsubscribe', (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).send('Email and code are required.');
  }

  const storedCode = verificationCodes.get(email);

  if (storedCode === code) {
    verificationCodes.delete(email);
    console.log(`Unsubscribed: ${email}`);
    // TODO: Mark user unsubscribed in your DB or system
    res.send('You have been successfully unsubscribed.');
  } else {
    res.status(400).send('Invalid code.');
  }
});

// Step 5: Start the HTTP server on port 3000
const port = 3000;
app.listen(port, () => console.log(`App listening on port ${port}`));

