FROM mongo:latest

# Set the working directory to /data/db
WORKDIR /data/db

# Create a new database named "mydb"
RUN mkdir plantpulse

# Expose port 27017, which is the default port for MongoDB
EXPOSE 27017

# Run command to start the container and create the database
CMD ["mongod", "--dbpath", "/data/db/plantpulse"]