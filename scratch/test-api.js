const dotenv = require('dotenv');
// Find .env file relative to this script
dotenv.config({ path: __dirname + '/../.env' });

const apiKey = process.env.API_KEY || '';
console.log("API Key length:", apiKey.length);
console.log("API Key prefix:", apiKey.substring(0, 10));

async function test() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: "Hello! Say: 'Connection successful!'"
        }]
      }]
    })
  });
  console.log("Status:", response.status);
  const data = await response.json();
  console.log("Response data:", JSON.stringify(data, null, 2));
}

test().catch(console.error);
