from flask import Flask, jsonify, request, render_template
from flask_socketio import SocketIO
from dotenv import load_dotenv
import requests
import datetime
import random
import time
import os

app = Flask(__name__)
socketio = SocketIO(app)
load_dotenv()
PORT = os.getenv('PORT')

print("Cliente corriendo en el puerto: %s" % PORT)


hora_coordinador = None  

def print_log(*args):
    date = datetime.datetime.now().strftime('%Y-%m-%d')
    time = datetime.datetime.now().strftime('%H:%M:%S')
    message = ' '.join(map(str, args))
    logMessage = f"[Fecha: {date}] [Hora: {time}] [Mensaje: {message}]"
    print(logMessage)
    socketio.emit('logs', logMessage)
    

@app.route('/horaCliente', methods=['GET'])
def hora_cliente():
    horaCliente = datetime.datetime.now()
    desfase_aleatorio_segundos = random.randint(0, 5 * 60)
    hora_servidor_con_desfase = horaCliente + datetime.timedelta(seconds=desfase_aleatorio_segundos)
    hora_servidor_con_desfase_str = hora_servidor_con_desfase.strftime('%H:%M:%S:%f')
    return jsonify({'horaCliente': hora_servidor_con_desfase_str})



@app.route('/horaCoordinador', methods=['POST'])
def recibir_hora_coordinador():
    global hora_coordinador
    try:
        data = request.json
        hora_coordinador_str = data.get('horaCliente')
        hora_coordinador = datetime.datetime.strptime(hora_coordinador_str, '%H:%M:%S:%f')
        print_log('Hora del coordinador recibida correctamente --> ', hora_coordinador.time())
        return '', 200
    except Exception as e:
        print('Error al procesar la solicitud:', e)
        return {'error': 'Error al procesar la solicitud'}, 500
        

def obtener_hora():
    horaCliente = datetime.datetime.now()
    desfase_aleatorio_segundos = random.randint(0, 5 * 60)
    hora_servidor_con_desfase = horaCliente + datetime.timedelta(seconds=desfase_aleatorio_segundos)
    hora_servidor_con_desfase_str = hora_servidor_con_desfase.strftime('%H:%M:%S:%f')
    return hora_servidor_con_desfase_str



@app.route('/diferenciaHora', methods=['POST'])
def calcular_y_enviar_diferencia():
    global hora_coordinador
    try:
        hora_cliente = obtener_hora()
        hora_cliente_dt = datetime.datetime.strptime(hora_cliente, '%H:%M:%S:%f')
        print_log('Hora del cliente --> ', hora_cliente_dt.time())


        diferencia = hora_cliente_dt - hora_coordinador
        diferencia_segundos = int(diferencia.total_seconds())

        url = 'http://localhost:3000/diferenciaHora' 
        requests.post(url, json={'diferencia': diferencia_segundos})

        log_message = f'Hora del cliente --> {hora_cliente_dt.time()}\n'
        socketio.emit('logs', {'logs': log_message})

        print_log('Diferencia de hora enviada al coordinador --> ', diferencia)
        return jsonify({'diferencia': diferencia_segundos}), 200
        
    except Exception as e:
        log_message = f'Error al calcular y enviar la diferencia de hora: {e}\n'
        socketio.emit('logs', {'logs': log_message})
        print_log('Error al calcular y enviar la diferencia de hora:', e)
        return {'error': 'Error al calcular y enviar la diferencia de hora'}, 500



# Ruta para healthcheck
@app.route('/coordinador/healthcheck')
def healthcheck():
    print("Solicitud de healthcheck entrante...")

    # Generar un tiempo aleatorio entre 1 y 5 segundos
    random_time = random.randint(1, 5)

    # Esperar el tiempo aleatorio antes de enviar la respuesta
    time.sleep(random_time)

    return jsonify(status="OK")


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=16000)
