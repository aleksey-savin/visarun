# S3 Migration Guide

## 📋 Overview

This project has been migrated from local file storage (Docker volumes) to **Yandex Cloud S3** for better scalability, reliability, and management of file uploads.

## 🔧 Configuration

### Environment Variables

Add the following variables to your `.env` file:

```bash
# S3 Configuration
S3_ACCESS_KEY_ID=your_access_key_id
S3_SECRET_ACCESS_KEY=your_secret_access_key
S3_BUCKET_NAME=your-bucket-name
S3_REGION=ru-central1
S3_ENDPOINT=https://storage.yandexcloud.net
S3_KMS_KEY_ID=your-kms-key-id  # Optional: for KMS encryption
```

### Docker Compose Changes

The `uploads` volume has been removed from `compose.prod.yml`. Files are now stored directly in S3.

## 🚀 Deployment

### 1. Set up Yandex Cloud S3

1. **Create S3 Bucket:**
   - Name: `your-visarun-documents`
   - Encryption: KMS (recommended for sensitive data)
   - Access: Private (no public access)

2. **Create Service Account:**
   - Role: `storage.editor`
   - Generate static access keys

3. **Configure Bucket Policy:**
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Deny",
         "Principal": "*",
         "Action": ["s3:GetObject", "s3:ListBucket"],
         "Resource": [
           "arn:aws:s3:::your-bucket-name",
           "arn:aws:s3:::your-bucket-name/*"
         ]
       }
     ]
   }
   ```

### 2. Update Environment Variables

Add S3 configuration to your production environment.

### 3. Deploy Application

```bash
# Deploy with new S3 configuration
docker-compose -f compose.prod.yml up -d
```

## 📁 File Structure in S3

Files are organized in the following folders:

```
your-bucket/
├── client-documents/
│   ├── client-doc-1704067200000-abc12345.pdf
│   └── client-doc-1704067300000-def67890.jpg
├── requirement-documents/
│   ├── requirement-doc-1704067400000-ghi11111.pdf
│   └── requirement-doc-1704067500000-jkl22222.png
└── payment-documents/
    ├── payment-doc-1704067600000-mno33333.jpg
    └── payment-doc-1704067700000-pqr44444.pdf
```

## 🔄 Migration from Local Files

If you have existing files in the local `uploads` directory, use the migration script:

### Dry Run (recommended first)
```bash
cd backend
pnpm migrate:s3:dry-run
```

### Actual Migration
```bash
cd backend
pnpm migrate:s3
```

### Migration Features:
- ✅ Creates backup of database URLs before migration
- ✅ Uploads files to S3 with proper folder structure
- ✅ Updates database with new S3 URLs
- ✅ Preserves file metadata
- ✅ Error handling and rollback capability

## 🔍 What Changed

### Backend Changes:
1. **File Upload:** Multer now uses memory storage, files uploaded directly to S3
2. **File URLs:** Database now stores S3 URLs instead of local paths
3. **File Access:** No more static file serving, files accessed via S3 URLs
4. **File Deletion:** Files deleted from S3 when records are removed

### Frontend Changes:
1. **File Display:** Components now handle both S3 URLs and legacy local URLs
2. **File Download:** Direct downloads from S3 URLs
3. **Upload Component:** Enhanced to work with S3 responses

### URL Format Changes:
- **Before:** `/uploads/client-documents/file.pdf`
- **After:** `https://bucket.storage.yandexcloud.net/client-documents/client-doc-123.pdf`

## 🛡️ Security Features

1. **Encryption:** Server-side encryption with AES-256 or KMS
2. **Private Access:** No public bucket access
3. **Secure Transport:** HTTPS only
4. **Access Control:** Service account with minimal permissions

## 🔧 Troubleshooting

### Common Issues:

1. **"S3 configuration invalid" error:**
   - Check all S3 environment variables are set
   - Verify access keys are correct

2. **"Upload failed" error:**
   - Check service account permissions
   - Verify bucket name and region
   - Check network connectivity to Yandex Cloud

3. **Files not displaying:**
   - Check if URLs in database are S3 URLs
   - Verify bucket permissions allow read access

### Health Check:
```bash
curl http://localhost:3001/upload/health
```

Response:
```json
{
  "status": "ok",
  "s3Config": true,
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## 📊 Monitoring

Monitor S3 usage through Yandex Cloud Console:
- Storage usage
- Request statistics
- Error rates
- Access logs (if enabled)

## 🔄 Rollback Plan

If needed, you can rollback to local storage:

1. Restore `uploads` volume in `compose.prod.yml`
2. Restore static file serving in `backend/src/app.ts`
3. Use backup file to restore local URLs in database
4. Download files from S3 back to local storage

## 💡 Benefits

- ✅ **Scalability:** No more Docker volume size limits
- ✅ **Reliability:** Cloud storage with high availability
- ✅ **Security:** Encryption and access control
- ✅ **Performance:** Direct S3 access, no server bottleneck
- ✅ **Backup:** Built-in cloud redundancy
- ✅ **Cost:** Pay only for used storage