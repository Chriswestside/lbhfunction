// functions/stripe-webhook.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const nodemailer = require('nodemailer');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const sig = event.headers['stripe-signature'];
    let eventData;

    try {
        eventData = stripe.webhooks.constructEvent(event.body, sig, process.env.STRIPE_ENDPOINT_SECRET);
    } catch (err) {
        console.error(`Webhook error: ${err.message}`);
        return { statusCode: 400, body: `Webhook Error: ${err.message}` };
    }

    if (eventData.type === 'checkout.session.completed') {
        const session = eventData.data.object;

        // Assuming you have a method to get user's email and language
        const userEmail = session.customer_email; // Adjust based on your data structure
        const userLanguage = await getUserLanguage(userEmail); // Implement this function to fetch the user's language

        // Set up email transport
        const transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        // Prepare localized message
        let emailContent;
        switch (userLanguage) {
            case 'es':
                emailContent = '¡Gracias por tu compra!';
                break;
            case 'fr':
                emailContent = 'Merci pour votre achat !';
                break;
            case 'de':
                emailContent = 'Danke für Ihren Kauf!';
                break;
            default:
                emailContent = 'Thank you for your purchase!';
                break;
        }

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: userEmail,
            subject: 'Purchase Confirmation',
            text: emailContent
        };

        try {
            await transporter.sendMail(mailOptions);
            console.log('Email sent successfully!');
        } catch (error) {
            console.error('Error sending email:', error);
        }
    }

    return { statusCode: 200, body: JSON.stringify({ received: true }) };
};

// Dummy function to fetch user language based on email
async function getUserLanguage(email) {
    // This is a placeholder. You need to implement logic to fetch the user's language from Memberstack or your database.
    // For example, you could use an API request to Memberstack to get user details.
    return 'en'; // Default to English
}
