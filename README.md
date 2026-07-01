# QPOS

QPOS adalah project point of sale full-stack dengan struktur monorepo.

## Struktur

```text
QPOS/
├── pos-web/
├── qpos-server/
├── Dokumentasi/
├── UI-design/
├── Backup/
└── README.md
```

## Workspace

- `pos-web`: frontend QPOS berbasis React dan Vite.
- `qpos-server`: backend QPOS berbasis Express.js, TypeScript, Prisma, dan PostgreSQL.
- `Dokumentasi`: dokumen pendukung project.
- `UI-design`: aset dan rancangan UI.
- `Backup`: arsip pendukung project.

## Development

Frontend:

```bash
cd pos-web
npm install
npm run dev
```

Backend:

```bash
cd qpos-server
npm install
npm run dev
```
