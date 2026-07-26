SELECT 'CREATE DATABASE qpos_master' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'qpos_master')\gexec
