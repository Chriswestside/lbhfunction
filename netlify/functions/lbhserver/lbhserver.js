const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async function (event, context) {
    console.log('Request received:', event);

    // Handle CORS preflight request
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
        const { line_items, customer_country } = JSON.parse(event.body);

        if (!line_items || !customer_country) {
            console.log('Missing data in request body.');
            return {
                statusCode: 400,
                headers: { 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: 'Missing line_items or customer_country in request body' })
            };
        }

        // Define shipping rates based on countries
        const shippingRates = {
            AT: 'shr_1QGR7oJRMXFic4sW1cy9tYUQ', // Austria shipping rate ID
            BE: 'shr_1QAJLqJRMXFic4sWtc3599Cv', // Belgium shipping rate ID
            FR: 'shr_1QAJLqJRMXFic4sWtc3599Cv', // France shipping rate ID
            DE: 'shr_1QAJLqJRMXFic4sWtc3599Cv', // Germany shipping rate ID
            US: 'shr_1QAJYTJRMXFic4sWxkWKithZ', // United States shipping rate ID
            CA: 'shr_1QAJYTJRMXFic4sWxkWKithZ', // Canada shipping rate ID
            GB: 'shr_1QAJYTJRMXFic4sWxkWKithZ', // United Kingdom shipping rate ID
            AU: 'shr_1QAJYTJRMXFic4sWxkWKithZ' // Australia shipping rate ID
        };

        // Default shipping rate if country is not listed
        const defaultShippingRate = 'shr_defaultWorldwideRateID';

        // Set the shipping rate based on the selected country
        const shippingRate = shippingRates[customer_country] || defaultShippingRate;

        // Log the selected country and corresponding shipping rate
        console.log('Customer country:', customer_country);
        console.log('Selected shipping rate ID:', shippingRate);

        // Create Stripe Checkout session with the selected shipping rate
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: line_items,
            mode: 'payment',
            shipping_address_collection: {
                allowed_countries: [customer_country] // Only allow the selected country
            },
            shipping_options: [{ shipping_rate: shippingRate }], // Only one shipping option for the selected country
            success_url: `${process.env.YOUR_DOMAIN}/thank-you`,
            cancel_url: `${process.env.YOUR_DOMAIN}/kochbuch`,
            metadata: {
                language: language // Store selected language in metadata
            }
        });

        console.log('Session created:', session);

        return {
            statusCode: 200,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ id: session.id })
        };
    } catch (error) {
        console.error('Error in create-checkout-session:', error);

        return {
            statusCode: 500,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: error.message || 'An error occurred' })
        };
    }
};
