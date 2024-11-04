const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const fetch = require('node-fetch'); // Required for making API requests to Memberstack

exports.handler = async (event, context) => {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let stripeEvent;
    try {
        stripeEvent = stripe.webhooks.constructEvent(event.body, event.headers['stripe-signature'], webhookSecret);
    } catch (err) {
        return { statusCode: 400, body: `Webhook Error: ${err.message}` };
    }

    if (stripeEvent.type === 'checkout.session.completed') {
        const session = stripeEvent.data.object;

        const memberstackPlanId = session.metadata.memberstack_plan_id;
        const userEmail = session.customer_details.email;

        if (memberstackPlanId && userEmail) {
            try {
                const memberstackResponse = await fetch(`https://api.memberstack.com/v1/members`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${process.env.MEMBERSTACK_API_KEY}`
                    },
                    body: JSON.stringify({
                        email: userEmail,
                        planId: memberstackPlanId
                    })
                });

                const memberstackData = await memberstackResponse.json();

                if (memberstackResponse.ok) {
                    console.log('Memberstack user updated:', memberstackData);
                } else {
                    console.error('Failed to update Memberstack user:', memberstackData);
                }
            } catch (error) {
                console.error('Error updating Memberstack user:', error);
            }
        }
    }

    return { statusCode: 200, body: 'Webhook received' };
};
