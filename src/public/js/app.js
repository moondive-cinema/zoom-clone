const socket = io();


const enterForm = document.getElementById("enter");
const msgForm = document.getElementById("msg");
const room = document.getElementById("chatRoom");


room.hidden = true;
let roomName, nickName;


function roomInfoRender(newCount) {
  const h3 = room.querySelector("h3");
  h3.innerText = `Room ${roomName} (${newCount})`;
}

function showRoom(newCount) {
  welcome.hidden = true;
  room.hidden = false;
  roomInfoRender(newCount);
}

function handleEnterRoom(event) {
    event.preventDefault();
    const inputRoom = enterForm.querySelector("#room");
    const inputNick = enterForm.querySelector("#nick");
    roomName = inputRoom.value;
    nickName = inputNick.value;
    socket.emit("enterRoom", roomName, nickName, showRoom);
}


function addMessage(message) {
  const chat = room.querySelector("ul");
  const chatLine = document.createElement("li");
  chatLine.innerText = message;
  chat.appendChild(chatLine);
}

function handleMessageSubmit(event) {
  event.preventDefault();
  const inputMessage = msgForm.querySelector("input");
  message = inputMessage.value
  socket.emit("newMessage", message, roomName, () => {
    addMessage(`You: ${message}`);
  });
  inputMessage.value = "";
}

enterForm.addEventListener("submit", handleEnterRoom);
msgForm.addEventListener("submit", handleMessageSubmit);

socket.on("newMessage", addMessage);

socket.on("welcome", (user, newCount) => {
  roomInfoRender(newCount);
  addMessage(`${user} entered into the room.`);
});

socket.on("bye", (user, newCount) => {
  roomInfoRender(newCount);
  addMessage(`${user} left the room.`);
});

socket.on ("roomChange", (rooms) => {
  const roomList = document.getElementById("openRooms");
  roomList.innerHTML = "";
  if (rooms.length === 0) {
    roomList.innerHTML = "";
    return;
  }
  rooms.forEach((room) => {
    const li = document.createElement("li");
    li.innerText = room;
    roomList.appendChild(li);
  })
})
/*
const messageList = document.querySelector("ul");
const messageForm = document.querySelector("#message");
const nickForm = document.querySelector("#nickname");

const socket = new WebSocket(`ws://${window.location.host}`);

function makeMessage(type, payload) {
    const msg = { type, payload };
    return JSON.stringify(msg);
  }

socket.addEventListener("open", () => {
    console.log("Connected to Server ✅");
  });
  
  socket.addEventListener("message", (message) => {
    const li = document.createElement("li");
    li.innerText = message.data;
    messageList.append(li);
  });
  
  socket.addEventListener("close", () => {
    console.log("Disconnected from Server ❌");
  });


function handleMsgSubmit(event) {
    event.preventDefault();
    const input = messageForm.querySelector("input");
    socket.send(makeMessage("newMessage", input.value));
    input.value = "";
}

function handleNickSubmit(event) {
    event.preventDefault();
    const input = nickForm.querySelector("input");
    socket.send(makeMessage("nickname", input.value));
    input.value = "";
}

  messageForm.addEventListener("submit", handleMsgSubmit);
  nickForm.addEventListener("submit", handleNickSubmit);
  */