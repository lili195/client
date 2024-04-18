from flask import Flask, jsonify, request
import requests
import datetime
import random

app = Flask(__name__)

@app.route('/')
def hello_client():
    return 'Hello CLIENT!'

# Endpoint para obtener la hora del servidor
@app.route('/obtenerHora')
def obtener_hora():
    hora_actual_servidor = datetime.datetime.now()
    desfase_aleatorio_segundos = random.randint(0, 5 * 60)
    hora_servidor_con_desfase = hora_actual_servidor + datetime.timedelta(seconds=desfase_aleatorio_segundos)
    hora_servidor_con_desfase_str = hora_servidor_con_desfase.strftime('%Y-%m-%d %H:%M:%S')
    return jsonify({'horaServidor': hora_servidor_con_desfase_str})

# Método para ajustar la hora del servidor
def ajustar_hora_servidor(diferencia_tiempo):
    hora_actual_servidor = datetime.datetime.now()
    hora_ajustada_servidor = hora_actual_servidor + datetime.timedelta(seconds=diferencia_tiempo)
    print('Hora actual del servidor:', hora_actual_servidor)
    print('Diferencia de tiempo recibida:', diferencia_tiempo)
    print('Hora ajustada del servidor:', hora_ajustada_servidor)

# Endpoint para ajustar la hora del servidor
@app.route('/ajustarHora', methods=['POST'])
def ajustar_hora():
    diferencia_tiempo = request.json.get('diferenciaTiempo')
    ajustar_hora_servidor(diferencia_tiempo)
    return 'Hora ajustada correctamente'



if __name__ == '__main__':
    app.run(port=16000)
