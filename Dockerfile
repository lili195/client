FROM python:3.12.0

WORKDIR /app

# Copia el archivo requirements.txt al contenedor
COPY requirements.txt .

# Instala las dependencias
RUN pip install -r requirements.txt

# Copia el código de la aplicación al contenedor
COPY . .

EXPOSE $PORT

CMD ["python", "client.py"]