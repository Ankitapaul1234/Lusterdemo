FROM nginx:alpine

WORKDIR /usr/share/nginx/html

COPY *.html ./
COPY css/ ./css/
COPY js/ ./js/
COPY assets/ ./assets/
COPY nail-designs.json ./

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]