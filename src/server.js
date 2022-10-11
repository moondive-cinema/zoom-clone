import http from "http";
import SocketIO from "socket.io";
/* import WebSocket from "ws"; */
import express from "express";

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (_, res) => res.render("home"));
app.get("/vcall", (_, res) => res.render("vcall"));
app.get("/*", (req, res) => res.redirect("/"));


const httpServer = http.createServer(app);
const ioServer = SocketIO(httpServer);

function publicRooms() {
    const {
      sockets: {
        adapter: { sids, rooms },
      },
    } = ioServer;
    const publicRooms = [];
    rooms.forEach((_, key) => {
      if (sids.get(key) === undefined) {
        publicRooms.push(key);
      }
    });
    return publicRooms;
  }

  function countMember(roomName) {
    return ioServer.sockets.adapter.rooms.get(roomName)?.size;
  }

ioServer.on("connection", (socket) => {
    ioServer.sockets.emit("roomChange", publicRooms());
    socket.on("enterRoom", (roomName, nickName, done) => {
        socket.join(roomName);
        socket["nickname"] = nickName;
        const count = countMember(roomName);
        socket.to(roomName).emit("welcome", socket.nickname, count);
        ioServer.sockets.emit("roomChange", publicRooms());
        done(count); 
    });
    socket.on("newMessage", (message, room, done) => {
        socket.to(room).emit("newMessage", `${socket.nickname}: ${message}`);
        done();
    });
    socket.on("disconnecting", () => {
        socket.rooms.forEach((room) => socket.to(room).emit("bye", socket.nickname, countMember(room)-1));
    });
    socket.on("disconnect", () => {
        ioServer.sockets.emit("roomChange", publicRooms());
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