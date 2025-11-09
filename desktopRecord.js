// listen for messages from the service worker:- start recording, stop recording

chrome.runtime.onMessage.addListener(async (request, sender) => {
  console.log("desktopRecord.js received message:- ", request, sender);

  switch (request.type) {
    case "start-recording":
      console.log("desktopRecord.js start recording screen");
      startVideoRecording(request.focusedTabId);
      break;
    case "stop-recording":
      console.log("desktopRecord.js stop recording screen");
      stopVideoRecording();
      break;
    default:
      console.log("default");
  }
});

let recorder;
let data = [];
const stopVideoRecording = async () => {
  console.log("Stop recording (offscreen document)");
  if (recorder && recorder.state === "recording") {
    recorder.stop();

    // stop all tracks
    recorder.stream.getTracks().forEach((track) => track.stop());
  }
};

// focusedTabId is the id of the active tab on which the user was present when he clicked the start screen
// recording button so that we can move the focus back to that tab after giving screen sharing permission
const startVideoRecording = async (focusedTabId) => {
  // use desktopCapture API to capture the screen sctream
  chrome.desktopCapture.chooseDesktopMedia(
    ["screen", "window"],
    async (streamId) => {
      if (!streamId) {
        console.log("User cancelled the request");
        return;
      }

      // log the streamId
      console.log("desktopRecord.js streamId:- ", streamId);

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          mandatory: {
            chromeMediaSource: "desktop",
            chromeMediaSourceId: streamId,
          },
        },
        video: {
          mandatory: {
            chromeMediaSource: "desktop",
            chromeMediaSourceId: streamId,
          },
        },
      });
      console.log("desktopRecord.js captured stream:- ", mediaStream);

      // get the microphone stream
      const micStream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false },
      });

      if (micStream.getAudioTracks().length !== 0) {
        const combinedStream = new MediaStream([
          mediaStream.getVideoTracks()[0],
          micStream.getAudioTracks()[0],
        ]);

        console.log("desktopRecord.js combined stream:- ", combinedStream);

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
          console.log("Sending recorded data to service-worker", data);
          // convert data array to blob and open window to play the video
          // const blob = new Blob(data, { type: "video/webm" });
          // const url = URL.createObjectURL(blob);
          // window.open(url);

          data = [];
        };

        // start recording
        recorder.start();

        // set focus back to the tab where user was present before screen sharing permission
        if (focusedTabId) {
          chrome.tabs.update(focusedTabId, { active: true });
        }
      }
      return;
    }
  );
};
