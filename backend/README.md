# IK Sociogram Backend

Simple social feed API built with Bun, Hono, Drizzle ORM, and SQLite.

## Run

```bash
bun install
bun run db:generate
bun run db:migrate
bun run dev
```

## Environment

Copy `.env.example` to `.env` if you want to override defaults.

## Main routes

- `POST /auth/register`
- `POST /auth/login`
- `GET /posts`
- `POST /posts`
- `GET /posts/:id/likes`
- `POST /posts/:id/like`
- `GET /posts/:id/comments`
- `POST /posts/:id/comments`
- `GET /comments/:id/likes`
- `POST /comments/:id/like`
