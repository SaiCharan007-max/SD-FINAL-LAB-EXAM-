import express from 'express';
import { body, param } from 'express-validator';

import {
  getAttemptResult,
  saveAnswer,
  startExam,
  submitExam
} from '../controllers/exam.controller.js';
import { requireRole } from '../middleware/roleGuard.js';
import { handleValidationErrors } from '../middleware/validate.js';

const router = express.Router();

router.use(requireRole('student'));

router.post(
  '/:examId/start',
  [
    param('examId').isInt({ min: 1 }).withMessage('examId must be a positive integer').toInt(),
    handleValidationErrors
  ],
  startExam
);

router.patch(
  '/attempt/:attemptId/answer',
  [
    param('attemptId').isInt({ min: 1 }).withMessage('attemptId must be a positive integer').toInt(),
    body('attempt_question_id')
      .isInt({ min: 1 })
      .withMessage('attempt_question_id must be a positive integer')
      .toInt(),
    body('student_answer')
      .isInt({ min: 1, max: 4 })
      .withMessage('student_answer must be 1, 2, 3, or 4')
      .toInt(),
    handleValidationErrors
  ],
  saveAnswer
);

router.post(
  '/attempt/:attemptId/submit',
  [
    param('attemptId').isInt({ min: 1 }).withMessage('attemptId must be a positive integer').toInt(),
    handleValidationErrors
  ],
  submitExam
);

router.get(
  '/attempt/:attemptId/result',
  [
    param('attemptId').isInt({ min: 1 }).withMessage('attemptId must be a positive integer').toInt(),
    handleValidationErrors
  ],
  getAttemptResult
);

export default router;
