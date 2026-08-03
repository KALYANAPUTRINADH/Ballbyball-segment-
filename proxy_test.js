const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const app = express();
app.use('/live', createProxyMiddleware({ target: 'http://127.0.0.1:8001/live' }));
app.listen(3001, () => console.log('Proxy on 3001'));
