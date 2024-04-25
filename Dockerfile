FROM node

WORKDIR /app

COPY package.json package.json
COPY package-lock.json package-lock.json
COPY . .

# Instala las dependencias
RUN npm install


EXPOSE $PORT

# Comando para ejecutar la aplicación
CMD ["node", "client.js"]