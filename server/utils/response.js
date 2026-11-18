function sendSuccess(res, data, { status = 200, message, meta } = {}) {
  const payload = { success: true, data };
  if (message) payload.message = message;
  if (meta) payload.meta = meta;
  return res.status(status).json(payload);
}

function sendError(res, status, code, message, details) {
  const error = { code, message };
  if (details) error.details = details;
  return res.status(status).json({
    success: false,
    data: null,
    message, // conservé au 1er niveau pour compatibilité frontend existant
    code,
    error
  });
}

module.exports = { sendSuccess, sendError };