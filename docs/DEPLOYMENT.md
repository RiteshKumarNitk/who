# Deployment Guide

## Docker Compose (Local/Staging)

```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f app

# Stop
docker compose down
```

## Production Deployment (AWS)

### Prerequisites
- AWS ECS cluster or EC2 instance
- RDS PostgreSQL with PostGIS extension
- Elasticache Redis (optional)
- S3 bucket for file storage
- CloudFront CDN for static assets

### ECS Deployment

1. **Build Docker image:**
```bash
docker build -t who-gis:latest .
docker tag who-gis:latest <account>.dkr.ecr.<region>.amazonaws.com/who-gis:latest
docker push <account>.dkr.ecr.<region>.amazonaws.com/who-gis:latest
```

2. **Environment variables (AWS Secrets Manager):**
```
DATABASE_URL=postgresql://user:password@host:5432/who_gis
JWT_SECRET=...
MAPBOX_TOKEN=...
REDIS_URL=redis://...
```

3. **Task Definition (ECS):**
```json
{
  "family": "who-gis",
  "networkMode": "awsvpc",
  "containerDefinitions": [{
    "name": "app",
    "image": "<account>.dkr.ecr.<region>.amazonaws.com/who-gis:latest",
    "portMappings": [{"containerPort": 3000}],
    "environment": [
      {"name": "NODE_ENV", "value": "production"}
    ],
    "secrets": [
      {"name": "DATABASE_URL", "valueFrom": "arn:aws:secretsmanager:..."}
    ],
    "logConfiguration": {
      "logDriver": "awslogs",
      "options": {
        "awslogs-group": "/ecs/who-gis",
        "awslogs-region": "us-east-1"
      }
    }
  }]
}
```

### Vercel Deployment (Simpler)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

Configure environment variables in Vercel dashboard.

## Database Migration

```bash
# Development
npx prisma migrate dev --name init

# Production
npx prisma migrate deploy

# Generate Client
npx prisma generate

# Seed Data
npx ts-node src/db/seeds/seed.ts
```

## Monitoring & Logging

- **Application Logs**: Winston with AWS CloudWatch/Datadog transport
- **Database**: pg_stat_statements, slow query logging
- **Performance**: Vercel Analytics or Datadog RUM
- **Uptime**: AWS CloudWatch alarms or Pingdom
- **Errors**: Sentry error tracking

## Backup Strategy

- **Database**: Daily automated RDS snapshots, 30-day retention
- **Files**: S3 versioning enabled
- **Config**: Infrastructure as Code (Terraform/CDK)

## CI/CD Pipeline

See `.github/workflows/ci-cd.yml` for GitHub Actions workflow:
1. Lint & Type Check
2. Run Tests
3. Build Docker Image
4. Push to Container Registry
5. Deploy to ECS/Vercel
