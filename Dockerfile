## Étape 1 : Construire l'application Angular
#FROM node:22-alpine AS build
#
#WORKDIR /app
#
#COPY package*.json ./
#COPY package-lock.json ./
#
#RUN npm install
#
#COPY . .
#
#RUN npm run build
#
## Étape 2 : Servir l'application avec Nginx
#FROM nginx:alpine
#
## Copier les fichiers de l'application construite. Il est crucial de copier *dans* /usr/share/nginx/html, et non de créer un sous-répertoire.
#COPY --from=build /app/dist/odc-activity/browser/* /usr/share/nginx/html/
#
#EXPOSE 80
#
#CMD ["nginx", "-g", "daemon off;"]

# Étape 1 : Construire l'application Angular
FROM node:22-alpine AS build

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm install --legacy-peer-deps

# Copier le reste de l'application
COPY .. .

# Compiler l'application Angular
RUN npm run build

# Étape 2 : Servir l'application avec Nginx
FROM nginx:alpine
# Copier la build Angular vers Nginx
COPY --from=build /app/dist/odc-web/browser /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
