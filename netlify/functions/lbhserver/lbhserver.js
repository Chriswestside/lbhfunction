const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
    console.log('Received event:', event);

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
        if (!event.body) {
            console.log('No body found in the event.');
            throw new Error('Request body is empty');
        }

        const data = JSON.parse(event.body);
        console.log('Parsed data:', data);

        const { planId, shippingFee, shippingLocation } = data;

        // Validate presence of required fields
        if (!planId || !shippingFee || !shippingLocation) {
            throw new Error('Missing required fields: planId, shippingFee, or shippingLocation');
        }

        const productPrice = await stripe.prices.retrieve(planId);
        console.log('Product price retrieved:', productPrice);

        const totalAmount = productPrice.unit_amount + shippingFee * 100;

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
            success_url: 'https://your-site.com/success',
            cancel_url: 'https://your-site.com/cancel'
        });

        console.log('Session created successfully:', session.url);

        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            body: JSON.stringify({ url: session.url })
        };
    } catch (error) {
        console.error('Error in Netlify function:', error.message);
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
