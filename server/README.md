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

## Seed admin user

```bash
npm run seed
```

Seeded admin login:

- Username: `AdminExam999`
- Password: `AdminExam@123`

## Start the server

```bash
npm run dev
```

## Notes

- Faculty usernames are generated from `employee_id`.
- Excel uploads are handled fully in memory.
- Exam status is computed dynamically and is never stored in the database.
- Rankings are recomputed on every exam submission.
