FROM node:20-bookworm-slim
ENV NODE_ENV=production
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY app.js ./
EXPOSE 3002
CMD ["npm", "start"]
