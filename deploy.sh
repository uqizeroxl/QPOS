#!/bin/bash
set -e

echo "=== QPOS Deploy ==="
cd ~/QPOS

echo "[1/3] Pulling latest changes..."
git pull

echo "[2/3] Building and restarting containers..."
sudo docker compose up -d --build

echo "[3/3] Done!"
