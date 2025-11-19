
# FROM node:20-alpine AS build

# WORKDIR /app

# COPY package*.json ./
# RUN npm install

# COPY . .

# RUN npm run build

# FROM nginx:alpine
# COPY --from=build /app/build /usr/share/nginx/html

# EXPOSE 80

# CMD ["nginx", "-g", "daemon off;"]

FROM node:18

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps --force

COPY . .

EXPOSE 3000
CMD ["npm", "start"]

