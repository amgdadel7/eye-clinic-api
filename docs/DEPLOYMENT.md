# Deployment Documentation

This document describes how to deploy the Eye Clinic API to various platforms.

## Overview

The Eye Clinic API can be deployed to multiple platforms including:
- Vercel (Serverless)
- Heroku
- AWS
- DigitalOcean
- Traditional VPS/Dedicated Server

## Prerequisites

Before deploying, ensure you have:
1. Node.js 20.x or higher
2. MySQL 8.0+ database
3. Environment variables configured
4. Database schema imported
5. Dependencies installed

## Environment Variables

Set the following environment variables before deployment:

```env
# Database Configuration
DB_HOST=your_database_host
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_NAME=eye_clinic_db
DB_PORT=3306
DB_SSL=false

# JWT Configuration
JWT_SECRET=your_super_secret_key_min_32_characters
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=5000
NODE_ENV=production

# CORS Configuration
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

## Deployment Options

### 1. Vercel (Serverless)

Vercel is recommended for serverless deployment.

#### Setup

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy:
```bash
vercel
```

4. Set environment variables in Vercel dashboard:
   - Go to Project Settings → Environment Variables
   - Add all required environment variables

#### Configuration

Create `vercel.json` in the project root:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/index.js"
    },
    {
      "src": "/health",
      "dest": "/api/health.js"
    }
  ]
}
```

#### Database

For Vercel, use a managed MySQL database service:
- AWS RDS
- PlanetScale
- Railway
- Supabase

### 2. Heroku

#### Setup

1. Install Heroku CLI:
```bash
# macOS
brew tap heroku/brew && brew install heroku

# Windows
# Download from https://devcenter.heroku.com/articles/heroku-cli
```

2. Login to Heroku:
```bash
heroku login
```

3. Create a Heroku app:
```bash
heroku create eye-clinic-api
```

4. Add MySQL addon:
```bash
heroku addons:create jawsdb:kitefin
```

5. Set environment variables:
```bash
heroku config:set JWT_SECRET=your_secret_key
heroku config:set JWT_EXPIRES_IN=7d
heroku config:set NODE_ENV=production
heroku config:set ALLOWED_ORIGINS=https://yourdomain.com
```

6. Deploy:
```bash
git push heroku main
```

#### Procfile

Create `Procfile` in the project root:

```
web: node src/server.js
```

### 3. AWS (EC2 + RDS)

#### Setup EC2 Instance

1. Launch EC2 instance (Ubuntu 20.04 LTS)
2. SSH into the instance:
```bash
ssh -i your-key.pem ubuntu@your-ec2-ip
```

3. Install Node.js:
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

4. Install PM2:
```bash
sudo npm install -g pm2
```

5. Clone repository:
```bash
git clone your-repo-url
cd eye-clinic-api
```

6. Install dependencies:
```bash
npm install --production
```

7. Set environment variables:
```bash
sudo nano /etc/environment
# Add environment variables
```

8. Start with PM2:
```bash
pm2 start src/server.js --name eye-clinic-api
pm2 save
pm2 startup
```

#### Setup RDS Database

1. Create RDS MySQL instance
2. Configure security group to allow EC2 access
3. Set database endpoint in environment variables

### 4. DigitalOcean

#### Setup Droplet

1. Create Droplet (Ubuntu 20.04)
2. SSH into Droplet:
```bash
ssh root@your-droplet-ip
```

3. Follow AWS EC2 setup steps (steps 3-8)

#### Database

Use DigitalOcean Managed Databases:
1. Create MySQL database cluster
2. Get connection string
3. Update environment variables

### 5. Traditional VPS/Dedicated Server

#### Setup

1. Install Node.js (see AWS EC2 step 3)
2. Install MySQL:
```bash
sudo apt update
sudo apt install mysql-server
```

3. Create database:
```bash
sudo mysql -u root -p
CREATE DATABASE eye_clinic_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

4. Import schema:
```bash
mysql -u root -p eye_clinic_db < database/schema.sql
```

5. Install PM2 (see AWS EC2 step 4)
6. Clone and setup application (see AWS EC2 steps 5-8)

## Post-Deployment Steps

### 1. Database Migration

If you have migrations, run them:
```bash
python scripts/apply_patient_auth_migration.py \
  --host your_db_host \
  --user your_db_user \
  --password your_db_password \
  --database eye_clinic_db
```

### 2. Health Check

Verify the API is running:
```bash
curl https://your-api-domain.com/health
```

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "service": "Eye Clinic API"
}
```

### 3. API Documentation

Access Swagger documentation:
```
https://your-api-domain.com/api-docs
```

### 4. Test Endpoints

Test a public endpoint:
```bash
curl https://your-api-domain.com/api/clinics
```

## SSL/HTTPS Configuration

### Using Vercel

HTTPS is automatically configured by Vercel.

### Using Nginx (Reverse Proxy)

1. Install Nginx:
```bash
sudo apt install nginx
```

2. Install Certbot:
```bash
sudo apt install certbot python3-certbot-nginx
```

3. Configure Nginx:
```nginx
server {
    listen 80;
    server_name your-api-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

4. Obtain SSL certificate:
```bash
sudo certbot --nginx -d your-api-domain.com
```

## Monitoring

### PM2 Monitoring

```bash
pm2 monit
pm2 logs eye-clinic-api
```

### Health Monitoring

Set up health check monitoring:
- UptimeRobot
- Pingdom
- AWS CloudWatch

## Backup Strategy

### Database Backup

1. Automated backups:
```bash
# Add to crontab
0 2 * * * mysqldump -u root -p password eye_clinic_db > /backups/eye_clinic_db_$(date +\%Y\%m\%d).sql
```

2. Cloud storage backups:
```bash
# Upload to S3, Google Cloud Storage, etc.
aws s3 cp /backups/eye_clinic_db_$(date +\%Y\%m\%d).sql s3://your-bucket/backups/
```

## Scaling

### Horizontal Scaling

1. **Load Balancer**: Use Nginx or AWS ELB
2. **Multiple Instances**: Run multiple API instances
3. **Database Connection Pool**: Adjust pool size based on load

### Vertical Scaling

1. **Increase Server Resources**: More CPU/RAM
2. **Database Optimization**: Indexes, query optimization
3. **Caching**: Redis for frequently accessed data

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Check database credentials
   - Verify network access
   - Check firewall rules

2. **Port Already in Use**
   ```bash
   # Find process using port 5000
   lsof -i :5000
   # Kill process
   kill -9 PID
   ```

3. **Environment Variables Not Loading**
   - Verify `.env` file exists
   - Check environment variable syntax
   - Restart the application

4. **CORS Errors**
   - Verify `ALLOWED_ORIGINS` includes your frontend domain
   - Check CORS middleware configuration

5. **Rate Limiting Issues**
   - Adjust rate limit settings if needed
   - Consider using Redis for distributed rate limiting

## Performance Optimization

### 1. Enable Gzip Compression

```javascript
const compression = require('compression');
app.use(compression());
```

### 2. Database Connection Pooling

```javascript
const pool = mysql.createPool({
    connectionLimit: 20, // Increase for production
    // ... other config
});
```

### 3. Enable Caching

Consider using Redis for:
- Session storage
- Frequently accessed data
- Rate limiting

### 4. Query Optimization

- Use database indexes
- Optimize slow queries
- Use query result caching

## Security Checklist

- [ ] HTTPS enabled
- [ ] Environment variables secured
- [ ] JWT_SECRET is strong (32+ characters)
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Database credentials secured
- [ ] Regular security updates
- [ ] Firewall configured
- [ ] Backups automated
- [ ] Monitoring enabled

## Rollback Procedure

If deployment fails:

1. **Vercel**: Use dashboard to rollback to previous deployment
2. **Heroku**: `heroku rollback v123`
3. **PM2**: 
   ```bash
   pm2 restart eye-clinic-api
   # Or restore from backup
   ```

## Support

For deployment issues, check:
- Platform-specific documentation
- Application logs
- Database logs
- Network connectivity

