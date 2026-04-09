import express from 'express';
import { body } from 'express-validator';

import {
  enrollInCourse,
  getMyCourses,
  getMyExams,
  getMyResults,
  listCourses
} from '../controllers/student.controller.js';
import { handleValidationErrors } from '../middleware/validate.js';

const router = express.Router();

router.get('/courses', listCourses);

router.post(
  '/enroll',
  [
    body('course_id').isInt({ min: 1 }).withMessage('course_id must be a positive integer').toInt(),
    handleValidationErrors
  ],
  enrollInCourse
);

router.get('/my-courses', getMyCourses);
router.get('/my-exams', getMyExams);
router.get('/my-results', getMyResults);

export default router;
