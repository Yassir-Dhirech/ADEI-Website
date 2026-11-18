const { sendError } = require('../utils/response');

const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body || {});
  if (!result.success) {
    const details = result.error.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message
    }));
    return sendError(res, 400, 'VALIDATION_ERROR', 'Données invalides', details);
  }
  req.body = result.data;
  next();
};

module.exports = { validate };
