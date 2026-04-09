import express from 'express';
import { body, param } from 'express-validator';

import {
  assignFacultyToCourse,
  createCourse,
  createFaculty,
  getSummary,
  listCourses,
  listFaculty,
  removeFacultyFromCourse
} from '../controllers/admin.controller.js';
import { handleValidationErrors } from '../middleware/validate.js';

const router = express.Router();

router.get('/summary', getSummary);

router.post(
  '/faculty',
  [
    body('full_name').trim().notEmpty().withMessage('full_name is required'),
    body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
    body('employee_id').trim().notEmpty().withMessage('employee_id is required'),
    handleValidationErrors
  ],
  createFaculty
);

router.get('/faculty', listFaculty);

router.post(
  '/courses',
  [
    body('course_name').trim().notEmpty().withMessage('course_name is required'),
    body('course_code').trim().notEmpty().withMessage('course_code is required'),
    body('description').optional({ nullable: true }).trim(),
    body('academic_year').trim().notEmpty().withMessage('academic_year is required'),
    handleValidationErrors
  ],
  createCourse
);

router.get('/courses', listCourses);

router.post(
  '/courses/:courseId/assign-faculty',
  [
    param('courseId').isInt({ min: 1 }).withMessage('courseId must be a positive integer').toInt(),
    body('faculty_ids')
      .isArray({ min: 1 })
      .withMessage('faculty_ids must be a non-empty array of faculty IDs'),
    body('faculty_ids.*').isInt({ min: 1 }).withMessage('Each faculty ID must be a positive integer').toInt(),
    handleValidationErrors
  ],
  assignFacultyToCourse
);

router.delete(
  '/courses/:courseId/assign-faculty/:facultyId',
  [
    param('courseId').isInt({ min: 1 }).withMessage('courseId must be a positive integer').toInt(),
    param('facultyId').isInt({ min: 1 }).withMessage('facultyId must be a positive integer').toInt(),
    handleValidationErrors
  ],
  removeFacultyFromCourse
);

export default router;
