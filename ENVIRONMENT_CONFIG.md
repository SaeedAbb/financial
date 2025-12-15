# Environment Configuration Guide

This document provides a comprehensive guide to configuring the Basis Project for different environments (development, staging, production).

## Overview

The application uses environment-specific configuration files and environment variables to manage different settings across environments. This ensures that sensitive information like database credentials and API URLs can be configured without modifying the code.

## Frontend Environment Variables

### Development Environment (`frontend/src/environments/environment.ts`)

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api/v1',
  keycloakUrl: 'http://localhost:8180',
  keycloakRealm: 'basis-realm',
  keycloakClientId: 'basis-frontend',
  appUrl: 'http://localhost:4200',
  swaggerUrl: 'http://localhost:8080/swagger-ui.html'
};
```

### Production Environment (`frontend/src/environments/environment.prod.ts`)

The production environment file uses placeholders that get replaced during Docker build:

| Variable | Description | Example |
|----------|-------------|---------|
| `API_URL` | Backend API URL | `https://api.yourdomain.com/api/v1` |
| `KEYCLOAK_URL` | Keycloak authentication server URL | `https://auth.yourdomain.com` |
| `KEYCLOAK_REALM` | Keycloak realm name | `basis-realm` |
| `KEYCLOAK_CLIENT_ID` | Keycloak client ID for frontend | `basis-frontend` |
| `APP_URL` | Frontend application URL | `https://app.yourdomain.com` |
| `SWAGGER_URL` | Swagger UI documentation URL | `https://api.yourdomain.com/swagger-ui.html` |

## Backend Environment Variables

### Database Configuration

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `DB_HOST` | Database host | `localhost` | `postgres.example.com` |
| `DB_PORT` | Database port | `5432` | `5432` |
| `DB_NAME` | Database name | `basis_db` | `production_db` |
| `DB_USERNAME` | Database username | `basis_user` | `prod_user` |
| `DB_PASSWORD` | Database password | `basis_password` | `strong_password_here` |

### Keycloak Configuration

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `KEYCLOAK_ISSUER_URI` | Keycloak issuer URI | `http://localhost:8180/realms/basis-realm` | `https://auth.example.com/realms/prod` |
| `KEYCLOAK_JWK_SET_URI` | Keycloak JWK set URI | `http://localhost:8180/realms/basis-realm/protocol/openid-connect/certs` | `https://auth.example.com/realms/prod/protocol/openid-connect/certs` |
| `KEYCLOAK_REALM` | Keycloak realm | `basis-realm` | `production` |
| `KEYCLOAK_ADMIN_SERVER_URL` | Keycloak admin URL | `http://localhost:8180` | `https://auth.example.com` |
| `KEYCLOAK_ADMIN_USERNAME` | Keycloak admin username | `admin` | `keycloak_admin` |
| `KEYCLOAK_ADMIN_PASSWORD` | Keycloak admin password | `admin` | `secure_admin_password` |

### CORS Configuration

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `CORS_ALLOWED_ORIGINS` | Allowed origins for CORS | `http://localhost:4200,http://localhost:3000,http://localhost:8080,http://localhost` | `https://app.example.com,https://www.example.com` |
| `CORS_ALLOWED_METHODS` | Allowed HTTP methods | `GET,POST,PUT,DELETE,OPTIONS,PATCH` | `GET,POST,PUT,DELETE` |
| `CORS_ALLOWED_HEADERS` | Allowed headers | `*` | `Content-Type,Authorization` |
| `CORS_ALLOW_CREDENTIALS` | Allow credentials | `true` | `true` |

### Server Configuration

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `SERVER_PORT` | Server port | `8080` | `8080` |
| `JAVA_OPTS` | JVM options | `-Xmx512m -Xms256m` | `-Xmx2g -Xms1g` |
| `SPRING_PROFILES_ACTIVE` | Active Spring profile | `default` | `prod` |

## Docker Configuration

### Development (`docker/docker-compose.yml`)

The development Docker Compose file includes all services with default configurations suitable for local development.

### Production (`docker/docker-compose.prod.yml`)

The production Docker Compose file uses environment variables for all configurations. Create a `.env` file based on `.env.example`:

```bash
cp docker/.env.example docker/.env
# Edit .env file with your production values
```

### Environment File Example (`docker/.env.example`)

```env
# Database Configuration
DB_HOST=postgres
DB_PORT=5432
DB_NAME=basis_db
DB_USERNAME=basis_user
DB_PASSWORD=change_me_in_production

# Docker Registry
DOCKER_REGISTRY=your-registry.com
VERSION=latest

# Application URLs
API_URL=https://api.yourdomain.com/api/v1
APP_URL=https://app.yourdomain.com
SWAGGER_URL=https://api.yourdomain.com/swagger-ui.html

# Keycloak Configuration
KEYCLOAK_URL=https://auth.yourdomain.com
KEYCLOAK_REALM=basis-realm
KEYCLOAK_CLIENT_ID=basis-frontend
KEYCLOAK_ADMIN_USERNAME=admin
KEYCLOAK_ADMIN_PASSWORD=change_me_in_production

# CORS Configuration
CORS_ALLOWED_ORIGINS=https://app.yourdomain.com,https://yourdomain.com
CORS_ALLOWED_METHODS=GET,POST,PUT,DELETE,OPTIONS
CORS_ALLOWED_HEADERS=Content-Type,Authorization
CORS_ALLOW_CREDENTIALS=true

# Frontend Port
FRONTEND_PORT=80

# JVM Options for Backend
JAVA_OPTS=-Xmx1g -Xms512m
```

## Deployment Instructions

### Local Development

1. Use the default configurations in `environment.ts` and `application.yml`
2. Run services with: `cd docker && docker-compose up -d`

### Production Deployment

1. Create environment-specific `.env` file:
   ```bash
   cp docker/.env.example docker/.env.prod
   # Edit .env.prod with production values
   ```

2. Build production images:
   ```bash
   docker build -t your-registry.com/basis-backend:latest -f backend/Dockerfile .
   docker build -t your-registry.com/basis-frontend:latest -f frontend/Dockerfile.prod frontend/
   ```

3. Push images to registry:
   ```bash
   docker push your-registry.com/basis-backend:latest
   docker push your-registry.com/basis-frontend:latest
   ```

4. Deploy with production compose file:
   ```bash
   docker-compose -f docker/docker-compose.prod.yml --env-file docker/.env.prod up -d
   ```

### Kubernetes Deployment

For Kubernetes deployments, use ConfigMaps and Secrets:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: basis-config
data:
  API_URL: "https://api.yourdomain.com/api/v1"
  KEYCLOAK_URL: "https://auth.yourdomain.com"
  KEYCLOAK_REALM: "basis-realm"
  # ... other non-sensitive configs
---
apiVersion: v1
kind: Secret
metadata:
  name: basis-secrets
type: Opaque
stringData:
  DB_PASSWORD: "your-secure-password"
  KEYCLOAK_ADMIN_PASSWORD: "your-admin-password"
  # ... other sensitive configs
```

## Security Best Practices

1. **Never commit `.env` files** - Always use `.env.example` as a template
2. **Use strong passwords** in production
3. **Rotate credentials regularly**
4. **Use HTTPS** for all production URLs
5. **Restrict CORS origins** to only necessary domains
6. **Use secrets management** tools (HashiCorp Vault, AWS Secrets Manager, etc.) in production
7. **Enable security headers** in nginx/reverse proxy configuration

## Troubleshooting

### Common Issues

1. **CORS errors**: Check `CORS_ALLOWED_ORIGINS` includes your frontend URL
2. **Authentication failures**: Verify Keycloak URLs and realm configuration
3. **Database connection issues**: Check network connectivity and credentials
4. **API connection errors**: Ensure backend is accessible from frontend container

### Debugging

1. Check container logs:
   ```bash
   docker logs basis-backend
   docker logs basis-frontend
   ```

2. Verify environment variables:
   ```bash
   docker exec basis-backend printenv
   docker exec basis-frontend printenv
   ```

3. Test connectivity:
   ```bash
   docker exec basis-frontend ping backend
   docker exec basis-backend ping postgres
   ```