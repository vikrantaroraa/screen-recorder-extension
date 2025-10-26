const recordTab = document.getElementById("tab");
const recordScreen = document.getElementById("screen");

const runCode = async () => {
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

  if (recordingState[0] === true) {
    if (recordingState[1] === "tab") {
      recordTab.innerText = "Stop Recording Tab";
    } else {
      recordScreen.innerText = "Stop Recording Screen";
    }
  }

  // Listen for when either of 'Record Tab' or 'Record Screen' buttons are clicked
  const startRecording = async (type) => {
    console.log(`Starting ${type} recording...`);
  };

  recordTab.addEventListener("click", async () => {
    console.log("Record Tab button clicked");
    startRecording("tab");
  });

  recordScreen.addEventListener("click", async () => {
    console.log("Record Screen button clicked");
    startRecording("screen");
  });
};

init();
