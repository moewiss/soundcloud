#!/bin/bash
# Configure MinIO with CORS policy

echo "Configuring MinIO..."

# Wait for MinIO to be ready
sleep 5

# Configure mc client
docker compose exec -T minio mc alias set local http://localhost:9000 sc_minio sc_minio_secret

# Create bucket if it doesn't exist
docker compose exec -T minio mc mb local/sc-bucket 2>/dev/null || echo "Bucket already exists"

# Set bucket to public (download only)
docker compose exec -T minio mc anonymous set download local/sc-bucket

# Set CORS policy
docker compose exec -T minio mc admin config set local api cors_allow_origin="*"

# Restart MinIO to apply changes
docker compose restart minio

echo "✅ MinIO configured with CORS support!"

