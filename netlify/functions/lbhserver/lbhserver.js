const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); // Use your Stripe secret key

exports.handler = async (event) => {
    // Enable CORS headers for preflight OPTIONS request
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*', // Replace with your Webflow domain for added security
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            body: 'OK'
        };
    }

    try {
        // Debugging: Log event and check if event.body is empty
        console.log('Received event:', event);

        if (!event.body) {
            console.log('No body found in the event.');
            throw new Error('Request body is empty');
        }

        // Parse the JSON body received from the Webflow site
        const data = JSON.parse(event.body);
        const { planId, shippingFee, shippingLocation } = data;

        // Retrieve the product price from Stripe and calculate the total amount
        const productPrice = await stripe.prices.retrieve(planId);
        const totalAmount = productPrice.unit_amount + shippingFee * 100; // Stripe expects amount in cents

        // Create a Stripe checkout session
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
            success_url: 'https://your-site.com/success', // Replace with your success URL
            cancel_url: 'https://your-site.com/cancel' // Replace with your cancel URL
        });

        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*', // Replace with your Webflow domain for added security
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            body: JSON.stringify({ url: session.url })
        };
    } catch (error) {
        console.error('Error:', error.message);
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            body: JSON.stringify({ error: error.message || 'Failed to create checkout session' })
        };
    }
};
