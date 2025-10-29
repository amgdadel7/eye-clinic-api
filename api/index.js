// Vercel Serverless entry point for Express app
const app = require('../src/app');

// Export a handler compatible with @vercel/node runtime
module.exports = (req, res) => {
    return app(req, res);
};


