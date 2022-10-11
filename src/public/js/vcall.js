const socket = io();

// video call implementations

const myFace = document.getElementById("myFace");
const micBtn = document.getElementById("mic");
const camBtn = document.getElementById("cam");
const camSelect = document.getElementById("cameras");

let myStream;
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

getMedia();

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

function handleCamSelect() {
  getMedia(camSelect.value);
}

micBtn.addEventListener("click", handleMicClick);
camBtn.addEventListener("click", handleCamClick);
camSelect.addEventListener("input", handleCamSelect);