// This file will inject an iframe into the current webpage, that has permission to access the user's camera and microphone.

window.cameraId = "rusty-camera";

window.camera = document.getElementById(cameraId);

// Check if the camera iframe already exists
if (window.camera) {
  console.log("camera found", camera);
} else {
  const cameraElement = document.createElement("iframe");
  cameraElement.id = cameraId;
  cameraElement.setAttribute(
    "style",
    `
    all: initial;
    position: fixed;
    width: 150px;
    height: 150px;
    border-radius: 50%;
    background: transparent;
    z-index: 999999;
    top: 10px;
    right: 10px;
    border: none;
    `
  );

  // set permissions on iframe for camera and microphone
  cameraElement.setAttribute("allow", "camera; microphone;");

  cameraElement.src = chrome.runtime.getURL("camera.html");
  document.body.appendChild(cameraElement);
}
