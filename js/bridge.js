// bridge.js
const net = require("net");
const WebSocket = require("ws");

// ================= PARÁMETROS =================
// node bridge.js <IP> <TCP_PORT> <WS_PORT>
const HOST = process.argv[2] || "0.0.0.0";
const TCP_PORT = Number(process.argv[3]) || 8080;
const WS_PORT = Number(process.argv[4]) || 8081;

// ================= ESTADO =================
let unrealSockets = []; // lista de todos los Unreal conectados
let pendingMessages = []; // mensajes que llegan antes de que Unreal esté conectado

// ================= LOG INICIAL =================
console.log(" Iniciando bridge.js");
console.log(" HOST (logs)  :", HOST);
console.log(" TCP Port     :", TCP_PORT);
console.log(" WS Port      :", WS_PORT);

// ================= TCP → UNREAL =================
const tcpServer = net.createServer((socket) => {
    console.log("🟦 Unreal conectado desde:", socket.remoteAddress);
    unrealSockets.push(socket);

    // Enviar mensajes pendientes
    pendingMessages.forEach(msg => socket.write(msg + "\n"));
    pendingMessages = [];

    socket.on("data", (data) => {
        const chunk = data.toString("utf8").trim();
        console.log("⬅ Desde Unreal:", chunk);
        // Aquí podrías procesar datos de Unreal si quieres
    });

    socket.on("close", () => {
        console.log(" Unreal desconectado");
        unrealSockets = unrealSockets.filter(s => s !== socket);
    });

    socket.on("error", (err) => {
        console.error("❌ Error TCP Unreal:", err);
        unrealSockets = unrealSockets.filter(s => s !== socket);
    });
});

// Bind en 0.0.0.0 para aceptar conexiones LAN y localhost
tcpServer.listen(TCP_PORT, "0.0.0.0", () => {
    console.log(` TCP escuchando en 0.0.0.0:${TCP_PORT}`);
});

// ================= WEBSOCKET → WEB =================
const wss = new WebSocket.Server({ port: WS_PORT });

wss.on("connection", (ws, req) => {
    console.log(" Web conectado desde:", req.socket.remoteAddress);

    ws.on("message", (msg) => {
        const data = msg.toString("utf8").trim();
        console.log("⬅ Desde Web:", data);

        // Guardar en pending si no hay Unreal conectado
        if (unrealSockets.length === 0) {
            console.log(" Ningún Unreal conectado, mensaje en cola");
            pendingMessages.push(data);
            return;
        }

        // Broadcast a todos los Unreal conectados
        unrealSockets.forEach(socket => {
            const ok = socket.write(data + "\n");
            if (!ok) pendingMessages.push(data);
        });

        console.log("➡ Broadcast a Unreal:", data);
    });

    ws.on("close", () => console.log(" Web desconectado"));
    ws.on("error", (err) => console.error("❌ Error WebSocket:", err));
});

wss.on("listening", () => {
    console.log(` WebSocket escuchando en 0.0.0.0:${WS_PORT}`);
});

// ================= CIERRE LIMPIO =================
function shutdown(signal) {
    console.log(`\n Cerrando bridge.js (${signal})`);

    unrealSockets.forEach(socket => socket.destroy());
    unrealSockets = [];

    tcpServer.close(() => console.log(" TCP cerrado"));
    wss.close(() => console.log(" WebSocket cerrado"));

    setTimeout(() => {
        console.log(" Proceso finalizado");
        process.exit(0);
    }, 300);
}

process.on("SIGINT", shutdown);   // Ctrl+C
process.on("SIGTERM", shutdown);  // Kill externo
process.on("exit", () => console.log("🧹 Limpieza final"));

