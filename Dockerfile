# Dockerfile
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all application files
COPY . .

# # Expose port
EXPOSE 5173

# Start the application directly
CMD ["npm", "run", "dev"]