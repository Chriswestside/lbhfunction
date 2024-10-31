exports.handler = async (event) => {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const headers = {
        'Access-Control-Allow-Origin': '*', // Allow all origins for testing
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    // Check if event body is present
    if (!event.body) {
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Request body is missing' })
        };
    }

    let body;
    try {
        body = JSON.parse(event.body); // Try parsing the body
    } catch (error) {
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
            success_url: 'https://yourdomain.com/success',
            cancel_url: 'https://yourdomain.com/cancel'
        });

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ id: session.id })
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message })
        };
    }
};
