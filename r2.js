require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');

const LOCAL_UPLOADS_DIR = path.join(__dirname, 'assets', 'uploads');
if (!fs.existsSync(LOCAL_UPLOADS_DIR)) {
  fs.mkdirSync(LOCAL_UPLOADS_DIR, { recursive: true });
}

function isR2Configured() {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET_NAME
  );
}

function getR2Client() {
  if (!isR2Configured()) return null;
  return new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
    }
  });
}

function sanitizeFilename(originalFilename = 'image.jpg') {
  const ext = path.extname(originalFilename).toLowerCase() || '.jpg';
  const base = path.basename(originalFilename, ext)
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-')
    .slice(0, 30);
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 7);
  return `cda-${timestamp}-${randomStr}-${base}${ext}`;
}

async function uploadImage(buffer, originalFilename, contentType = 'image/jpeg') {
  const filename = sanitizeFilename(originalFilename);

  if (isR2Configured()) {
    try {
      const client = getR2Client();
      const bucketName = process.env.R2_BUCKET_NAME;

      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: filename,
        Body: buffer,
        ContentType: contentType,
        // Cache for 1 year on Cloudflare CDN edge
        CacheControl: 'public, max-age=31536000, immutable'
      });

      await client.send(command);

      // Construct public URL
      let publicUrl = '';
      if (process.env.R2_PUBLIC_URL) {
        const base = process.env.R2_PUBLIC_URL.replace(/\/+$/, '');
        publicUrl = `${base}/${filename}`;
      } else {
        publicUrl = `https://${bucketName}.${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${filename}`;
      }

      return {
        success: true,
        storage: 'cloudflare-r2',
        url: publicUrl,
        filename,
        size: buffer.length,
        contentType
      };
    } catch (err) {
      console.error('Error uploading to Cloudflare R2, falling back to local storage:', err);
    }
  }

  // Graceful Local Fallback if Cloudflare R2 is not configured or fails
  const localFilePath = path.join(LOCAL_UPLOADS_DIR, filename);
  fs.writeFileSync(localFilePath, buffer);
  const localUrl = `/assets/uploads/${filename}`;

  return {
    success: true,
    storage: 'local-fallback',
    url: localUrl,
    filename,
    size: buffer.length,
    contentType,
    note: 'Image saved locally. Set Cloudflare R2 credentials in .env to upload directly to R2 bucket.'
  };
}

module.exports = {
  isR2Configured,
  uploadImage,
  sanitizeFilename
};
