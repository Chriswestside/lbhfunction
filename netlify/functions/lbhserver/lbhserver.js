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
        let shippingRate;
        const shippingRates = {
            AT: 'shr_1QAJLqJRMXFic4sWtc3599Cv',
            BE: 'shr_1QAJLqJRMXFic4sWtc3599Cv',
            FR: 'shr_1QAJLqJRMXFic4sWtc3599Cv',
            DE: 'shr_1QAJLqJRMXFic4sWtc3599Cv',
            // Define worldwide shipping rates based on countries
            US: 'shr_1QAJYTJRMXFic4sWxkWKithZ',
            CA: 'shr_1QAJYTJRMXFic4sWxkWKithZ',
            GB: 'shr_1QAJYTJRMXFic4sWxkWKithZ',
            AU: 'shr_1QAJYTJRMXFic4sWxkWKithZ'
        };

        // Set the shipping rate based on the selected country
        shippingRate = shippingRates[customer_country] || 'worldwide_shipping_rate_id'; // Default to worldwide rate if country not listed

        // Log the country and selected shipping rate
        console.log('Customer country:', customer_country);
        console.log('Selected shipping rate ID:', shippingRate);

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: line_items,
            mode: 'payment',
            shipping_address_collection: {
                allowed_countries: Object.keys(shippingRates) // Allow listed countries for shipping
            },
            shipping_options: [{ shipping_rate: shippingRate }],
            success_url: `${process.env.YOUR_DOMAIN}/success`,
            cancel_url: `${process.env.YOUR_DOMAIN}/cancel`
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
