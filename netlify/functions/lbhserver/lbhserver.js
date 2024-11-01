// // netlify/functions/lbhserver.js

// const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// exports.handler = async function (event, context) {
//     console.log('Request received:', event); // Log incoming request

//     // Handle CORS preflight request
//     if (event.httpMethod === 'OPTIONS') {
//         return {
//             statusCode: 200,
//             headers: {
//                 'Access-Control-Allow-Origin': '*',
//                 'Access-Control-Allow-Headers': 'Content-Type',
//                 'Access-Control-Allow-Methods': 'POST, OPTIONS'
//             },
//             body: 'OK'
//         };
//     }

//     try {
//         const { line_items, customer_country } = JSON.parse(event.body);

//         if (!line_items || !customer_country) {
//             console.log('Missing data in request body.');
//             return {
//                 statusCode: 400,
//                 headers: { 'Access-Control-Allow-Origin': '*' },
//                 body: JSON.stringify({ error: 'Missing line_items or customer_country in request body' })
//             };
//         }

//         let shippingRate;
//         if (customer_country === 'AT') {
//             shippingRate = 'shr_1QAJLqJRMXFic4sWtc3599Cv'; // Replace with Austria rate ID
//         } else if (['BE', 'FR', 'DE'].includes(customer_country)) {
//             shippingRate = 'shr_1QAJLqJRMXFic4sWtc3599Cv'; // Replace with Europe rate ID
//         } else {
//             shippingRate = 'shr_1QAJYTJRMXFic4sWxkWKithZ'; // Replace with Worldwide rate ID
//         }

//         const session = await stripe.checkout.sessions.create({
//             payment_method_types: ['card'],
//             line_items: line_items,
//             mode: 'payment',
//             shipping_address_collection: {
//                 allowed_countries: ['AT', 'BE', 'FR', 'DE', 'US', 'CA', 'GB', 'AU']
//             },
//             shipping_options: [{ shipping_rate: shippingRate }],
//             success_url: `${process.env.YOUR_DOMAIN}/success`,
//             cancel_url: `${process.env.YOUR_DOMAIN}/cancel`
//         });

//         console.log('Session created:', session);

//         return {
//             statusCode: 200,
//             headers: { 'Access-Control-Allow-Origin': '*' },
//             body: JSON.stringify({ id: session.id })
//         };
//     } catch (error) {
//         console.error('Error in create-checkout-session:', error);

//         return {
//             statusCode: 500,
//             headers: { 'Access-Control-Allow-Origin': '*' },
//             body: JSON.stringify({ error: error.message || 'An error occurred' })
//         };
//     }
// };

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
            AT: 'shr_1QAJLqJRMXFic4sWtc3599Cv', // Replace with your actual Austria rate ID
            BE: 'shr_1QAJLqJRMXFic4sWtc3599Cv', // Replace with your actual Europe rate ID
            FR: 'shr_1QAJLqJRMXFic4sWtc3599Cv', // Replace with your actual Europe rate ID
            DE: 'shr_1QAJLqJRMXFic4sWtc3599Cv', // Replace with your actual Europe rate ID
            // Add more European countries as needed
            US: 'shr_1QAJYTJRMXFic4sWxkWKithZ', // Replace with your actual Worldwide rate ID
            CA: 'shr_1QAJYTJRMXFic4sWxkWKithZ', // Replace with your actual Worldwide rate ID
            GB: 'shr_1QAJYTJRMXFic4sWxkWKithZ', // Replace with your actual Worldwide rate ID
            AU: 'shr_1QAJYTJRMXFic4sWxkWKithZ'
            // Add other worldwide countries as needed
        };

        // Set the shipping rate based on the selected country
        shippingRate = shippingRates[customer_country] || 'worldwide_shipping_rate_id'; // Default to worldwide rate if country not listed

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
