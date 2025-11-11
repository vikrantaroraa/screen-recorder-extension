const saveVideo = (videoUrl) => {
  chrome.storage.local.set({ videoUrl });
};

// on page open, check if there is any recorded video in local storage and play it
chrome.storage.local.get(["videoUrl"], (result) => {
  console.log("Recorded video from storage:- ", result);
  if (result.videoUrl) {
    console.log("Play Recorded video from storage:- ", result);
    playVideo(result);
  }
});

const playVideo = (request) => {
  const videoElement = document.getElementById("recorded-video");

  const url = request?.videoUrl || request?.base64;
  // save the videoin local storage
  saveVideo(url);
  videoElement.src = url;
  videoElement.play();
};

// listen for messages from service-worker with type of "play-video"
chrome.runtime.onMessage.addListener((request, sender) => {
  switch (request.type) {
    case "play-video":
      console.log("play video:- ", request);
      playVideo(request);
      break;
    default:
      console.log("default");
  }
});
