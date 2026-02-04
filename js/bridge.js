const net = require("net");
const WebSocket = require("ws");

const HOST = process.argv[2] || "0.0.0.0";
const TCP_PORT = Number(process.argv[3]) || 8080;
const WS_PORT = Number(process.argv[4]) || 8081;

let unrealSockets = [];
let pendingMessages = [];

console.log("bridge.js iniciado");
console.log("TCP:", TCP_PORT, "WS:", WS_PORT);

////////////////////////////////////////////////////////////
// TCP → UNREAL
////////////////////////////////////////////////////////////
const tcpServer = net.createServer((socket) => {
    console.log("Unreal conectado");

    socket.setNoDelay(true);
    unrealSockets.push(socket);

    pendingMessages.forEach(msg => socket.write(msg + "\n"));
    pendingMessages = [];

    socket.on("data", data => {
        console.log("⬅ Unreal:", data.toString("utf8").trim());
    });

    socket.on("close", () => {
        unrealSockets = unrealSockets.filter(s => s !== socket);
        console.log(" Unreal desconectado");
    });

    socket.on("error", err => {
        unrealSockets = unrealSockets.filter(s => s !== socket);
        console.error(" TCP error:", err.message);
    });
});

tcpServer.listen(TCP_PORT, "0.0.0.0", () => {
    console.log(` TCP escuchando ${TCP_PORT}`);
});

////////////////////////////////////////////////////////////
// WS → WEB
////////////////////////////////////////////////////////////
const wss = new WebSocket.Server({ port: WS_PORT });

wss.on("connection", (ws, req) => {
    console.log(" Web conectado:", req.socket.remoteAddress);

    ws.on("message", msg => {
        const data = msg.toString("utf8").trim();
        console.log("⬅ Web:", data);

        if (unrealSockets.length === 0) {
            pendingMessages.push(data);
            return;
        }

        unrealSockets.forEach(s => s.write(data + "\n"));
    });

    ws.on("close", () => console.log(" Web desconectado"));
    ws.on("error", err => console.error(" WS error:", err.message));
});

console.log(` WebSocket escuchando ${WS_PORT}`);

