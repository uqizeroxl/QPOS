# QPOS

QPOS adalah aplikasi point of sale full-stack untuk operasional retail.

## Workspace

- `pos-web`: frontend React, TypeScript, Vite, Tailwind CSS.
- `qpos-server`: backend Express, TypeScript, Prisma, PostgreSQL.
- `Dokumentasi`: dokumen pendukung project.
- `UI-design`: aset dan rancangan UI.
- `Backup`: arsip pendukung project.

## Prasyarat

- Node.js
- PostgreSQL
- npm

## Environment

Salin file contoh environment sebelum menjalankan aplikasi.

Backend:

```bash
cd qpos-server
copy .env.example .env
```

Frontend:

```bash
cd pos-web
copy .env.example .env
```

## Development

Backend:

```bash
cd qpos-server
npm install
npm.cmd run prisma:migrate
npm.cmd run dev
```

Frontend:

```bash
cd pos-web
npm install
npm.cmd run dev
```

## Build

Backend:

```bash
cd qpos-server
npm.cmd run build
```

Frontend:

```bash
cd pos-web
npm.cmd run build
```

## Production

Docker Compose deployment, environment configuration, migration ordering, monitoring, backup, and restore procedures are documented in [DEPLOYMENT.md](DEPLOYMENT.md).

## Default Login

Jika tabel user masih kosong, backend akan membuat user owner pertama saat login:

- username: `owner`
- password: `owner123`

Untuk production, ubah nilai default melalui environment.
