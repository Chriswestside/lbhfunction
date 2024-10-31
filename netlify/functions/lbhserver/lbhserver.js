const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
    // Set up CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*', // Allow all origins for testing
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    // Handle preflight requests for CORS
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 204, // No Content
            headers
        };
    }

    console.log('Event:', event);

    if (!event.body) {
        console.error('Request body is missing');
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Request body is missing' })
        };
    }

    let body;
    try {
        body = JSON.parse(event.body);
    } catch (error) {
        console.error('Invalid JSON input:', error.message);
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Invalid JSON input' })
        };
    }

    const { basePrice, shippingFee } = body;
    const totalAmount = (basePrice + shippingFee) * 100; // Convert to cents

    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'eur',
                        product_data: { name: 'Product + Shipping' },
                        unit_amount: totalAmount
                    },
                    quantity: 1
                }
            ],
            mode: 'payment',
            success_url: 'https://little-big-hope-2971af-688db640ffff8f55.webflow.io/thank-you',
            cancel_url: 'https://little-big-hope-2971af-688db640ffff8f55.webflow.io/access-denied'
        });

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ id: session.id })
        };
    } catch (error) {
        console.error('Stripe error:', error.message);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message })
        };
    }
};
