#!/bin/bash
# Mino-Chat dev server launcher
cd "$(dirname "$0")/.."
export DATABASE_URL="postgresql://mino_chat:mino_chat_dev@localhost:5432/mino_chat?schema=public"
export DIRECT_URL="postgresql://mino_chat:mino_chat_dev@localhost:5432/mino_chat?schema=public"
export JWT_SECRET="dev-secret-change-in-production-min-32-chars"
export JWT_REFRESH_SECRET="dev-refresh-secret-change-in-production"
export REDIS_URL="redis://localhost:6379"
export S3_ENDPOINT="http://localhost:9000"
export S3_ACCESS_KEY="minioadmin"
export S3_SECRET_KEY="minioadmin"
export S3_BUCKET="mino-chat"
export S3_PUBLIC_URL="http://localhost:9000/mino-chat"
export CORS_ORIGIN="http://localhost:5173"
export NODE_ENV=development

exec node apps/server/dist/index.js
