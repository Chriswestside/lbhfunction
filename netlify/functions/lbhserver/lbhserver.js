// netlify/functions/create-checkout-session.js

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); // Use your Stripe secret key

exports.handler = async function (event, context) {
    try {
        const { line_items, customer_country } = JSON.parse(event.body);

        // Determine shipping rate based on country
        let shippingRate;
        if (customer_country === 'AT') {
            shippingRate = 'austria_shipping_rate_id'; // Replace with the ID of your Austria shipping rate
        } else if (['BE', 'FR', 'DE'].includes(customer_country)) {
            shippingRate = 'europe_shipping_rate_id'; // Replace with the ID of your Europe shipping rate
        } else {
            shippingRate = 'worldwide_shipping_rate_id'; // Replace with the ID of your Worldwide shipping rate
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
            body: JSON.stringify({ id: session.id })
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
