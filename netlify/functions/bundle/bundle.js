const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const axios = require('axios'); // for making requests to Memberstack's API

// 1. Checkout session creation function
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

        // Create Stripe Checkout session with the selected shipping rate and metadata for product identification
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: line_items,
            mode: 'payment',
            shipping_address_collection: {
                allowed_countries: [customer_country] // Only allow the selected country
            },
            shipping_options: [{ shipping_rate: shippingRate }], // Only one shipping option for the selected country
            success_url: `${process.env.YOUR_DOMAIN}/thank-you`,
            cancel_url: `${process.env.YOUR_DOMAIN}/products`,
            metadata: {
                product_type: 'online_course_with_book'
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

// 2. Webhook handler for checkout session completion
exports.webhookHandler = async function (event, context) {
    const signature = event.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let stripeEvent;

    try {
        stripeEvent = stripe.webhooks.constructEvent(event.body, signature, endpointSecret);
    } catch (err) {
        console.error('⚠️ Webhook signature verification failed.', err);
        return {
            statusCode: 400,
            body: 'Webhook Error: Invalid signature'
        };
    }

    if (stripeEvent.type === 'checkout.session.completed') {
        const session = stripeEvent.data.object;

        // Check if this is the specific product for the online course + book
        if (session.metadata.product_type === 'online_course_with_book') {
            const email = session.customer_email;

            try {
                // Send request to Memberstack to add the user to the specified plan
                const response = await axios.post(
                    'https://api.memberstack.com/v1/members',
                    {
                        email,
                        planId: 'prc_online-kurs-kochbuch-vhep0wdh'
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${process.env.MEMBERSTACK_API_KEY}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );

                console.log('Memberstack response:', response.data);
            } catch (error) {
                console.error('Error adding user to Memberstack plan:', error);
                return {
                    statusCode: 500,
                    body: 'Error adding user to Memberstack'
                };
            }
        }
    }

    return {
        statusCode: 200,
        body: 'Webhook received'
    };
};
