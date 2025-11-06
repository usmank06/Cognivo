# 🚀 Deployment Guide - Cognivo

This guide covers deploying Cognivo to production environments.

## 📋 Table of Contents

- [Deployment Options](#deployment-options)
- [Environment Variables](#environment-variables)
- [Frontend Deployment](#frontend-deployment)
- [Backend Deployment](#backend-deployment)
- [Database Setup](#database-setup)
- [Security Checklist](#security-checklist)

## 🌐 Deployment Options

### Recommended Stack

**Frontend:**
- Vercel (recommended)
- Netlify
- AWS S3 + CloudFront

**Node.js API:**
- Railway
- Render
- Heroku
- AWS EC2/ECS

**Python API:**
- Railway
- Render
- Google Cloud Run
- AWS Lambda (with API Gateway)

**Database:**
- MongoDB Atlas (recommended)
- AWS DocumentDB
- Self-hosted MongoDB

## 🔐 Environment Variables

### Production `.env` Setup

**DO NOT use the development `.env` in production!**

Create a production environment file with:

```env
# Anthropic API
ANTHROPIC_API_KEY=your-production-api-key

# Server Configuration
NODE_ENV=production
API_SERVER_PORT=3001
PYTHON_API_PORT=8000

# MongoDB (Production)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/cognivo?retryWrites=true&w=majority

# CORS (Update with your frontend domain)
FRONTEND_URL=https://yourdomain.com

# API URLs (Update with your deployed URLs)
NODE_API_URL=https://api.yourdomain.com
PYTHON_API_URL=https://python-api.yourdomain.com
```

### Using MongoDB Atlas (Recommended)

1. **Create Account:**
   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Sign up for free tier

2. **Create Cluster:**
   - Create new cluster
   - Choose region close to your users
   - Select M0 (free tier) or higher

3. **Setup Database:**
   - Create database: `cognivo`
   - Create user with read/write access
   - Get connection string

4. **Update Code:**

   In `src/db/mongodb.ts`:
   ```typescript
   export async function connectDB() {
     try {
       const uri = process.env.MONGODB_URI || 'fallback-uri';
       await mongoose.connect(uri);
       
       // Setup GridFS
       const db = mongoose.connection.db;
       gridFSBucket = new GridFSBucket(db, {
         bucketName: 'uploads'
       });
       
       console.log('✅ MongoDB connected (Production)');
       return mongoose.connection;
     } catch (error) {
       console.error('❌ MongoDB connection error:', error);
       throw error;
     }
   }
   ```

## 🎨 Frontend Deployment (Vercel)

### 1. Build Configuration

In `vite.config.ts`:
```typescript
export default defineConfig({
  plugins: [react()],
  build: {
    target: 'esnext',
    outDir: 'dist',
    sourcemap: false, // Disable in production
  },
  server: {
    port: 3000,
  },
});
```

### 2. Environment Variables

In Vercel dashboard, add:
```
VITE_API_URL=https://api.yourdomain.com
VITE_PYTHON_API_URL=https://python-api.yourdomain.com
```

### 3. Deploy

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

Or connect GitHub repo to Vercel for automatic deployments.

## 🔧 Backend Deployment (Railway)

### Node.js API

1. **Create `railway.json`:**
   ```json
   {
     "build": {
       "builder": "NIXPACKS"
     },
     "deploy": {
       "startCommand": "node api-server.js",
       "restartPolicyType": "ON_FAILURE",
       "restartPolicyMaxRetries": 10
     }
   }
   ```

2. **Add Environment Variables in Railway:**
   - `ANTHROPIC_API_KEY`
   - `MONGODB_URI`
   - `FRONTEND_URL`
   - `PYTHON_API_URL`

3. **Deploy:**
   - Connect GitHub repo
   - Railway auto-deploys on push

### Python API

1. **Create `Procfile`:**
   ```
   web: uvicorn main:app --host 0.0.0.0 --port $PORT
   ```

2. **Update `main.py`:**
   ```python
   if __name__ == "__main__":
       port = int(os.getenv("PORT", "8000"))
       uvicorn.run(
           "main:app",
           host="0.0.0.0",
           port=port,
           log_level="info"
       )
   ```

3. **Add Environment Variables:**
   - `ANTHROPIC_API_KEY`
   - `NODE_API_URL`

4. **Deploy:**
   - Connect GitHub repo
   - Railway auto-deploys

## 🔒 Security Checklist

### Before Deployment

- [ ] All sensitive data in environment variables
- [ ] No hardcoded API keys in code
- [ ] `.env` files in `.gitignore`
- [ ] CORS properly configured
- [ ] Rate limiting implemented
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (using Mongoose)
- [ ] XSS prevention (React auto-escapes)

### CORS Configuration

In `api-server.js`:
```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
}));
```

In `python-api/main.py`:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        os.getenv("FRONTEND_URL", "http://localhost:3000"),
        os.getenv("NODE_API_URL", "http://localhost:3001"),
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Rate Limiting

Add to `api-server.js`:
```javascript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later.'
});

app.use('/api/', limiter);
```

Add to `package.json`:
```json
"dependencies": {
  "express-rate-limit": "^7.1.5"
}
```

## 📊 Monitoring

### Logging

**Node.js:**
```javascript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}
```

**Python:**
```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('app.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)
```

### Health Checks

**Node.js API:**
```javascript
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    mongodb: mongoose.connection.readyState === 1,
  });
});
```

**Python API:**
```python
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "anthropic_configured": bool(ANTHROPIC_API_KEY)
    }
```

## 🚀 CI/CD Pipeline

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - uses: actions/setup-python@v4
        with:
          python-version: '3.9'
      
      - name: Install dependencies
        run: |
          npm install
          cd python-api && pip install -r requirements.txt
      
      - name: Run Python tests
        run: cd python-api && python test_api.py
  
  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Railway
        run: |
          # Railway CLI deployment
          echo "Deploying to Railway..."
```

## 📦 Docker Deployment (Optional)

### Dockerfile for Node.js API

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 3001

CMD ["node", "api-server.js"]
```

### Dockerfile for Python API

```dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY python-api/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY python-api/ .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Docker Compose

```yaml
version: '3.8'

services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    ports:
      - "3000:80"
    environment:
      - VITE_API_URL=${API_URL}
  
  api:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3001:3001"
    environment:
      - MONGODB_URI=${MONGODB_URI}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
  
  python-api:
    build:
      context: .
      dockerfile: Dockerfile.python
    ports:
      - "8000:8000"
    environment:
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
```

## 🔄 Database Migration

When moving from local MongoDB to Atlas:

1. **Export local data:**
   ```bash
   mongodump --db cognivo --out ./backup
   ```

2. **Import to Atlas:**
   ```bash
   mongorestore --uri "mongodb+srv://user:pass@cluster.mongodb.net" --db cognivo ./backup/cognivo
   ```

## 📈 Performance Optimization

### Frontend

- Enable gzip compression
- Use CDN for static assets
- Implement code splitting
- Lazy load components
- Optimize images

### Backend

- Enable response compression
- Implement caching (Redis)
- Use connection pooling
- Optimize database queries
- Add database indexes

## 🆘 Troubleshooting

### Common Issues

**Issue: CORS errors in production**
- Update `FRONTEND_URL` in environment variables
- Check CORS middleware configuration

**Issue: MongoDB connection timeout**
- Whitelist IP in MongoDB Atlas
- Check connection string format
- Verify network access

**Issue: API key errors**
- Verify environment variables are set
- Check API key is valid
- Ensure no extra spaces in `.env`

## ✅ Post-Deployment Checklist

- [ ] All services running
- [ ] Environment variables configured
- [ ] Database connected
- [ ] HTTPS enabled
- [ ] CORS working
- [ ] File uploads working
- [ ] AI chat streaming working
- [ ] Health checks responding
- [ ] Monitoring setup
- [ ] Backups configured
- [ ] Error tracking enabled

## 📞 Support

For deployment issues:
1. Check service logs
2. Verify environment variables
3. Test health endpoints
4. Review error messages

---

**Good luck with your deployment! 🚀**
