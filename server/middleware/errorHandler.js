const multer = require('multer');

const handleApiError = (error, context = '') => {
  console.error(`API Error in ${context}:`, {
    message: error.message,
    stack: error.stack,
    name: error.name
  });

  return {
    success: false,
    message: 'Service temporairement indisponible. Veuillez réessayer plus tard.',
    code: 'SERVICE_ERROR'
  };
};

const asyncWrapper = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      const context = `${req.method} ${req.path}`;
      const errorResponse = handleApiError(error, context);
      res.status(500).json(errorResponse);
    });
  };
};

const errorMiddleware = (err, req, res, next) => {
  if (err instanceof multer.MulterError || (err.message && err.message.includes('Seules les images'))) {
    return res.status(400).json({
      success: false,
      message: err.message || 'Erreur lors du téléchargement du fichier',
      code: 'UPLOAD_ERROR'
    });
  }
  if (err.type === 'entity.parse.failed' || err.status === 400) {
    return res.status(400).json({
      success: false,
      message: 'Requête JSON invalide',
      code: 'BAD_REQUEST'
    });
  }
  const context = `${req.method} ${req.path}`;
  const errorResponse = handleApiError(err, context);
  res.status(500).json(errorResponse);
};

const notFoundMiddleware = (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint non trouvé',
    code: 'NOT_FOUND'
  });
};

module.exports = { handleApiError, asyncWrapper, errorMiddleware, notFoundMiddleware };