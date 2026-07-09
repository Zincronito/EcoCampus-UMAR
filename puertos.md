# Puertos Necesarios para EcoCampus UMAR

## Desarrollo Local

| Servicio | Puerto | Protocolo | Notas |
|----------|--------|-----------|-------|
| Backend (FastAPI) | 8000 | HTTP | uvicorn |
| Dashboard (Next.js) | 3000 | HTTP | dev server |
| MinIO Console | 9001 | HTTP | UI MinIO |
| MinIO API | 9000 | HTTP | S3-compatible |
| PostgreSQL | 5432 | TCP | Base de datos |
| Expo (Mobile) | 19000-19006 | TCP/UDP | Desarrollo móvil |

## Producción (Servidor)

| Servicio | Puerto | Protocolo |
|----------|--------|-----------|
| Backend | 8000 | HTTPS |
| Dashboard | 3000 | HTTPS |
| MinIO API | 9000 | HTTPS |

## Proxy Inverso (Recomendado)

```nginx
# Backend
location /api/v1 {
    proxy_pass http://localhost:8000;
}

# Dashboard
location / {
    proxy_pass http://localhost:3000;
}

# MinIO
location /minio {
    proxy_pass http://localhost:9000;
}
```