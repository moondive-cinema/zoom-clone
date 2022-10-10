import http from "http";
import SocketIO from "socket.io";
/* import WebSocket from "ws"; */
import express from "express";

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (req, res) => res.render("home"));
app.get("/*", (req, res) => res.redirect("/"));


const httpServer = http.createServer(app);
const ioServer = SocketIO(httpServer);

ioServer.on("connection", (socket) => {
    socket.on("enterRoom", (roomName, nickName, done) => {
        socket.join(roomName);
        socket["nickname"] = nickName;
        done(); 
        socket.to(roomName).emit("welcome", socket.nickname);
    });
    socket.on("newMessage", (message, room, done) => {
        socket.to(room).emit("newMessage", `${socket.nickname}: ${message}`);
        done();
    });
    socket.on("disconnecting", () => {
        socket.rooms.forEach((room) => socket.to(room).emit("bye", socket.nickname));
    });
});
/*
const wsServer = new WebSocket.Server({ server: httpServer })

const sockets = [];

wsServer.on("connection", (socket) => {
    sockets.push(socket);
    socket["nickname"] = "Anonymous";
    console.log("Connected to Browser ✅");
    socket.on("close", () => console.log("Disconnected from the Browser ❌"));
    socket.on("message", (msg) => {
        const message = JSON.parse(msg);
        switch (message.type) {
            case "newMessage":
                sockets.forEach((aSocket) => 
                    aSocket.send(`${socket.nickname}: ${message.payload}`)
                );
            case "nickname":
                socket["nickname"] = message.payload;
        }
    });
});
*/

const handleListen = () => console.log("Listening on http://localhost:3000");
httpServer.listen(3000, handleListen);