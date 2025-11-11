console.log("Offscreen document loaded!");

chrome.runtime.onMessage.addListener((request, sender) => {
  console.log("[offscreen] message received :- ", request, sender);

  switch (request.type) {
    case "start-recording":
      console.log("offscreen start recording tab");
      startTheRecording(request.data);
      break;
    case "stop-recording":
      console.log("stop recording tab");
      stopTheRecording();
      break;
    default:
      console.log("default");
  }
});

let recorder;
let data = [];

const stopTheRecording = async () => {
  console.log("Stop recording (offscreen document)");
  if (recorder && recorder.state === "recording") {
    recorder.stop();

    // stop all tracks
    recorder.stream.getTracks().forEach((track) => track.stop());
  }
};

const startTheRecording = async (streamId) => {
  console.log("Start recording (offscreen document):- ", streamId);
  try {
    if (recorder && recorder.state === "recording") {
      throw new Error("Recording already in progress");
    }

    //use the tabCapture API to capture the current tab stream
    const mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        mandatory: {
          chromeMediaSource: "tab",
          chromeMediaSourceId: streamId,
        },
      },
      video: {
        mandatory: {
          chromeMediaSource: "tab",
          chromeMediaSourceId: streamId,
        },
      },
    });

    // get microphone stream
    const micStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
      },
    });

    const mixedContext = new AudioContext();
    const mixedDestination = mixedContext.createMediaStreamDestination();

    mixedContext.createMediaStreamSource(micStream).connect(mixedDestination);
    mixedContext.createMediaStreamSource(mediaStream).connect(mixedDestination);

    const combinedStream = new MediaStream([
      mediaStream.getVideoTracks()[0],
      mixedDestination.stream.getTracks()[0],
    ]);

    recorder = new MediaRecorder(combinedStream, {
      mimeType: "video/webm",
    });

    // listen for dataavailable event to collect recorded data
    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        console.log("Data available:- ", event);
        data.push(event.data);
      }
    };

    recorder.onstop = () => {
      console.log("Recording stopped");
      // send the data to service-worker
      console.log("Sending recorded data to service-worker");
      // convert data array to blob and open window to play the video
      const blob = new Blob(data, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      // send message to service-worker to open tab with the recorded data url
      chrome.runtime.sendMessage({ type: "open-tab", url });
    };

    // start recording
    recorder.start();
  } catch (error) {}
};
