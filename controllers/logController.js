// Просмотр журнала запросов
const Log = require('../models/logModel');
const limits = require('../config/limits.json');

// GET /logs – последние записи журнала
async function list(req, res) {
  const logs = await Log.findRecent(limits.logsPageSize);
  res.render('logs', { pageTitle: 'Журнал запросов', logs });
}

module.exports = { list };
