// Import necessary modules
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
    // Parse the request data
    const { basePrice, shippingFee } = JSON.parse(event.body);
    const totalAmount = (basePrice + shippingFee) * 100; // Convert to cents for Stripe

    try {
        // Create a Stripe checkout session
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

        // Return the session ID as JSON
        return {
            statusCode: 200,
            body: JSON.stringify({ id: session.id })
        };
    } catch (error) {
        // Return an error response
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
