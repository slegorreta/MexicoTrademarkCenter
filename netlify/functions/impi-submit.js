// Netlify Function: proxy to Vercel API (server-to-server, no CORS issues)
exports.handler = async (event) => {
    const VERCEL_URL = 'https://mexico-trademark-center.vercel.app';
    const path = event.path.replace('/.netlify/functions/impi-submit', '/api/beta/impi-autofill/submit');

    try {
          const response = await fetch(`${VERCEL_URL}${path}`, {
                  method: event.httpMethod,
                  headers: {
                            'Content-Type': 'application/json',
                            ...(event.headers['x-beta-token'] ? { 'x-beta-token': event.headers['x-beta-token'] } : {}),
                  },
                  body: event.body || undefined,
          });

      const data = await response.text();

      return {
              statusCode: response.status,
              headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*',
              },
              body: data,
      };
    } catch (err) {
          return {
                  statusCode: 500,
                  body: JSON.stringify({ error: err.message }),
          };
    }
};
