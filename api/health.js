module.exports = (req, res) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.status(200).json({ status: 'OK', from: 'serverless', timestamp: new Date().toISOString() });
};


