const { API_KEY = 'PASTE_YOUR_API_KEY' } = process.env;
const { OPENAI_API_KEY = 'PASTE_YOUR_OPENAI_API_KEY' } = process.env;
const { NODE_ENV = 'production' } = process.env;

module.exports = { API_KEY, OPENAI_API_KEY, NODE_ENV };
