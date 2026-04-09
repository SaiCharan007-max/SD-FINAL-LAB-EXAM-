import express from 'express';
import { body } from 'express-validator';

import { loginUser, registerStudent } from '../controllers/auth.controller.js';
import { handleValidationErrors } from '../middleware/validate.js';

const router = express.Router();

router.post(
  '/register',
  [
    body('full_name').trim().notEmpty().withMessage('full_name is required'),
    body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
    body('username')
      .trim()
      .matches(/^[a-zA-Z0-9]+$/)
      .withMessage('username must be alphanumeric only'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('password must be at least 8 characters long')
      .matches(/[A-Z]/)
      .withMessage('password must contain at least one uppercase letter')
      .matches(/[0-9]/)
      .withMessage('password must contain at least one digit')
      .matches(/[^A-Za-z0-9]/)
      .withMessage('password must contain at least one special character'),
    body('confirm_password')
      .custom((value, { req }) => value === req.body.password)
      .withMessage('confirm_password must match password'),
    handleValidationErrors
  ],
  registerStudent
);

router.post(
  '/login',
  [
    body('username').trim().notEmpty().withMessage('username is required'),
    body('password').notEmpty().withMessage('password is required'),
    handleValidationErrors
  ],
  loginUser
);

export default router;
