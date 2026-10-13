FROM node:20-bookworm-slim
ENV NODE_ENV=production
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY app.js ./
EXPOSE 3001
CMD ["npm", "start"]
