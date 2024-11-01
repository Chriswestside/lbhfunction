// netlify/functions/lbhserver.js

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async function (event, context) {
    console.log('Request received:', event); // Log incoming request

    // Handle CORS preflight request
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            body: 'OK'
        };
    }

    try {
        const { line_items, customer_country } = JSON.parse(event.body);

        if (!line_items || !customer_country) {
            console.log('Missing data in request body.');
            return {
                statusCode: 400,
                headers: { 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: 'Missing line_items or customer_country in request body' })
            };
        }

        let shippingRate;
        if (customer_country === 'AT') {
            shippingRate = 'price_1QG18pJRMXFic4sW6eEFa9tG'; // Replace with Austria rate ID
        } else if (['BE', 'FR', 'DE'].includes(customer_country)) {
            shippingRate = 'price_1QG18pJRMXFic4sW6eEFa9tG'; // Replace with Europe rate ID
        } else {
            shippingRate = 'price_1QG199JRMXFic4sWfVtu7XSP'; // Replace with Worldwide rate ID
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: line_items,
            mode: 'payment',
            shipping_address_collection: {
                allowed_countries: ['AT', 'BE', 'FR', 'DE', 'US', 'CA', 'GB', 'AU']
            },
            shipping_options: [{ shipping_rate: shippingRate }],
            success_url: `${process.env.YOUR_DOMAIN}/success`,
            cancel_url: `${process.env.YOUR_DOMAIN}/cancel`
        });

        console.log('Session created:', session);

        return {
            statusCode: 200,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ id: session.id })
        };
    } catch (error) {
        console.error('Error in create-checkout-session:', error);

        return {
            statusCode: 500,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: error.message || 'An error occurred' })
        };
    }
};
