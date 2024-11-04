const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async function (event, context) {
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
        const { line_items, customer_country, language, memberstack_plan_id } = JSON.parse(event.body);

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

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: line_items,
            mode: 'payment',
            shipping_address_collection: {
                allowed_countries: [customer_country]
            },
            shipping_options: [{ shipping_rate: shippingRate }],
            success_url: `${process.env.YOUR_DOMAIN}/thank-you?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.YOUR_DOMAIN}/kochbuch`,
            metadata: {
                language: language,
                memberstack_plan_id: memberstack_plan_id
            }
        });

        return {
            statusCode: 200,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ id: session.id })
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: error.message || 'An error occurred' })
        };
    }
};
