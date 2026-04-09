import { validationResult } from 'express-validator';

const handleValidationErrors = (req, res, next) => {
  const result = validationResult(req);

  if (result.isEmpty()) {
    return next();
  }

  const errors = result.array().map((error) => ({
    field: error.path || error.param,
    message: error.msg
  }));

  return res.status(400).json({ errors });
};

export { handleValidationErrors };
