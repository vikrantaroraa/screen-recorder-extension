const recordTab = document.getElementById("tab");
const recordScreen = document.getElementById("screen");

const injectCamera = async () => {
  // Inject the content script into the active tab when the popup is opened
  const tab = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab) {
    console.error("No active tab found.");
    return;
  }

  const tabId = tab[0].id;
  console.log("Inject into tab:- ", tabId);

  await chrome.scripting.executeScript({
    target: { tabId },
    files: ["content.js"],
  });
};

const removeCamera = async () => {
  // Inject the content script into the active tab when the popup is opened
  const tab = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab) {
    console.error("No active tab found.");
    return;
  }

  const tabId = tab[0].id;
  console.log("Inject into tab:- ", tabId);

  await chrome.scripting.executeScript({
    func: () => {
      const cameraElement = document.getElementById("rusty-camera");
      if (!cameraElement) return;
      cameraElement.style.display = "none";
    },
    target: { tabId },
  });
};

//Check chrome storage if recording is already in progress
const checkRecordingStatus = async () => {
  const result = await chrome.storage.local.get(["recording", "type"]);
  const recordingStatus = result.recording || false;
  const recordingType = result.type || "";
  console.log("Recording status:- ", recordingStatus, recordingType);
  return [recordingStatus, recordingType];
};

const init = async () => {
  const recordingState = await checkRecordingStatus();
  console.log("Initial recording state in popup.js:- ", recordingState);
  if (recordingState[0] === true) {
    if (recordingState[1] === "tab") {
      recordTab.innerText = "Stop Recording Tab";
    } else {
      recordScreen.innerText = "Stop Recording Screen";
    }
  }

  // Listen for when either of 'Record Tab' or 'Record Screen' buttons are clicked
  const updateRecording = async (recordingType) => {
    console.log(`Starting recording:- ${recordingType}`);

    const recordingState = await checkRecordingStatus();

    if (recordingState[0] === true) {
      // send message to service-worker to stop recording
      chrome.runtime.sendMessage({
        type: "stop-recording",
      });
      removeCamera();
    } else {
      // send message to service-worker to start recording
      chrome.runtime.sendMessage({
        type: "start-recording",
        recordingType: recordingType,
      });
      injectCamera();
    }
    //close the popup after button click
    window.close();
  };

  recordTab.addEventListener("click", async () => {
    console.log("Record Tab button clicked");
    updateRecording("tab");
  });

  recordScreen.addEventListener("click", async () => {
    console.log("Record Screen button clicked");
    updateRecording("screen");
  });
};

init();
