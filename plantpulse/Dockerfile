# Use an official Node.js runtime as our base image
FROM node:14

# Set the working directory to /app
WORKDIR /app

# Copy the current directory contents into the container at /app
COPY . /app

# Install any necessary dependencies
RUN npm install

# Make port 3000 available from outside the container
EXPOSE 3000

# Run command to start the app when the container starts
CMD ["npm", "start"]