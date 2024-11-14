const Minio = require('minio');

const minioClient = new Minio.Client({
    endPoint: 'cdn.plantpulse.app',
    port: 443,
    useSSL: true,
    accessKey: 'ueuDvLGHm0MYLk3HBykA',
    secretKey: 'TRIciRIuBQishEoPCgjeMOADzpk6fwmCclmulZ0e',
  });

  module.exports = minioClient;