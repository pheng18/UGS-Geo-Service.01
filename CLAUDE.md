# CLAUDE.md

UniqTek Technical Services: an internal web app for UniqTek Co., Ltd (Lao PDR). It tracks equipment repairs, field survey projects, 73 CORS stations, district equipment, quotations, training and user access. The app was first generated in Google AI Studio and is deployed to Vercel.

## Commands

```bash
npm install          # no lockfile is committed; this resolves fresh
npm run dev          # Express + Vite middleware via tsx, http://localhost:3000
npm run build        # tsc (type check, noEmit) && vite build -> dist/
npm run lint         # eslint, --max-warnings 0
npm run preview      # serve dist/ on :3000
npx tsc --noEmit     # type check only
```

- **No test suite exists.** "Verify" means `npx tsc --noEmit`, then `npm run lint`, then `npm run build`, and for UI changes a look at `npm run dev` in a browser.
- `npm run lint` currently fails on one error: `src/views/BackOfficeView.tsx` has an `eslint-disable-next-line react-hooks/exhaustive-deps` comment, but `eslint-plugin-react-hooks` is not installed. Don't treat this as a regression you caused.
- The build warns that the main chunk is over 3 MB. That is expected for now.
- Firebase emulators (Auth on 9099, Firestore on 8085): run `firebase emulators:start`, then `VITE_USE_FIREBASE_EMULATORS=true npx vite`.
- The Gradle files (`build.gradle.kts`, `app/`) are AI Studio Android-wrapper stubs. They are not part of the web build, so leave them alone.

## Architecture

- **Frontend:** React 18, TypeScript (strict), Vite 6, Tailwind 3 (`darkMode: 'class'`), and lucide-react icons. The entry point is `src/main.tsx` → `src/App.tsx`.
- **No router.** Navigation is `currentView` and `navigateTo()` from `AppContext`. `App.tsx` switches between files in `src/views/`. To add a screen, add a view, wire it into `App.tsx`, and add it to `BottomNav`.
- **State:** almost everything lives in `src/context/AppContext.tsx` (about 2,300 lines) and is reached with `useApp()`. Firestore `onSnapshot` listeners feed it. The collections are `users`, `employees`, `repairs`, `projects`, `quotations`, `internal_notes`, `activity_logs` and `cors_stations`. A localStorage cache under `uniqtek_<key>` and the seed data in `src/data/seedData.ts` act as fallbacks.
- **Types:** shared domain types are in `src/types/index.ts`. Add new ones there.
- **Firebase:** the client is in `src/firebase.ts` and uses a *named* Firestore database (`firestoreDatabaseId` in `firebase-applet-config.json`). Admin SDK token verification is in `src/lib/firebase-admin.ts` and `src/middleware/auth.ts`.
- **Access control:** users sign up with `approvalStatus: 'pending'` and see no data until an admin approves them. The roles are SuperAdmin and Admin. Anonymous sign-in is not allowed. `firestore.rules` is the source of truth. `BOOTSTRAP_ADMIN_EMAILS` in `src/firebase.ts` must stay in sync with `isBootstrapAdmin()` in `firestore.rules`.
- **Server (`server.ts`):** Express 5. It serves `/api/quotations` (GET/POST) and `/api/quotations/report`, behind `requireAuth` (a Firebase ID token in `Authorization: Bearer`). These routes use Postgres through Drizzle (`src/db/`). The client side is `src/utils/quotationSqlApi.ts`, which falls back to `computeClientQuotationReport()` when the API is unavailable. Vercel deploys only the static `dist/` build, so these API routes do not run there.
- **Database (Drizzle/Postgres):** the schema is in `src/db/schema.ts` (`users`, `quotations`, `quotation_items`). The drizzle-kit config is `src/db/drizzle.config.ts`, which needs `SQL_HOST`, `SQL_DB_NAME`, `SQL_ADMIN_USER` and `SQL_ADMIN_PASSWORD`. The runtime pool uses `SQL_USER` and `SQL_PASSWORD`.

## Environment

- `.env.example` lists only `VITE_GOOGLE_MAPS_API_KEY`. The server also reads `SQL_HOST`, `SQL_USER`, `SQL_PASSWORD`, `SQL_DB_NAME`, `PORT` and `NODE_ENV`.
- All `.env*` files are gitignored except `.env.example`. Never commit secrets.

## Code style

- Write function components typed as `export const Name: React.FC<Props> = (...) => {}`, with named exports (not default exports). Use one component per file, with PascalCase filenames.
- Server-side and Node-run files import local modules **with** the `.ts` extension (for example `./src/db/users.ts`), because `tsx` and `node` run them directly. Frontend files import without an extension.
- Style with Tailwind utility classes only and support dark mode with `dark:` variants. Brand colours are `uniqtek-red` `#E21B23`, `uniqtek-navy` `#1E3A8A` and `uniqtek-blue` `#2563EB`. Combine classes with `clsx` or `tailwind-merge`.
- For errors, use `catch (error: unknown)` and narrow with `instanceof Error`. Express handlers return `res.status(...).json({ error })`.
- ESLint allows `any` and unused variables, but prefer proper types anyway.
- Keep the existing 2-space indent, single quotes and semicolons.

## Domain conventions

- **User-facing text is in Lao.** Status values are Lao strings that are compared literally, for example `ລໍຖ້າກວດເຊັກ`, `ກຳລັງສ້ອມແປງ` and `ສຳເລັດແລ້ວ`. Reuse the existing strings exactly. Don't translate them or invent variants. Code, identifiers and comments are in English.
- The currency is LAK. Quotation VAT is 7%. Quotations have a `refNo` and a `revision`, and saving one is an upsert that creates a new revision.
- Printable or PDF output (quotations, monthly reports) uses `jspdf` and `html2canvas`. The Lao font file is `PHETSARATH OT+TIME NEW ROMAN.TTF` in the repo root.
