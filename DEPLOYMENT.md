# Deployment Guide

Instructions for deploying the Stellar bulk payment system to production.

## Pre-Deployment Checklist

- [ ] All tests pass: `npm test`
- [ ] Code linted: `npm run lint`
- [ ] Build succeeds: `npm run build`
- [ ] Testnet validation completed
- [ ] Security review passed
- [ ] Environment variables configured
- [ ] Monitoring and logging setup
- [ ] Backup and disaster recovery plan in place

## Environment Setup

### Required Environment Variables

```bash
# Production Stellar account
export STELLAR_SECRET_KEY="S..." # Never commit this!

# Optional: for enhanced security
export LOG_LEVEL="info"
export NODE_ENV="production"
```

### Environment Variable Management

**Do NOT commit `.env` files or secrets to version control.**

**Recommended approach:**
1. Use a secret management service (AWS Secrets Manager, HashiCorp Vault, etc.)
2. Set environment variables at deployment time
3. Use secure environment variable providers

**For Vercel deployment:**
```bash
vercel env add STELLAR_SECRET_KEY
```

## Smart Contract Deployment

Follow these steps to deploy and initialize the Soroban smart contract.

### 1. Prerequisites

Ensure you have the following installed:
- [Rust](https://www.rust-lang.org/tools/install)
- [Stellar CLI](https://developers.stellar.org/docs/build/smart-contracts/getting-started/setup#install-the-stellar-cli)
- Wasm target: `rustup target add wasm32-unknown-unknown`

### 2. Configure CLI Identity

Create an identity for deployment:
```bash
stellar keys generate --network testnet deployer
```

### 3. Build the Contract

Navigate to the contract directory and build the release Wasm:
```bash
cd contracts/batch-vesting
cargo build --target wasm32-unknown-unknown --release
```

The compiled contract will be available at:
`target/wasm32-unknown-unknown/release/batch_vesting.wasm`

### 4. Deploy to Testnet

Deploy the contract and capture the **Contract ID**:
```bash
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/batch_vesting.wasm \
  --source deployer \
  --network testnet
```

> [!NOTE]
> Save the returned `Contract ID` (starts with `C...`) as it is required for frontend integration.

### 5. Frontend Integration

Update your frontend `.env` file with the newly deployed Contract ID:
```bash
NEXT_PUBLIC_CONTRACT_ID="C..."
```

## Hosting Options

### Option 1: Vercel (Recommended for Next.js)

Vercel is optimized for Next.js applications:

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Configure environment variables
vercel env add STELLAR_SECRET_KEY

# View deployment
vercel --prod
```

**Advantages:**
- Zero-config deployment
- Automatic scaling
- Global CDN
- Preview deployments
- Easy rollback

### Option 2: Docker Container

For flexibility and multi-platform deployment:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy files
COPY package*.json ./
COPY . .

# Install dependencies
RUN npm ci --only=production

# Build
RUN npm run build

# Set environment
ENV NODE_ENV=production
ENV STELLAR_SECRET_KEY=${STELLAR_SECRET_KEY}

# Expose port
EXPOSE 3000

# Start
CMD ["npm", "start"]
```

**Build and push:**
```bash
docker build -t stellar-bulk-pay:latest .
docker tag stellar-bulk-pay:latest myregistry/stellar-bulk-pay:latest
docker push myregistry/stellar-bulk-pay:latest
```

**Deploy to container service:**
- AWS ECS
- Google Cloud Run
- Azure Container Instances

### Option 3: Traditional VPS

For complete control:

```bash
# SSH to server
ssh user@server.com

# Clone repository
git clone https://github.com/your-org/stellar-bulk-pay.git
cd stellar-bulk-pay

# Install dependencies
npm ci --only=production

# Build
npm run build

# Set environment
export STELLAR_SECRET_KEY="S..."

# Start with process manager (PM2)
npm install -g pm2
pm2 start npm --name "stellar-bulk-pay" -- start
pm2 save
pm2 startup
```

## Security Considerations

### 1. Secret Management

**Never:**
- Commit `.env` files
- Pass secrets as command-line arguments
- Log secret keys
- Store in comments or documentation

**Always:**
- Use environment variables
- Rotate keys regularly
- Use secret management service
- Audit access logs

### 2. Network Security

```nginx
# HTTPS configuration
server {
    listen 443 ssl http2;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    # Enforce HTTPS
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 3. Rate Limiting

Protect against abuse:

```typescript
// Example rate limiter middleware
import rateLimit from 'express-rate-limit';

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
});

app.use('/api/', apiLimiter);
```

### 4. Input Validation

Always validate at the edge:

```typescript
// Validate batch size
if (payments.length > 10000) {
  return NextResponse.json(
    { error: 'Batch size exceeds limit' },
    { status: 400 }
  );
}
```

### 5. Logging Security

**Safe to log:**
- Transaction hashes
- Public keys (anonymized)
- Error types (not messages)
- Timestamps

**Never log:**
- Secret keys
- Full request/response bodies
- User IP addresses (unless authorized)
- Sensitive amounts

```typescript
// Safe logging
console.log('[Payment] Transaction submitted:', {
  hash: txHash,
  recipientCount: payments.length,
  timestamp: new Date().toISOString(),
});

// Avoid
console.log('[Payment] Full config:', config); // Might contain secrets
```

## Monitoring and Observability

### Application Metrics

Track key metrics:

```typescript
// Example with StatsD
import StatsD from 'node-dogstatsd';

const dogstatsd = new StatsD();

// Track batch submissions
dogstatsd.gauge('batches.size', payments.length);
dogstatsd.timing('batches.duration', duration);
dogstatsd.increment('batches.successful');
dogstatsd.increment('batches.failed');
```

### Error Tracking

Use a service like Sentry:

```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
});

// Errors are automatically captured
```

### Log Aggregation

Send logs to centralized service:

```typescript
// Example with Winston and ELK Stack
import winston from 'winston';

const logger = winston.createLogger({
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Http({
      host: 'logs.example.com',
      path: '/api/logs',
    }),
  ],
});
```

## Database Setup (Optional)

For production batch tracking:

### PostgreSQL Setup

```sql
CREATE TABLE batches (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  submitted_at TIMESTAMP,
  network VARCHAR(20) NOT NULL,
  total_recipients INTEGER NOT NULL,
  total_amount DECIMAL(20, 7) NOT NULL,
  transaction_count INTEGER NOT NULL,
  successful_count INTEGER,
  failed_count INTEGER,
  status VARCHAR(20) NOT NULL,
  data JSONB NOT NULL
);

CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  batch_id INTEGER NOT NULL REFERENCES batches(id),
  recipient VARCHAR(56) NOT NULL,
  amount DECIMAL(20, 7) NOT NULL,
  asset VARCHAR(255) NOT NULL,
  transaction_hash VARCHAR(64),
  status VARCHAR(20) NOT NULL,
  error_message TEXT
);

CREATE INDEX idx_batches_created_at ON batches(created_at);
CREATE INDEX idx_batches_network ON batches(network);
CREATE INDEX idx_payments_batch_id ON payments(batch_id);
```

## Performance Optimization

### Caching

Cache validator results:

```typescript
const validationCache = new Map<string, ValidationResult>();

function validateCached(payment: PaymentInstruction) {
  const key = JSON.stringify(payment);
  if (validationCache.has(key)) {
    return validationCache.get(key);
  }
  const result = validatePaymentInstruction(payment);
  validationCache.set(key, result);
  return result;
}
```

### Connection Pooling

For database connections:

```typescript
import { Pool } from 'pg';

const pool = new Pool({
  max: 20,
  min: 4,
  idleTimeoutMillis: 30000,
});
```

### Batch Optimization

Tune batch size based on network conditions:

```typescript
// Adaptive batch sizing
const getBatchSize = (network: 'testnet' | 'mainnet') => {
  if (network === 'testnet') return 100;
  // Mainnet might have higher fees, use smaller batches
  return 50;
};
```

## Rollback Plan

### Version Control

```bash
# Tag releases
git tag -a v1.0.0 -m "Production release"
git push origin v1.0.0

# Easy rollback if needed
git checkout v0.9.0
npm run build
npm start
```

### Blue-Green Deployment

Maintain two versions:

```bash
# Deploy new version to "green" environment
npm run deploy:green

# Test thoroughly
npm run test:e2e

# Switch traffic
npm run switch:traffic
```

## Testnet to Mainnet Migration

### 1. Validate on Testnet

```bash
# Test with testnet funds
STELLAR_SECRET_KEY="S..." npm run dev
# Submit test batches
# Verify transaction hashes on stellar.expert
```

### 2. Prepare Mainnet Account

```bash
# Create mainnet account
# Fund with adequate XLM
# Test basic operations

# Verify account
curl https://horizon.stellar.org/accounts/YOUR_PUBLIC_KEY
```

### 3. Gradual Migration

```bash
# Start with small batches
# Monitor for issues
# Gradually increase batch sizes
# Monitor transaction costs and success rates
```

### 4. Monitor Closely

```bash
# Check account balance
curl https://horizon.stellar.org/accounts/YOUR_PUBLIC_KEY/balances

# Review transaction history
curl "https://horizon.stellar.org/accounts/YOUR_PUBLIC_KEY/transactions"

# Monitor for errors
grep "ERROR" application.log
```

## Maintenance

### Regular Tasks

- **Daily**: Review error logs and transaction status
- **Weekly**: Monitor account balance and transaction costs
- **Monthly**: Review and archive logs, update dependencies
- **Quarterly**: Security audit, performance review

### Backup Strategy

```bash
# Backup application logs
tar -czf logs-backup-$(date +%Y%m%d).tar.gz /var/log/stellar-bulk-pay/

# Backup database
pg_dump stellar_bulk_pay > backup-$(date +%Y%m%d).sql

# Store offsite
aws s3 cp logs-backup-*.tar.gz s3://backups/
```

### Updates

```bash
# Check for updates
npm outdated

# Update dependencies
npm update

# Test thoroughly
npm test
npm run build

# Deploy updated version
git commit -am "Update dependencies"
git push origin main
```

## Disaster Recovery

### Account Recovery

If secret key is compromised:

1. Create new Stellar account
2. Transfer remaining funds
3. Update environment variables
4. Reissue all ongoing operations
5. Review transaction history

### Data Recovery

```bash
# Restore from backup
psql stellar_bulk_pay < backup-20240101.sql

# Verify integrity
SELECT COUNT(*) FROM batches;
```

### Incident Response

```bash
# 1. Identify issue
grep ERROR /var/log/stellar-bulk-pay/error.log

# 2. Stop processing
pm2 stop stellar-bulk-pay

# 3. Investigate
# Review logs, check Stellar network status

# 4. Fix and redeploy
git checkout main && npm run build && pm2 start stellar-bulk-pay

# 5. Verify
curl http://localhost:3000/health
```

## Support

For deployment issues:
- Check application logs
- Review Stellar network status
- Consult DEVELOPMENT.md for debugging
- Open GitHub issue with logs (no secrets)
