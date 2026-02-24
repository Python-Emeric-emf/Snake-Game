# Image de base
FROM nginx:alpine

# Supprimer la configuration par défaut si nécessaire (optionnel)
# RUN rm -rf /usr/share/nginx/html/*

# Copier les fichiers du jeu dans le dossier servi par nginx
COPY index.html /usr/share/nginx/html/
COPY css /usr/share/nginx/html/css
COPY js /usr/share/nginx/html/js