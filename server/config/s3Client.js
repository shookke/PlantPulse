// s3Client.js
const AWS = require('aws-sdk');

// Initialize AWS S3 client for MinIO
const s3 = new AWS.S3({
  endpoint: 'http://minio:9000', // MinIO server endpoint
  accessKeyId: 'ueuDvLGHm0MYLk3HBykA', // MinIO access key
  secretAccessKey: 'TRIciRIuBQishEoPCgjeMOADzpk6fwmCclmulZ0e', // MinIO secret key
  s3ForcePathStyle: true, // Required for MinIO to use path-style URLs
  signatureVersion: 'v4'   // Signature version for signing requests
});

module.exports = s3;
