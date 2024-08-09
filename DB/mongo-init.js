// Switch to the admin database
db = db.getSiblingDB('admin');

// Authentication script
db.auth('root', '4QXdM4SMLUKfuvB');

db = db.getSiblingDB('plantpulse'); // switch to plantpulse database

db.createUser({
  user: 'dbuser',
  pwd: 'i2kjrLCFEkf7o',
  roles: [
    {
      role: 'readWrite',
      db: 'plantpulse'
    }
  ]
});

db.createCollection('sampleCollection');
