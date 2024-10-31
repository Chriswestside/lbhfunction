const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); // Use your Stripe secret key

exports.handler = async (event) => {
    // Handle preflight OPTIONS request for CORS
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*', // Update with your Webflow domain if you want to restrict it
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            body: 'OK'
        };
    }

    try {
        const data = JSON.parse(event.body);
        const { planId, shippingFee, shippingLocation } = data;

        // Calculate total amount
        const productPrice = await stripe.prices.retrieve(planId);
        const totalAmount = productPrice.unit_amount + shippingFee * 100; // Stripe expects amount in cents

        // Create Stripe checkout session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price: planId,
                    quantity: 1
                }
            ],
            shipping_options: [
                {
                    shipping_rate_data: {
                        type: 'fixed_amount',
                        fixed_amount: { amount: shippingFee * 100, currency: 'eur' },
                        display_name: `${shippingLocation} Shipping`
                    }
                }
            ],
            mode: 'payment',
            success_url: 'https://your-site.com/success', // Update with your success URL
            cancel_url: 'https://your-site.com/cancel' // Update with your cancel URL
        });

        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*', // Use your Webflow site domain for tighter security
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            body: JSON.stringify({ url: session.url })
        };
    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            body: JSON.stringify({ error: 'Failed to create checkout session' })
        };
    }
};
