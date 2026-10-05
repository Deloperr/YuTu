// Общие заголовки для всех ответов.
function securityHeaders(req, res, next) {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'same-origin',
    'X-App-Name': 'Blog-PZ21',
  });
  next();
}

module.exports = securityHeaders;
