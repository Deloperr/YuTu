// Заголовки ответа
function securityHeaders(req, res, next) {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'same-origin',
    'X-App-Name': 'BlogPlatform',
  });
  next();
}

module.exports = securityHeaders;
