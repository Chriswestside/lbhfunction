// Docs on event and context https://docs.netlify.com/functions/build/#code-your-function-2
const handler = async (event) => {
    try {
        const subject = event.queryStringParameters.name || 'World';
        return {
            statusCode: 200,
            body: JSON.stringify({ message: `Hello ${subject}` })
            // // more keys you can return:
            // headers: { "headerName": "headerValue", ... },
            // isBase64Encoded: true,
        };
    } catch (error) {
        return { statusCode: 500, body: error.toString() };
    }
};

module.exports = { handler };

const fetch = require('node-fetch');

async function getUserLanguage(email) {
    // Replace with your Memberstack API key
    const MEMBERSTACK_API_KEY = 'pk_sb_9b4f0e1658364da15471';

    // Memberstack API endpoint to fetch members by email
    const endpoint = `https://api.memberstack.com/v2/members?email=${encodeURIComponent(email)}`;

    try {
        const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${MEMBERSTACK_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch user data: ${response.statusText}`);
        }

        const data = await response.json();

        // Check if the user was found
        if (data && data.data && data.data.length > 0) {
            const user = data.data[0];

            // Assume you have a custom field named "language" in Memberstack
            // that stores the user's preferred language code (e.g., "en", "es", etc.)
            return user.fields.language || 'en'; // Default to English if no preference is found
        } else {
            console.warn(`No user found with email: ${email}`);
            return 'en'; // Default to English if user not found
        }
    } catch (error) {
        console.error('Error fetching user language:', error);
        return 'en'; // Default to English if there's an error
    }
}
