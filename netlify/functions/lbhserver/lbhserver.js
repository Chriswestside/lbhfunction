const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async function (event, context) {
    console.log('Request received:', event);

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
        // Extract line_items, customer_country, and language from the request body
        const { line_items, customer_country, language } = JSON.parse(event.body);

        if (!line_items || !customer_country || !language) {
            console.log('Missing data in request body.');
            return {
                statusCode: 400,
                headers: { 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: 'Missing line_items, customer_country, or language in request body' })
            };
        }

        // Define shipping rates based on countries
        const shippingRates = {
            AT: 'shr_1QGR7oJRMXFic4sW1cy9tYUQ',
            BE: 'shr_1QAJLqJRMXFic4sWtc3599Cv',
            FR: 'shr_1QAJLqJRMXFic4sWtc3599Cv',
            DE: 'shr_1QAJLqJRMXFic4sWtc3599Cv',
            US: 'shr_1QAJYTJRMXFic4sWxkWKithZ',
            CA: 'shr_1QAJYTJRMXFic4sWxkWKithZ',
            GB: 'shr_1QAJYTJRMXFic4sWxkWKithZ',
            AU: 'shr_1QAJYTJRMXFic4sWxkWKithZ'
        };

        const defaultShippingRate = 'shr_defaultWorldwideRateID';
        const shippingRate = shippingRates[customer_country] || defaultShippingRate;

        console.log('Customer country:', customer_country);
        console.log('Selected shipping rate ID:', shippingRate);

        // Create Stripe Checkout session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: line_items,
            mode: 'payment',
            shipping_address_collection: {
                allowed_countries: [customer_country]
            },
            shipping_options: [{ shipping_rate: shippingRate }],
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
