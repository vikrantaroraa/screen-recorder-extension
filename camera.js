const runCode = async () => {
  const cameraElement = document.querySelector("#camera");
  console.log("cameraElement", cameraElement);

  // First request permission to use camera and microphone
  const permissions = await navigator.permissions.query({ name: "camera" });

  //Prompt user for permission to use camera and microphone, if not already granted
  if (permissions.state === "prompt") {
    //trigger the permission dialog
    await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    return;
  }
  if (permissions.state === "denied") {
    alert("Camera permissions denied");
    return;
  }
  console.log("Camera permission state:", permissions);

  const startCamera = async () => {
    const videoElement = document.createElement("video");
    videoElement.setAttribute(
      "style",
      "width: 150px; height: 150px; transform: scaleX(-1); object-fit: cover; border-radius: 50%;"
    );
    videoElement.setAttribute("autoplay", true);
    videoElement.setAttribute("muted", true);

    const cameraStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false,
    });
    videoElement.srcObject = cameraStream;

    cameraElement.appendChild(videoElement);
  };

  startCamera();
};

runCode();
