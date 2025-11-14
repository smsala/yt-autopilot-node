FROM node:20-alpine

# Install FFmpeg and dependencies
RUN apk add --no-cache ffmpeg bash

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm install --only=production

# Copy all files
COPY . .

# Expose the port required by Cloud Run
EXPOSE 8080

# Start the server
CMD ["npm", "start"]
