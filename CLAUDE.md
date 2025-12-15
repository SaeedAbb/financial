# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a comprehensive financial management application built with Spring Boot backend and Angular frontend. The system provides tools for tracking personal finances, budgets, and expenses with enterprise-grade architecture, comprehensive testing, and production-ready DevOps practices.

## Technology Stack

### Backend
- **Spring Boot 3.2.0** with Java 17
- **PostgreSQL** with Hibernate JPA
- **Maven** for dependency management
- **Flyway** for database migrations
- **OpenAPI 3.0** for API documentation
- **Mockito** for testing
- **Docker** for containerization

### Frontend
- **Angular 17** with standalone components
- **PrimeNG** UI component library
- **PrimeFlex** for CSS utilities
- **TypeScript** with strict mode
- **SCSS** for styling
- **Docker + Nginx** for production deployment

### DevOps
- **Docker Compose** for local development
- **GitHub Actions** for CI/CD
- **PostgreSQL** database
- **Nginx** reverse proxy

## Project Structure

```
basis-project/
├── backend/                    # Spring Boot application
│   ├── src/main/java/com/basis/api/
│   │   ├── config/            # Configuration classes
│   │   ├── controller/        # REST controllers
│   │   ├── dto/              # Data transfer objects
│   │   ├── entity/           # JPA entities
│   │   ├── exception/        # Exception handling
│   │   ├── repository/       # Data repositories
│   │   └── service/          # Business logic
│   ├── src/main/resources/
│   │   ├── db/migration/     # Flyway migrations
│   │   └── application*.yml  # Configuration files
│   ├── src/test/             # Tests
│   ├── Dockerfile
│   └── pom.xml
├── frontend/                  # Angular application
│   ├── src/app/
│   │   ├── core/             # Core services and models
│   │   ├── features/         # Feature modules
│   │   └── shared/           # Shared components
│   ├── src/environments/     # Environment configs
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── docker/                   # Docker configurations
│   ├── docker-compose.yml
│   └── postgres/
├── .github/workflows/        # CI/CD pipelines
└── pom.xml                   # Parent POM
```

## Development Commands

### Backend Development
```bash
cd backend
./mvnw spring-boot:run        # Start development server
./mvnw test                   # Run unit tests
./mvnw verify                 # Run integration tests
./mvnw clean package          # Build JAR file
```

### Frontend Development
```bash
cd frontend
npm start                     # Start development server
npm test                      # Run unit tests
npm run test:ci              # Run tests in CI mode
npm run build                # Build for development
npm run build:prod           # Build for production
npm run lint                 # Run linting
npm run e2e                  # Run e2e tests
```

### Docker Development
```bash
cd docker
docker-compose up -d          # Start all services
docker-compose logs -f        # View logs
docker-compose down           # Stop services
docker-compose --profile admin up -d  # Include PgAdmin
```

### Testing
```bash
# Run all backend tests
cd backend && ./mvnw test

# Run all frontend tests
cd frontend && npm run test:ci

# Run integration tests
cd backend && ./mvnw verify
```

## Architecture Notes

### Backend Architecture
- **RESTful API** with proper HTTP status codes
- **Layered architecture**: Controller → Service → Repository
- **JPA entities** with auditing (created/updated timestamps)
- **DTO pattern** for API contracts
- **Global exception handling** with proper error responses
- **Database migrations** with Flyway versioning
- **Comprehensive testing** with unit and integration tests

### Frontend Architecture
- **Feature-based** module organization
- **Standalone components** (Angular 17+ best practice)
- **Reactive forms** with validation
- **HTTP interceptors** for error handling
- **Environment-based** configuration
- **PrimeNG components** for consistent UI
- **Responsive design** with mobile-first approach

### Security Features
- **Input validation** with Bean Validation
- **CORS configuration** for cross-origin requests
- **Security headers** in nginx configuration
- **Non-root Docker containers**
- **Dependency scanning** with Trivy

## API Documentation

The REST API is documented with OpenAPI 3.0:
- **Swagger UI**: http://localhost:8080/swagger-ui.html
- **API Docs**: http://localhost:8080/v3/api-docs

## Database Management

- **Flyway migrations** in `backend/src/main/resources/db/migration/`
- **Naming convention**: `V{version}__{description}.sql`
- **Development database**: PostgreSQL (Docker)
- **Test database**: H2 in-memory
- **Production**: PostgreSQL

## Environment Configuration

### Local Development
- Backend: http://localhost:8080
- Frontend: http://localhost:4200
- Database: localhost:5432
- PgAdmin: http://localhost:5050 (with --profile admin)

### Docker Environment
- Frontend: http://localhost:80
- Backend: http://localhost:8080 (exposed)
- All services networked internally

## Deployment

### CI/CD Pipeline
- **Pull Request**: Runs tests, security scans, blocks merge on failure
- **Main Branch**: Builds Docker images, runs full test suite
- **GitHub Actions** with comprehensive workflow

### Production Deployment
1. Build Docker images
2. Push to container registry
3. Deploy with docker-compose or Kubernetes
4. Run database migrations
5. Verify health endpoints

## Common Tasks

### Adding a New Entity
1. Create JPA entity in `backend/src/main/java/com/basis/api/entity/`
2. Create Flyway migration in `backend/src/main/resources/db/migration/`
3. Create repository, service, controller, and DTO
4. Add comprehensive tests
5. Update API documentation

### Adding a New Frontend Feature
1. Generate component: `ng generate component features/feature-name`
2. Create service for API communication
3. Add routing if needed
4. Implement with PrimeNG components
5. Add unit tests

### Database Schema Changes
1. Create new Flyway migration: `V{next_version}__{description}.sql`
2. Update JPA entities if needed
3. Test migration locally
4. Update tests and documentation

## Troubleshooting

### Common Issues
- **Port conflicts**: Check if ports 8080, 4200, 5432 are available
- **Database connection**: Ensure PostgreSQL is running
- **Docker issues**: Try `docker-compose down && docker-compose up -d`
- **Angular build errors**: Clear node_modules and reinstall

### Health Checks
- Backend health: http://localhost:8080/actuator/health
- Database connection: Check application logs
- Frontend build: Check console for errors

## Best Practices

### Code Quality
- Follow established coding conventions
- Write comprehensive tests (aim for >80% coverage)
- Use meaningful commit messages
- Keep methods small and focused
- Document complex business logic

### Security
- Never commit secrets or API keys
- Validate all user inputs
- Use parameterized queries (JPA handles this)
- Keep dependencies updated
- Follow security headers best practices

### Performance
- Use database indexes appropriately
- Implement pagination for large datasets
- Optimize Docker images with multi-stage builds
- Use Angular OnPush change detection where appropriate
- Monitor application metrics