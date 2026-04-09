import express from 'express';
import multer from 'multer';
import { body, param, query } from 'express-validator';

import {
  createExam,
  exportLeaderboardCsv,
  getAssignedCourses,
  getExams,
  getLeaderboard,
  getQuestions,
  uploadQuestions
} from '../controllers/faculty.controller.js';
import { handleValidationErrors } from '../middleware/validate.js';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, callback) => {
    if (/\.(xlsx|xls|csv)$/i.test(file.originalname)) {
      return callback(null, true);
    }

    const error = new Error('Only Excel or CSV files are allowed');
    error.status = 400;
    return callback(error);
  }
});

router.get('/courses', getAssignedCourses);

router.post(
  '/questions/upload',
  upload.single('file'),
  [
    body('course_id').isInt({ min: 1 }).withMessage('course_id must be a positive integer').toInt(),
    body('academic_year').trim().notEmpty().withMessage('academic_year is required'),
    handleValidationErrors
  ],
  uploadQuestions
);

router.get(
  '/questions/:courseId',
  [
    param('courseId').isInt({ min: 1 }).withMessage('courseId must be a positive integer').toInt(),
    query('academic_year').optional().trim().notEmpty().withMessage('academic_year cannot be empty'),
    handleValidationErrors
  ],
  getQuestions
);

router.post(
  '/exams',
  [
    body('title')
      .trim()
      .notEmpty()
      .withMessage('title is required')
      .isLength({ max: 100 })
      .withMessage('title must be at most 100 characters'),
    body('course_id').isInt({ min: 1 }).withMessage('course_id must be a positive integer').toInt(),
    body('academic_year').trim().notEmpty().withMessage('academic_year is required'),
    body('start_datetime').isISO8601().withMessage('start_datetime must be a valid ISO-8601 date'),
    body('duration_minutes')
      .isInt({ min: 10, max: 180 })
      .withMessage('duration_minutes must be between 10 and 180')
      .toInt(),
    body('num_questions')
      .isInt({ min: 1 })
      .withMessage('num_questions must be a positive integer')
      .toInt(),
    handleValidationErrors
  ],
  createExam
);

router.get('/exams', getExams);

router.get(
  '/exams/:examId/leaderboard',
  [
    param('examId').isInt({ min: 1 }).withMessage('examId must be a positive integer').toInt(),
    handleValidationErrors
  ],
  getLeaderboard
);

router.get(
  '/exams/:examId/leaderboard/export-csv',
  [
    param('examId').isInt({ min: 1 }).withMessage('examId must be a positive integer').toInt(),
    handleValidationErrors
  ],
  exportLeaderboardCsv
);

export default router;
