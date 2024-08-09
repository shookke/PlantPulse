require('dotenv').config()
const mongoose = require('mongoose');

const db = {
  uri: process.env.MONGODB_URI,
};

console.log(db.uri);

mongoose.connect(db.uri, {
  auth: {
    username: process.env.MONGO_USER,
    password: process.env.MONGO_PW,
  }
});

module.exports = db;

