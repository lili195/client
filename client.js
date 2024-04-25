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


let hora_coordinador = 0;
let horaCliente = null;


function printLog(message) {
    const date = new Date().toLocaleDateString();
    const time = new Date().toLocaleTimeString();
    const logMessage = `[Fecha: ${date}] [Hora: ${time}] [Mensaje: ${message}]`;
    console.log(logMessage);
    io.emit('logs', { logs: logMessage });
}


const formatearHora = (hora) => {
    const fecha = new Date(hora);
    const horaFormateada = `${fecha.getHours()}:${fecha.getMinutes()}:${fecha.getSeconds()}:${fecha.getMilliseconds()}`;
    return horaFormateada;
};

app.get('/horaCliente', (req, res) => {
    horaCliente = new Date();
    horaCliente = obtenerHora();
    const horaClienteStr = formatearHora(horaCliente);
    res.json({ horaCliente: horaClienteStr });
});





app.post('/horaCoordinador', (req, res) => {
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
    horaCliente = new Date();
    const desfase_aleatorio = Math.floor(Math.random() * 300000); // Rango de 0 a 5 minutos
    horaCliente.setMilliseconds(horaCliente.getMilliseconds() + desfase_aleatorio);
    return horaCliente;
}

app.post('/diferenciaHora', (req, res) => {
    try {

        const horaCoordinador = new Date(hora_coordinador);
        
        horaCliente = new Date();
        horaCliente = obtenerHora();

        //const horaCliente = obtenerHora();
        printLog('Hora del cliente  --> ' + formatearHora(horaCliente));


        const diferenciaHora = (horaCliente.getTime() - horaCoordinador.getTime())/(1000*60);

        printLog(`CALCULANDO DIFERENCIA --> Hora del cliente: ${formatearHora(horaCliente.getTime())} - Hora del coordinador: ${formatearHora(horaCoordinador.getTime())}`);

        res.send(String(diferenciaHora));

        printLog(`Diferencia de hora enviada al coordinador: ${diferenciaHora} minutos `);
    } catch (error) {
        console.error('Error al calcular y enviar la diferencia de hora:', error);
        res.status(500).json({ error: 'Error al calcular y enviar la diferencia de hora' });
    }
});

app.post('/ajustarHora', (req, res) => {

    try {
        printLog('--------------------------------------------------------')
        const tiempoAjuste = req.body.ajuste
        printLog(`Tiempo a ajustar: ${tiempoAjuste}`)
        ajustarCliente(tiempoAjuste)

        res.status(200).send(`DIFERENCIA RECIBIDA Y ACTUALIZADA POR PARTE DEL CLIENTE --> ${horaActualizada}`)
    } catch (error) {
        console.error('Error al actualizar la hora', error);
        res.status(500).json({ error: 'Error al actualizar la hora' });
    }
})


let horaActualizada = 0;
const ajustarCliente = async (tiempoAjuste) => {
    let adjustedTimeClient = new Date(horaCliente); // Crear una nueva instancia de Date para evitar modificar la hora original

    // Obtener los componentes de tiempo actuales
    const horas = adjustedTimeClient.getHours();
    const minutos = adjustedTimeClient.getMinutes();
    const segundos = adjustedTimeClient.getSeconds();
    const milisegundos = adjustedTimeClient.getMilliseconds();

    // Calcular la cantidad total de minutos a agregar
    const minutosAgregar = Math.floor(tiempoAjuste);
    const segundosAgregar = Math.floor((tiempoAjuste - minutosAgregar) * 60); // Convertir el exceso de minutos en segundos
    const milisegundosAgregar = Math.floor((tiempoAjuste - minutosAgregar - segundosAgregar / 60) * 60000); // Convertir el exceso de segundos en milisegundos

    // Sumar los minutos, segundos y milisegundos
    let minutosActualizados = minutos + minutosAgregar;
    let segundosActualizados = segundos + segundosAgregar;
    let milisegundosActualizados = milisegundos + milisegundosAgregar;

    // Ajustar los segundos si hay exceso de milisegundos
    if (milisegundosActualizados >= 1000) {
        segundosActualizados += Math.floor(milisegundosActualizados / 1000);
        milisegundosActualizados %= 1000;
    }

    // Ajustar los minutos si hay exceso de segundos
    if (segundosActualizados >= 60) {
        minutosActualizados += Math.floor(segundosActualizados / 60);
        segundosActualizados %= 60;
    }

    // Ajustar las horas si hay exceso de minutos
    if (minutosActualizados >= 60) {
        horas += Math.floor(minutosActualizados / 60);
        minutosActualizados %= 60;
    }

    // Establecer los nuevos valores de hora
    adjustedTimeClient.setHours(horas);
    adjustedTimeClient.setMinutes(minutosActualizados);
    adjustedTimeClient.setSeconds(segundosActualizados);
    adjustedTimeClient.setMilliseconds(milisegundosActualizados);

    horaActualizada = adjustedTimeClient;
    printLog(`Hora del cliente actualizada: ${formatearHora(horaActualizada)}`);
    io.emit('ajusteHora', { nuevaHora: formatearHora(horaActualizada) });
}



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

app.get('/infoServidor', (req, res) => {
    res.json(serverUrl);
});

const serverUrl = `http://localhost:${port_server}`;



server.listen(port_server, () => {
    console.log(`Cliente ejecutando desde el puerto: ${port_server} `);
    console.log(`Accede al servidor desde tu navegador utilizando la siguiente URL: ${serverUrl}`);
});