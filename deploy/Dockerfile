FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

RUN npm install
RUN npm --prefix backend install
RUN npm --prefix frontend install

# Copy source
COPY . .

# Build backend TypeScript
RUN npm run build:backend

EXPOSE 3000 3001

CMD ["npm", "run", "dev"]
