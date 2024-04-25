if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}
const express = require('express');
const cors = require('cors')
const axios = require('axios');
const { Server } = require('socket.io');
const http = require('http')
const app = express();

const port_server = process.env.PORT;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static('frontend'));
app.use(cors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true
}))

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    }
});


function printLog(message) {
    const date = new Date().toLocaleDateString();
    const time = new Date().toLocaleTimeString();
    const logMessage = `[Fecha: ${date}] [Hora: ${time}] [Mensaje: ${message}]`;
    console.log(logMessage);
    io.emit('logs', { logs: logMessage });
}

function sendLogsToClient(logs) {
    io.emit('logs', { logs: logs });
}

const formatearHora = (hora) => {
    const fecha = new Date(hora);
    const horaFormateada = `${fecha.getHours()}:${fecha.getMinutes()}:${fecha.getSeconds()}:${fecha.getMilliseconds()}`;
    return horaFormateada;
};

app.get('/horaCliente', (req, res) => {
    printLog('Solicitud GET de hora del cliente')
    const horaCliente = new Date();
    const desfase_aleatorio = Math.floor(Math.random() * 300000);
    horaCliente.setSeconds(horaCliente.getSeconds() + desfase_aleatorio);

    const horaClienteStr = formatearHora(horaCliente);
    res.json({ horaCliente: horaClienteStr });
});


let hora_coordinador = 0;


app.post('/horaCoordinador', (req, res) => {
    printLog('Solicitud POST recibiendo hora del coordinador')
    try {
        const hora_coordinador_str = req.body.horaCliente;

        hora_coordinador = hora_coordinador_str;

        printLog('Hora del coordinador recibida correctamente --> ' + formatearHora(hora_coordinador));
        res.status(200).send();
    } catch (error) {
        printLog('Error al procesar la solicitud: ' + error);
        res.status(500).json({ error: 'Error al procesar la solicitud' });
    }
});


function obtenerHora() {
    const horaCliente = new Date();
    const desfase_aleatorio = Math.floor(Math.random() * 300000) + 300000; // Rango de 5 a 10 minutos
    horaCliente.setMilliseconds(horaCliente.getMilliseconds() + desfase_aleatorio);
    return horaCliente;
}

app.post('/diferenciaHora', (req, res) => {
    printLog('Calculando la diferencia entre la hora propia y del coordinador');
    try {
        const horaCoordinador = new Date(hora_coordinador);
        printLog('Hora del coordinador --> ' + horaCoordinador);

        const horaCliente = obtenerHora();
        printLog('Hora del cliente --> ' + formatearHora(horaCliente));

        printLog(`CALCULANDO DIFERENCIA --> Hora del cliente: ${formatearHora(horaCliente)} - Hora del coordinador: ${formatearHora(horaCoordinador)}`);

        let diferenciaMinutos = Math.round((horaCliente - horaCoordinador) / (1000 * 60)); // Redondear la diferencia en minutos

        printLog(`Diferencia de hora enviada al coordinador: ${diferenciaMinutos} minutos`);

        res.status(200).json({ diferenciaHora: diferenciaMinutos });
    } catch (error) {
        console.error('Error al calcular y enviar la diferencia de hora:', error);
        res.status(500).json({ error: 'Error al calcular y enviar la diferencia de hora' });
    }
});





app.get('/coordinador/healthcheck', (req, res) => {
    printLog("Solicitud de healthcheck entrante...")

    // Generar un tiempo aleatorio entre 1 y 5 segundos
    const randomTime = Math.floor(Math.random() * (100 - 10 + 1)) + 10;

    // Enviar la respuesta después del tiempo aleatorio
    setTimeout(() => {
        res.sendStatus(200);
    }, randomTime);
});



io.on('connection', socket => {
    printLog('Cliente conectado: ' + socket.id);


    socket.on('disconnect', () => {
        printLog('Cliente desconectado: ' + socket.id);
    });
});


server.listen(port_server, () => {
    console.log(`Example app listening on port ${port_server}`)
})