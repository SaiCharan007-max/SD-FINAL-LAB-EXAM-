# Online Examination Portal Frontend

Pure `HTML + CSS + Vanilla JavaScript` multi-page frontend.

## API Base URL

Edit [js/config.js](/c:/Users/Somashekar%20Reddy/Desktop/SD%20END%20EXAM/client/js/config.js) and set:

```js
const CONFIG = {
  API_BASE_URL: "http://localhost:5000/api"
};
```

For frontend-only testing, keep:

```js
MOCK_MODE: true
```

When backend is ready, switch to:

```js
MOCK_MODE: false
```

## Run The Frontend

No build step is required.

1. Open [index.html](/c:/Users/Somashekar%20Reddy/Desktop/SD%20END%20EXAM/client/index.html) directly in a browser.
2. Or run with Live Server in VS Code for easier local development.

## Notes

- JWT token is stored in `localStorage` under key `token`.
- User object is stored in `localStorage` under key `user`.
- App is multi-page with separate HTML files (for example: `login.html`, `student-dashboard.html`).
- Shared JS `navigate()` still supports existing route-style calls and maps them to page files.
