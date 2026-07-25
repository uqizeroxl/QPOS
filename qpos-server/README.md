# QPOS Server

Backend API untuk QPOS menggunakan Express.js, TypeScript, Prisma ORM, dan PostgreSQL.

## Prasyarat

- Node.js
- npm
- PostgreSQL

## Install PostgreSQL

Windows:

1. Unduh installer PostgreSQL dari `https://www.postgresql.org/download/windows/`.
2. Jalankan installer dan pilih komponen PostgreSQL Server, pgAdmin, dan Command Line Tools.
3. Simpan password user `postgres` yang dibuat saat instalasi.
4. Pastikan service PostgreSQL berjalan di port default `5432`.

macOS:

```bash
brew install postgresql
brew services start postgresql
```

Linux Ubuntu/Debian:

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl enable postgresql
sudo systemctl start postgresql
```

## Setup Project

Install dependency:

```bash
npm install
```

Buat file `.env` dari contoh:

```bash
cp .env.example .env
```

Sesuaikan `DATABASE_URL` di `.env`:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/qpos"
```

Ganti `password` sesuai password PostgreSQL lokal.

## Membuat Database qpos

Menggunakan `psql`:

```bash
psql -U postgres
CREATE DATABASE qpos;
\q
```

Atau dari pgAdmin:

1. Login ke server PostgreSQL lokal.
2. Klik kanan `Databases`.
3. Pilih `Create > Database`.
4. Isi nama database dengan `qpos`.
5. Simpan.

## Prisma

Generate Prisma Client:

```bash
npm run prisma:generate
```

Jalankan migration:

```bash
npm run prisma:migrate
```

Buka Prisma Studio:

```bash
npm run prisma:studio
```

## Script

```bash
npm run dev
npm run build
npm run prisma:generate
npm run prisma:migrate
npm run prisma:studio
```

Server development berjalan di `http://localhost:3000` secara default.
