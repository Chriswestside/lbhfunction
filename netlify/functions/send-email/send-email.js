// Import dependencies
const fetch = require('node-fetch');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const sgMail = require('@sendgrid/mail');

// Set your SendGrid API Key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Main handler function for Netlify
exports.handler = async (event) => {
    try {
        const sig = event.headers['stripe-signature'];
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

        let stripeEvent;
        try {
            stripeEvent = stripe.webhooks.constructEvent(event.body, sig, webhookSecret);
        } catch (err) {
            return { statusCode: 400, body: `Webhook Error: ${err.message}` };
        }

        if (stripeEvent.type === 'checkout.session.completed') {
            const session = stripeEvent.data.object;
            const customerEmail = session.customer_details.email;
            const language = await getUserLanguage(customerEmail);

            // Send email based on language preference
            await sendLocalizedEmail(customerEmail, language);
        }

        return { statusCode: 200, body: 'Event received' };
    } catch (error) {
        console.error('Error handling Stripe event:', error);
        return { statusCode: 500, body: 'Internal Server Error' };
    }
};

// Helper function to fetch user language from Memberstack
async function getUserLanguage(email) {
    const MEMBERSTACK_API_KEY = process.env.MEMBERSTACK_API_KEY;
    const endpoint = `https://api.memberstack.com/v2/members?email=${encodeURIComponent(email)}`;

    try {
        const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${MEMBERSTACK_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch user data: ${response.statusText}`);
        }

        const data = await response.json();

        if (data && data.data && data.data.length > 0) {
            const user = data.data[0];
            return user.fields.language || 'en'; // Default to English
        } else {
            console.warn(`No user found with email: ${email}`);
            return 'en'; // Default to English if user not found
        }
    } catch (error) {
        console.error('Error fetching user language:', error);
        return 'en'; // Default to English if there's an error
    }
}

// Function to send localized email
async function sendLocalizedEmail(email, language) {
    const subject =
        {
            en: 'Thank You for Your Purchase!',
            es: '¡Gracias por su compra!',
            fr: 'Merci pour votre achat!',
            de: 'Danke für Ihren Kauf!'
        }[language] || 'Thank You for Your Purchase!'; // Fallback to English

    const text =
        {
            en: 'We appreciate your business!',
            es: '¡Agradecemos su negocio!',
            fr: 'Nous apprécions votre entreprise!',
            de: 'Wir schätzen Ihr Geschäft!'
        }[language] || 'We appreciate your business!'; // Fallback to English

    const msg = {
        to: email,
        from: 'your-email@example.com', // Replace with your verified sender email in SendGrid
        subject: subject,
        text: text,
        html: `<strong>${text}</strong>` // Optional: HTML version of the email
    };

    try {
        await sgMail.send(msg);
        console.log(`Email sent to ${email} in ${language}`);
    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error('Email sending failed');
    }
}
