# Financial Management System

A comprehensive financial management application built with Spring Boot backend and Angular frontend. This system provides tools for tracking personal finances, budgets, and expenses with enterprise-grade architecture, comprehensive testing, and production-ready DevOps practices.

![CI/CD](https://github.com/your-username/financial-project/workflows/CI/CD%20Pipeline/badge.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Java](https://img.shields.io/badge/Java-17-orange.svg)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2.0-green.svg)
![Angular](https://img.shields.io/badge/Angular-20-red.svg)

## 🚀 Features

### Backend (Spring Boot)
- **Framework**: Spring Boot 3.2.0 with Java 17
- **Database**: PostgreSQL with Hibernate JPA
- **API Documentation**: OpenAPI 3.0 (Swagger UI)
- **Database Migration**: Flyway
- **Testing**: Comprehensive unit and integration tests with Mockito
- **Security**: Production-ready security headers and configurations
- **Monitoring**: Spring Boot Actuator with health checks
- **Containerization**: Multi-stage Docker builds

### Frontend (Angular)
- **Framework**: Angular 20 with standalone components
- **UI Library**: PrimeNG with 90+ components
- **Styling**: PrimeFlex CSS utilities and SCSS
- **HTTP Client**: Angular HttpClient with interceptors
- **Testing**: Jasmine/Karma unit tests and Cypress e2e tests
- **Build**: Production-optimized builds with nginx
- **Responsive**: Mobile-first responsive design

### DevOps & Infrastructure
- **Containerization**: Docker and Docker Compose
- **CI/CD**: GitHub Actions with automated testing
- **Database**: PostgreSQL with automated migrations
- **Reverse Proxy**: Nginx with production optimizations
- **Monitoring**: Health checks and logging
- **Security**: Container security scanning with Trivy

## 📋 Prerequisites

- **Java 17** or higher
- **Node.js 20** or higher
- **Docker** and **Docker Compose**
- **Maven 3.8+** (included in wrapper)
- **Git** for version control

## 🏗️ Project Structure

```
basis-project/
├── backend/                    # Spring Boot backend
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/basis/api/
│   │   │   │   ├── config/     # Configuration classes
│   │   │   │   ├── controller/ # REST controllers
│   │   │   │   ├── dto/        # Data transfer objects
│   │   │   │   ├── entity/     # JPA entities
│   │   │   │   ├── exception/  # Exception handling
│   │   │   │   ├── repository/ # Data repositories
│   │   │   │   └── service/    # Business logic
│   │   │   └── resources/
│   │   │       ├── db/migration/   # Flyway migrations
│   │   │       └── application*.yml
│   │   └── test/               # Unit and integration tests
│   ├── Dockerfile
│   └── pom.xml
├── frontend/                   # Angular frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/          # Core services and models
│   │   │   ├── features/      # Feature modules
│   │   │   └── shared/        # Shared components
│   │   └── environments/      # Environment configurations
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── docker/                     # Docker configurations
│   ├── docker-compose.yml
│   └── postgres/
├── .github/workflows/          # CI/CD pipelines
├── pom.xml                     # Parent POM
└── README.md
```

## 🚀 Quick Start

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/basis-project.git
   cd basis-project
   ```

2. **Start the database**
   ```bash
   cd docker
   docker-compose up postgres -d
   ```

3. **Run the backend**
   ```bash
   cd backend
   ./mvnw spring-boot:run
   ```

4. **Run the frontend**
   ```bash
   cd frontend
   npm install
   npm start
   ```

5. **Access the application**
   - Frontend: http://localhost:4200
   - Backend API: http://localhost:8080
   - API Documentation: http://localhost:8080/swagger-ui.html
   - Actuator Health: http://localhost:8080/actuator/health

### Docker Development

1. **Start all services**
   ```bash
   cd docker
   docker-compose up -d
   ```

2. **View logs**
   ```bash
   docker-compose logs -f
   ```

3. **Stop services**
   ```bash
   docker-compose down
   ```

### With Database Admin (PgAdmin)

```bash
cd docker
docker-compose --profile admin up -d
```

Access PgAdmin at http://localhost:5050 (admin@basis.com / admin123)

## 🧪 Testing

### Backend Tests
```bash
cd backend
./mvnw test                    # Unit tests
./mvnw verify                  # Integration tests
./mvnw jacoco:report           # Coverage report
```

### Frontend Tests
```bash
cd frontend
npm test                       # Unit tests
npm run test:coverage          # Coverage report
npm run e2e                    # End-to-end tests
npm run lint                   # Code linting
```

### Full Test Suite
```bash
# Run all tests
./mvnw test -f backend/pom.xml
cd frontend && npm run test:ci
```

## 📦 Building for Production

### Manual Build
```bash
# Backend
cd backend
./mvnw clean package

# Frontend
cd frontend
npm run build:prod
```

### Docker Build
```bash
# Build images
docker build -t basis-backend ./backend
docker build -t basis-frontend ./frontend

# Or use docker-compose
cd docker
docker-compose build
```

## 🔧 Configuration

### Environment Variables

#### Backend
- `DB_HOST`: Database host (default: localhost)
- `DB_PORT`: Database port (default: 5432)
- `DB_NAME`: Database name (default: basis_db)
- `DB_USERNAME`: Database username (default: basis_user)
- `DB_PASSWORD`: Database password (default: basis_password)
- `SERVER_PORT`: Server port (default: 8080)

#### Frontend
- `API_URL`: Backend API URL (configured in environment files)

### Profiles
- `default`: Local development
- `test`: Testing with H2 database
- `docker`: Docker container environment

## 🔒 Security

- CORS configuration for cross-origin requests
- Input validation with Bean Validation
- SQL injection prevention with JPA/Hibernate
- XSS protection with security headers
- Container security with non-root users
- Dependency vulnerability scanning with Trivy

## 📊 Monitoring

- **Health Checks**: Available at `/actuator/health`
- **Metrics**: Prometheus-compatible metrics at `/actuator/metrics`
- **Application Info**: Available at `/actuator/info`
- **Container Health**: Docker health checks configured

## 🚢 Deployment

### GitHub Actions CI/CD

The project includes a comprehensive CI/CD pipeline that:

1. **On Pull Request**:
   - Runs unit tests for backend and frontend
   - Performs security scanning with Trivy
   - Runs integration tests
   - Blocks merge if tests fail

2. **On Main Branch**:
   - Builds and pushes Docker images to GitHub Container Registry (ghcr.io)
   - Runs full test suite
   - Creates deployment artifacts

### Manual Deployment

1. **Build production images**
   ```bash
   docker build -t your-registry/basis-backend:latest ./backend
   docker build -t your-registry/basis-frontend:latest ./frontend
   ```

2. **Push to registry**
   ```bash
   docker push your-registry/basis-backend:latest
   docker push your-registry/basis-frontend:latest
   ```

3. **Deploy with docker-compose**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

## 📚 API Documentation

The REST API is documented using OpenAPI 3.0. Access the interactive documentation:

- **Swagger UI**: http://localhost:8080/swagger-ui.html
- **OpenAPI JSON**: http://localhost:8080/v3/api-docs

### Example API Endpoints

- `GET /api/v1/users` - Get all users
- `POST /api/v1/users` - Create a new user
- `GET /api/v1/users/{uuid}` - Get user by UUID
- `PUT /api/v1/users/{uuid}` - Update user
- `DELETE /api/v1/users/{uuid}` - Delete user

## 🛠️ Development Guidelines

### Backend Development
- Follow Spring Boot best practices
- Use DTOs for API contracts
- Implement proper exception handling
- Write comprehensive tests
- Follow RESTful API design principles

### Frontend Development
- Use Angular standalone components
- Implement reactive forms with validation
- Follow Angular style guide
- Use PrimeNG components consistently
- Implement proper error handling

### Database Management
- Create Flyway migrations for schema changes
- Use meaningful migration names: `V{version}__{description}.sql`
- Never modify existing migrations
- Test migrations on local database first

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:

- Create an issue on GitHub
- Check the documentation
- Review the API documentation at `/swagger-ui.html`

## 🙏 Acknowledgments

- [Spring Boot](https://spring.io/projects/spring-boot) - Backend framework
- [Angular](https://angular.io/) - Frontend framework
- [PrimeNG](https://primeng.org/) - Angular UI components
- [PostgreSQL](https://www.postgresql.org/) - Database
- [Docker](https://www.docker.com/) - Containerization
- [GitHub Actions](https://github.com/features/actions) - CI/CD