const cameraId = "rusty-camera";

const camera = document.getElementById(cameraId);

// Check if the camera iframe already exists
if (camera) {
  console.log("camera found", camera);
} else {
  const cameraElement = document.createElement("div");
  cameraElement.id = cameraId;
  cameraElement.setAttribute(
    "style",
    `
    position: fixed;
    width: 200px;
    height: 200px;
    border-radius: 50%;
    background: black;
    z-index: 999999;
    top: 0;
    right: 0;
    `
  );
  document.body.appendChild(cameraElement);
}
