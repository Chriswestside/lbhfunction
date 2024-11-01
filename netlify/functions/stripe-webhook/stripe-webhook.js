// Import `fetch` to make API requests
const fetch = require('node-fetch');

// Handler function required by Netlify
const handler = async (event) => {
    try {
        // Get email from query string or default (for testing)
        const email = event.queryStringParameters.email || 'test@example.com';

        // Fetch user language preference using helper function
        const language = await getUserLanguage(email);

        return {
            statusCode: 200,
            body: JSON.stringify({ message: `Preferred language for ${email} is ${language}` })
        };
    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: error.toString() }) };
    }
};

// Helper function to fetch user language from Memberstack
async function getUserLanguage(email) {
    const MEMBERSTACK_API_KEY = process.env.MEMBERSTACK_API_KEY; // Use environment variable

    // Memberstack API endpoint to fetch members by email
    const endpoint = `https://api.memberstack.com/v2/members?email=${encodeURIComponent(email)}`;
    if (!process.env.MEMBERSTACK_API_KEY) {
        console.error('API key is missing in environment variables');
        return 'en'; // Default if missing
    }
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

        // Check if the user was found and return language or default to 'en'
        if (data && data.data && data.data.length > 0) {
            const user = data.data[0];
            return user.fields.language || 'en'; // Default to English if no language is found
        } else {
            console.warn(`No user found with email: ${email}`);
            return 'en'; // Default to English if user not found
        }
    } catch (error) {
        console.error('Error fetching user language:', error);
        return 'en'; // Default to English if there's an error
    }
}

// Export the handler as required by Netlify Functions
module.exports = { handler };
