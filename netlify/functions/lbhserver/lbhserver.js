// netlify/functions/create-checkout-session.js

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async function (event, context) {
    // Handle CORS preflight request
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*', // Allow all origins (or specify your Webflow domain)
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            body: 'OK'
        };
    }

    try {
        const { line_items, customer_country } = JSON.parse(event.body);

        // Check for missing or undefined fields
        if (!line_items || !customer_country) {
            return {
                statusCode: 400,
                headers: {
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ error: 'Missing line_items or customer_country in request body' })
            };
        }

        // Determine shipping rate based on country
        let shippingRate;
        if (customer_country === 'AT') {
            shippingRate = 'shr_1QAJLqJRMXFic4sWtc3599Cv'; // Replace with Austria shipping rate ID
        } else if (['BE', 'FR', 'DE'].includes(customer_country)) {
            shippingRate = 'shr_1QAJLqJRMXFic4sWtc3599Cv'; // Replace with Europe shipping rate ID
        } else {
            shippingRate = 'shr_1QAJYTJRMXFic4sWxkWKithZ'; // Replace with Worldwide shipping rate ID
        }

        // Create the checkout session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: line_items,
            mode: 'payment',
            shipping_address_collection: {
                allowed_countries: ['AT', 'BE', 'FR', 'DE', 'US', 'CA', 'GB', 'AU'] // Add relevant countries
            },
            shipping_options: [{ shipping_rate: shippingRate }],
            success_url: `${process.env.YOUR_DOMAIN}/success`,
            cancel_url: `${process.env.YOUR_DOMAIN}/cancel`
        });

        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ id: session.id })
        };
    } catch (error) {
        console.error('Error in create-checkout-session:', error);
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ error: error.message })
        };
    }
};
