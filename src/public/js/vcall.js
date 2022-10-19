const socket = io();

// video call implementations

const myFace = document.getElementById("myFace");
const micBtn = document.getElementById("mic");
const camBtn = document.getElementById("cam");
const camSelect = document.getElementById("cameras");
const vcall = document.getElementById("vcall");

vcall.hidden = true;

let myStream, vcRoomName, myPeerConnection, myDataChannel;
let micOff = true;
let camOff = false;


async function getCameras() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras = devices.filter((device) => device.kind === "videoinput");
    const currentCam = myStream.getVideoTracks()[0];
    cameras.forEach((camera) => {
      const option = document.createElement("option");
      option.value = camera.deviceId;
      option.innerText = camera.label;
      if (currentCam.label === camera.label) {
        option.selected = true;
      }
      camSelect.appendChild(option);
    });
  } catch (error) {
    console.log(error);
  }
}


async function getMedia(deviceID) {
  const initialConstrains = {
    audio: false,
    video: { facingMode: "user" }
  };
  const cameraConstrains = {
    audio: false,
    video: { deviceId: { exact: deviceID } }
  };
  try {
    myStream = await navigator.mediaDevices.getUserMedia(
          deviceID? cameraConstrains : initialConstrains
    );
    myFace.srcObject = myStream ;
    if (!deviceID) {
      await getCameras();
    }
  } catch (error) {
    console.log(error); 
  }
}

function handleMicClick() {
  myStream
    .getAudioTracks()
    .forEach((track) => (track.enabled = !track.enabled));
  if (!micOff) {
    micBtn.innerText = "Mic On";
    micOff = true;
  } else {
    micBtn.innerText = "Mic Off";
    micOff = false;
  }
}

function handleCamClick() {
  myStream
    .getVideoTracks()
    .forEach((track) => (track.enabled = !track.enabled));
  if (!camOff) {
    camBtn.innerText = "Cam On";
    camOff = true;
  } else {
    camBtn.innerText = "Cam Off";
    camOff = false;
  }
}

async function handleCamSelect() {
  await getMedia(camSelect.value);
  if (myPeerConnection) {
    const videoTrack = myStream.getVideoTracks()[0];
    const videoSender = myPeerConnection
      .getSenders()
      .find((sender) => sender.track.kind === "video");
    videoSender.replaceTrack(videoTrack);
  }
}

micBtn.addEventListener("click", handleMicClick);
camBtn.addEventListener("click", handleCamClick);
camSelect.addEventListener("input", handleCamSelect);



// Enter Form

const welcome = document.getElementById("welcome");
const welcomeForm = welcome.querySelector("form");

async function initCall() {
  welcome.hidden = true;
  vcall.hidden = false;
  await getMedia();
  makeConnection();
}

async function handleStartVideoCall(event) {
    event.preventDefault();
    const input = welcome.querySelector("input");
    await initCall();
    socket.emit("joinVcall", input.value);
    vcRoomName = input.value;
    input.value = "";
}

welcomeForm.addEventListener("submit", handleStartVideoCall);


// Socket code

socket.on("welcomeVcall", async () => {
  myDataChannel = myPeerConnection.createDataChannel("chat");
  myDataChannel.addEventListener("message", (event) => console.log(event.data));
  console.log("made data cannel");
  const offer = await myPeerConnection.createOffer();
  myPeerConnection.setLocalDescription(offer);
  socket.emit("offer", offer, vcRoomName);
  console.log("sent the offer")
});

socket.on("offer", async (offer) => {
  myPeerConnection.addEventListener("datachannel", (event) => {
    myDataChannel = event.channel;
    myDataChannel.addEventListener("message", (event) => console.log(event.data));
  });
  console.log("received the offer");
  myPeerConnection.setRemoteDescription(offer);
  const answer = await myPeerConnection.createAnswer();
  myPeerConnection.setLocalDescription(answer);
  socket.emit("answer", answer, vcRoomName);
  console.log("sent the answer");
});

socket.on("answer", (answer) => {
  console.log("received the answer");
  myPeerConnection.setRemoteDescription(answer);
});

socket.on("ice", (ice) => {
  console.log("received candidate");
  myPeerConnection.addIceCandidate(ice);
});

// RTC code

function makeConnection() {
  myPeerConnection = new RTCPeerConnection({
    iceServers: [
      {
        urls: [
          "stun:stun.l.google.com:19302",
          "stun:stun1.l.google.com:19302",
          "stun:stun2.l.google.com:19302",
          "stun:stun3.l.google.com:19302",
          "stun:stun4.l.google.com:19302",
        ],
      },
    ],
  });
  myPeerConnection.addEventListener("icecandidate", handleIce);
  myPeerConnection.addEventListener("track", handleAddStream);
  myStream
    .getTracks()
    .forEach((track) => myPeerConnection.addTrack(track, myStream));
}

function handleIce(data) {
  console.log("sent candidate");
  socket.emit("ice", data.candidate, vcRoomName);
}

function handleAddStream(data) {
  const peerFace = document.getElementById("peerFace");
  peerFace.srcObject = data.streams[0];
}