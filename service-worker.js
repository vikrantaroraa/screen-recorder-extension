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

const startRecording = async (type) => {
  console.log("Starting recording:- ", type);
  const recordingState = await checkRecordingStatus();
  console.log("Curreent State:- ", recordingState);
  updateRecordingState(true, type);
};

const stopRecording = async () => {
  console.log("Stop recording");
  const recordingState = await checkRecordingStatus();
  console.log("Curreent State:- ", recordingState);
  updateRecordingState(false, "");
};

// Add a listener for the 'Record Screen' button
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
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
  return true;
});
