const app = require('../server.js');

module.exports = (req, res) => {
  // Normalize incoming URL so Express routes matching /api/* are always matched
  const targetUrl = req.originalUrl || req.url || '';
  if (targetUrl.startsWith('/api')) {
    req.url = targetUrl;
  } else if (!req.url.startsWith('/api')) {
    req.url = '/api' + (req.url.startsWith('/') ? '' : '/') + req.url;
  }
  return app(req, res);
};
