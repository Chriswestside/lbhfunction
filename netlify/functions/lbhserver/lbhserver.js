const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); // Use your Stripe secret key

exports.handler = async (event) => {
    try {
        const data = JSON.parse(event.body);
        const { planId, shippingFee } = data;

        // Calculate total amount
        const productPrice = await stripe.prices.retrieve(planId); // retrieve plan price from Stripe
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
                        display_name: `${data.shippingLocation} Shipping`
                    }
                }
            ],
            mode: 'payment',
            success_url: 'https://your-site.com/success', // Update with your success URL
            cancel_url: 'https://your-site.com/cancel' // Update with your cancel URL
        });

        return {
            statusCode: 200,
            body: JSON.stringify({ url: session.url })
        };
    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to create checkout session' })
        };
    }
};
