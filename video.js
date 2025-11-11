const playVideo = (request) => {
  const videoElement = document.getElementById("recorded-video");

  const url = request?.videoUrl || request?.base64;
  videoElement.src = url;
  videoElement.play();
};

// listen for messages from service-worker with type of "play-video"
chrome.runtime.onMessage.addListener((request, sender) => {
  switch (request.type) {
    case "play-video":
      console.log("play video:- ", request);
      playVideo(request);
    default:
      console.log("default");
  }
});
