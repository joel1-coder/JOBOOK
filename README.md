# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Environment setup

Copy `.env.example` to `.env` and set your MongoDB Atlas credentials before running the app:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/jobook?retryWrites=true&w=majority
VITE_MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/jobook?retryWrites=true&w=majority
MONGODB_DB=jobook
VITE_MONGODB_DB=jobook
VITE_DATABASE_MODE=mongodb
```

## Running the app

Start both the frontend and MongoDB API server:

```bash
npm run dev:all
```

Or run them separately:
- Frontend: `npm run dev` (runs on http://localhost:5174)
- API Server: `npm run dev:mongo` (runs on http://localhost:5000)

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
