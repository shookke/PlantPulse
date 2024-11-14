const mongoose = require('mongoose');
const ExifReader = require('exifreader');
const s3 = require('../config/s3Client');
const minioClient = require('../config/minioClient');

// Define Reading model
const readingSchema = new mongoose.Schema({
  imageFilename: String,
  rgbImage: String,
  ndviImage: String,
  temperature: Number,
  humidity: Number,
  lux: Number,
  uvA: Number,
  uvB: Number,
  uvC: Number,
  soilMoisture: Number,
  device: { type: mongoose.Schema.Types.ObjectId, ref: 'Device', required: true },
  plant: { type: mongoose.Schema.Types.ObjectId, ref: 'Plant', required: true }
}, { timestamps: true });



// Helper method to generate signed URL
const getSignedUrlForFile = async (filename) => {
  if (!filename) {
    console.error('Filename is missing');
    return null; // If no filename is provided, return null
  }

  try {
    const signedUrl = await minioClient.presignedUrl('GET', 'plants', filename, 604800);
    return signedUrl;
  } catch (error) {
    console.error(`Error generating signed URL for ${filename}:`, error);
    throw new Error('Could not generate signed URL.');
  }
};

// Pre-populate signed URLs for both rgbImage and ndviImage
readingSchema.methods.populateSignedUrls = async function () {
  if (this.imageFilename) {
    try {
      // Generate signed URL for rgbImage using imageFilename
      this.rgbImage = await getSignedUrlForFile(this.imageFilename);
    } catch (error) {
      console.log(error);
    }
    try {
      // Generate signed URL for ndviImage by prepending 'ndvi_' to the imageFilename
      const ndviFilename = `ndvi_${this.imageFilename}`;
      this.ndviImage = await getSignedUrlForFile(ndviFilename);
    } catch (error) {
      console.log(error);
    }
  }
};

// Method to get lux data from image
readingSchema.methods.setLux = async (doc, filename) => {
  if (!filename) {
    console.error('Filename is missing');
    return null; 
  }

  try {
    const params = {
      Bucket: 'plants',  // Your S3 bucket name
      Key: filename      // The file name in the S3 bucket
    };
    // Fetch the object from S3
    const s3Object = await s3.getObject(params).promise();

    // Extract EXIF data using ExifReader
    const exifData = ExifReader.load(s3Object.Body);

    // Access the UserComment tag
    const userCommentTag = exifData.UserComment;

    let userComment = '';
    if (userCommentTag && userCommentTag.value) {
      if (Array.isArray(userCommentTag.value)) {
        // If value contains character codes
        userComment = userCommentTag.value.map(code => String.fromCharCode(code)).join('');
      } else {
        // If value is already a string
        userComment = userCommentTag.value;
      }
    } else {
      console.log('UserComment tag not found.');
    }

    // Extract Lux value from UserComment if present
    let lux = null;
    if (userComment) {
      const luxMatch = userComment.match(/Lux:\s*(\d+(\.\d+)?)/);
      if (luxMatch) {
        lux = parseFloat(luxMatch[1]);
        console.log(`Extracted Lux Value: ${lux}`);
        doc.lux = lux;
      } else {
        console.log('Lux value not found in UserComment.');
        throw new Error('Lux data not set');
      }
    }
  } catch (error) {
    console.log(error);
    doc.lux = 0.0;
  }
};

// Middleware to automatically populate signed URLs after the document is retrieved
readingSchema.post('find', async function (docs) {
  // Use a Map to track the latest reading for each plant
  const latestReadings = new Map();

  // Find the latest reading for each plant
  docs.forEach((doc) => {
    const plantId = doc.plant.toString(); // Get the plant ID as a string
    if (!latestReadings.has(plantId) || doc.createdAt > latestReadings.get(plantId).createdAt) {
      latestReadings.set(plantId, doc); // Store the latest reading for each plant
    }
  });

  // Populate signed URLs for the latest reading of each plant
  await Promise.all(
    Array.from(latestReadings.values()).map(async (latestDoc) => {
      if (latestDoc.populateSignedUrls) {
        await latestDoc.populateSignedUrls();
      }
    })
  );
});

// Middleware to get and set lux value from associated image
readingSchema.pre('save', async function (next) {
  try {
    if (this.isNew && this.imageFilename && !this.lux) {
      await this.setLux(this, this.imageFilename); // Set lux value based on image filename
    }
    console.log(`Lux value after setLux: ${this.lux}`);
    next(); // Proceed to save
  } catch (error) {
    next(error); // Pass error to save process if any
  }
});

const Reading = mongoose.model('Reading', readingSchema);

module.exports = Reading;