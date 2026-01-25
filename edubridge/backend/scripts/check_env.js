const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

console.log('--- Environment Check ---');
console.log('FRONTEND_URL:', process.env.FRONTEND_URL);
console.log('Expected:', 'http://localhost:3000');
console.log('-------------------------');
