# Auth wiring (no-conflict)

These steps **wire in** the add-only auth files without overwriting any of your existing code.

The patches you applied created:
- `server/authRoutes.js` — `/api/auth/signup`, `/login`, `/logout`, `/me`
- `server/authRequired.js` — middleware to protect routes using JWT from an **httpOnly** cookie
- `server/.env.example` — template for `JWT_SECRET`, etc.
- Frontend files: `client/src/api.js`, `client/src/context/AuthContext.jsx`, `client/src/components/ProtectedRoute.jsx`, `client/src/pages/Login.jsx`, `client/src/pages/Signup.jsx`, `client/.env.example`

---

## 1) Server wiring (`server/index.js` or your entry file)

Add/ensure these imports at the **top**:

```js
require('dotenv').config();               // load .env
const cors = require('cors');             // CORS for browser requests
const cookieParser = require('cookie-parser'); // read cookies (for JWT)
const authRoutes = require('./authRoutes');    // new auth router
const authRequired = require('./authRequired'); // guard for protected APIs
```

Add/ensure these middlewares **once** during app setup (after `const app = express()`):

```js
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  credentials: true, // allow cookies to be sent
}));
```

Mount the auth routes:

```js
app.use('/api/auth', authRoutes);
```

Protect your existing APIs (examples — adapt to your file names/routers):

```js
// If you mount routers:
app.use('/api/patients', authRequired, patientsRouter);
app.use('/api/surgeries', authRequired, surgeriesRouter);

// If endpoints are inline:
app.get('/api/stats', authRequired, statsHandler);
app.post('/api/patients', authRequired, createPatient);
```

Optional health check:

```js
app.get('/health', (_req, res) => res.json({ ok: true }));
```

> If your entry file is not `server/index.js` (e.g., `server/app.js`), make the same edits there.

---

## 2) Environment variables

Create `server/.env` from the example:

```bash
cp server/.env.example server/.env
```

Generate a strong secret and paste it as `JWT_SECRET=` in `server/.env`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Optional:
- Set a custom client URL in production: `CLIENT_ORIGIN=https://your-domain.com`
- To change DB path: `SQLITE_PATH=./server/db.sqlite` (or your path)

Ensure `.gitignore` ignores `server/.env`.

---

## 3) Client wiring

### `client/src/main.jsx`
Wrap the app with Router and AuthProvider:

```jsx
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
```

### `client/src/App.jsx`
Add routes for login/signup and protect your main page:

```jsx
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard'; // adjust to your actual main page

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
    </Routes>
  );
}
```

### `client/.env`
Create from example and point to your server:

```bash
cp client/.env.example client/.env
# adjust if your server runs on another port/domain
VITE_API_URL=http://localhost:3001
```

---

## 4) Install dependencies

```bash
cd server && npm i bcrypt jsonwebtoken cookie-parser cors dotenv better-sqlite3
cd ../client && npm i react-router-dom
```

---

## 5) Run & test

```bash
# Terminal 1
cd server
node index.js   # or your server entry file

# Terminal 2
cd client
npm run dev
```

Open http://localhost:5173:

1. Go to **/signup** and create a user.
2. You should be redirected to `/` (protected). Your API calls now include cookies.
3. Try **/logout** (button in UI) → you should be redirected to **/login** and protected endpoints return 401.

---

## 6) Troubleshooting

- **CORS / Cookie not set**: Ensure both
  - server uses `cors({ origin: CLIENT_ORIGIN, credentials: true })`
  - client `fetch` sets `credentials: 'include'`
- **Cookie not sent in production**: Use HTTPS and set cookie options appropriately (in `authRoutes.js`, `secure: process.env.NODE_ENV === 'production'` and `sameSite: 'lax'` are already set).
- **401 on protected routes**: Check that `authRequired` is applied and that your JWT cookie exists in requests (DevTools → Network → Request Headers → Cookie).
- **Time skew**: If tokens expire immediately, ensure machine time is correct.
- **Reverse proxy**: If using Nginx/Cloudflare, confirm `Set-Cookie` headers are not stripped.

---

## 7) Production tips

- Use a long, random `JWT_SECRET` and rotate periodically.
- Serve over HTTPS; set `secure: true` for cookies.
- Consider rate limiting on `/api/auth/*` endpoints.
- Validate email/password server-side and client-side.
- Add RBAC later by including roles/permissions in the JWT payload and checking in `authRequired`.
