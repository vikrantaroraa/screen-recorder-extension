//Check chrome storage if recording is already in progress
const checkRecordingStatus = async () => {
  const result = await chrome.storage.local.get(["recording", "type"]);
  const recordingStatus = result.recording || false;
  const recordingType = result.type || "";
  console.log("Recording status:- ", recordingStatus, recordingType);
  return [recordingStatus, recordingType];
};

// Update recording state based on messages from popup.js
const updateRecordingState = async (state, type) => {
  console.log("Updated recording:- ", type);
  await chrome.storage.local.set({ recording: state, type });
};

const recordTabState = async (start = true) => {
  console.log("recordTab called");
  // ccreating the offscreen document
  const existingContexts = await chrome.runtime.getContexts({});
  console.log("existingContexts:- ", existingContexts);

  const offscreenDoucment = existingContexts.find(
    (context) => context.contextType === "OFFSCREEN_DOCUMENT"
  );
  console.log("offscreenDoucment:- ", offscreenDoucment);

  if (!offscreenDoucment) {
    console.log("Creating offscreen document");
    // Create an offscreen document
    await chrome.offscreen.createDocument({
      url: "offscreen.html",
      reasons: ["USER_MEDIA", "DISPLAY_MEDIA"],
      justification:
        "Needed to record tab or screen using chrome.tabCapture API",
    });
  }

  if (start) {
    let streamId;
    // use the tabCapture API to capture the current tab stream
    const tab = await chrome.tabs.query({ active: true, currentWindow: true });
    console.log("Active tab:- ", tab);
    if (!tab) return;

    const tabId = tab[0].id;

    console.log("Tab ID:- ", tabId);

    try {
      streamId = await chrome.tabCapture.getMediaStreamId({
        targetTabId: tabId,
      });
      console.log("Stream ID:- ", streamId);
    } catch (error) {
      console.error("Error capturing tab:- ", error);
    }

    // send message to offscreen document to start recording
    chrome.runtime.sendMessage({
      type: "start-recording",
      target: "offscreen",
      data: streamId,
    });
  } else {
    console.log("start video value:- ", start);
    // send message to offscreen document to stop recording
    chrome.runtime.sendMessage({
      type: "stop-recording",
      target: "offscreen",
    });
  }
};

const startRecording = async (type) => {
  console.log("Starting recording:- ", type);
  const recordingState = await checkRecordingStatus();
  console.log("Curreent State:- ", recordingState);
  updateRecordingState(true, type);
  // update extension icon to indicate recording stopped
  chrome.action.setIcon({ path: "icons/recording.png" });
  if (type === "tab") {
    recordTabState(true);
  }
  // else if (type === "screen") {
  //   recordScreen();
  // }
};

const recordScreen = () => {};

const stopRecording = async () => {
  console.log("Stop recording");
  const recordingState = await checkRecordingStatus();
  console.log("Curreent State:- ", recordingState);
  updateRecordingState(false, "");
  // update extension icon to indicate recording stopped
  chrome.action.setIcon({ path: "icons/not-recording.png" });
  recordTabState(false);
};

// Add a listener for the 'Record Screen' button
chrome.runtime.onMessage.addListener((request, sender) => {
  console.log("Service Worker received message:- ", request, sender);
  switch (request.type) {
    case "start-recording":
      startRecording(request.recordingType);
      break;
    case "stop-recording":
      stopRecording();
      break;
    default:
      console.log("default");
  }
});
