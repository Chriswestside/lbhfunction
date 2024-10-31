exports.handler = async (event) => {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

    // Add CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
    };

    if (!process.env.STRIPE_SECRET_KEY) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Stripe API key not set.' })
        };
    }

    const { basePrice, shippingFee } = JSON.parse(event.body);
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
