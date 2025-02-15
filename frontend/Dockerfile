# שלב 1: בניית הפרויקט
FROM node:18 AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .
RUN npm run build

# שלב 2: שרת Nginx לאחסון ה-Frontend
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html

# ✅ הוספת קובץ ההגדרות של Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
