# Online Examination Management Portal Backend

Backend API built with Node.js, Express.js, PostgreSQL, JWT, Multer, and SheetJS.

## Install

```bash
npm install
```

## Environment

The project already includes a `.env` file. You can also use `.env.example` as a template when needed.

## Database setup

Run the schema on PostgreSQL:

```bash
psql -U postgres -d SDENDLAB -f migrations/schema.sql
```

If your database was already created before the student year update, run this migration too:

```bash
psql -U postgres -d SDENDLAB -f migrations/002_add_student_year_fields.sql
```

## Seed admin user

```bash
npm run seed
```

## Seed repeatable test data

This creates or refreshes the seeded faculty, course, questions, ongoing exam, and a Postman-ready Excel file at `postman-assets/questions.xlsx`.

```bash
npm run seed:testdata
```

Seeded admin login:

- Username: `AdminExam999`
- Password: `AdminExam@123`

## Start the server

```bash
npm run dev
```

## Run the smoke test

Start the server first, then run:

```bash
npm run smoke
```

## Rebuild the Postman collection

If you want to regenerate `postman.json` with the current local workbook path:

```bash
npm run postman:build
```

## Notes

- Faculty usernames are generated from `employee_id`.
- Excel uploads are handled fully in memory.
- Exam status is computed dynamically and is never stored in the database.
- Rankings are recomputed on every exam submission.
