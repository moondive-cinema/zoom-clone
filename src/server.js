import http from "http";
import SocketIO from "socket.io";
import express from "express";

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (_, res) => res.render("home"));
app.get("/vcall", (_, res) => res.render("vcall"));
app.get("/*", (_, res) => res.redirect("/"));


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
    socket.on("joinVcall", (vcRoomName) => {
      socket.join(vcRoomName);
      socket.to(vcRoomName).emit("welcomeVcall");
    });
    socket.on("offer", (offer, vcRoomName) => {
      socket.to(vcRoomName).emit("offer", offer);
    });
    socket.on("answer", (answer, vcRoomName) => {
      socket.to(vcRoomName).emit("answer", answer);
    });
    socket.on("ice", (ice, vcRoomName) => {
      socket.to(vcRoomName).emit("ice", ice);
    });
});

const handleListen = () => console.log("Listening on http://localhost:3000");
httpServer.listen(3000, handleListen);