//Check chrome storage if recording is already in progress
const checkRecordingStatus = async () => {
  const result = await chrome.storage.local.get(["recording", "type"]);
  const recordingStatus = result.recording || false;
  const recordingType = result.type || "";
  // console.log("Recording status:- ", recordingStatus, recordingType);
  return [recordingStatus, recordingType];
};

// Update recording state based on messages from popup.js
const updateRecordingState = async (state, type) => {
  // console.log("Updated recording:- ", type);
  await chrome.storage.local.set({ recording: state, type });
};

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

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  console.log("Tab activated:- ", activeInfo);

  try {
    // grab the activated tab
    const activeTab = await chrome.tabs.get(activeInfo.tabId);
    if (!activeTab || !activeTab.url) return;

    const activeTabUrl = activeTab.url;
    // if chrome or extension page, return
    if (
      activeTabUrl.startsWith("chrome://") ||
      activeTabUrl.startsWith("chrome-extension://")
    ) {
      return;
    }

    // check if we are recording & if we recording the screen
    const [recoring, recordingType] = await checkRecordingStatus();

    if (recoring && recordingType === "screen") {
      // inject the camera
      injectCamera();
    } else {
      // remove the camera
      removeCamera();
    }
  } catch (error) {
    console.warn("Error in onActivated listener:", err);
  }
});

const recordTabState = async (start = true) => {
  // console.log("recordTab called");
  // ccreating the offscreen document
  const existingContexts = await chrome.runtime.getContexts({});
  // console.log("existingContexts:- ", existingContexts);

  const offscreenDoucment = existingContexts.find(
    (context) => context.contextType === "OFFSCREEN_DOCUMENT"
  );
  // console.log("offscreenDoucment:- ", offscreenDoucment);

  if (!offscreenDoucment) {
    // console.log("Creating offscreen document");
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

    // console.log("Tab ID:- ", tabId);

    try {
      streamId = await chrome.tabCapture.getMediaStreamId({
        targetTabId: tabId,
      });
      console.log("Stream ID:- ", streamId);
    } catch (error) {
      // console.error("Error capturing tab:- ", error);
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

const startRecording = async (recordingType) => {
  // console.log("Starting recording:- ", recordingType);
  const recordingState = await checkRecordingStatus();
  // console.log("Curreent State:- ", recordingState);
  updateRecordingState(true, recordingType);
  // update extension icon to indicate recording stopped
  chrome.action.setIcon({ path: "icons/recording.png" });
  if (recordingType === "tab") {
    recordTabState(true);
  } else if (recordingType === "screen") {
    recordScreen();
  }
};

const recordScreen = async () => {
  // get the current active tab to focus back after screen sharing permission
  const currentTab = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });
  const currentTabId = currentTab[0].id;

  // create a pinned focused tab - with an index of 0
  const desktopRecordPath = chrome.runtime.getURL("desktopRecord.html");
  const newPinnedTab = await chrome.tabs.create({
    url: desktopRecordPath,
    pinned: true,
    active: true,
    index: 0,
  });

  // wait for 500ms seconds to allow the tab to load completely and then send a message to the tab to start recording
  setTimeout(() => {
    chrome.tabs.sendMessage(newPinnedTab.id, {
      type: "start-recording",
      focusedTabId: currentTabId,
    });
  }, 500);
};

const stopRecording = async () => {
  // console.log("Stop recording");
  const recordingState = await checkRecordingStatus();
  // console.log("Curreent State:- ", recordingState);
  updateRecordingState(false, "");
  // update extension icon to indicate recording stopped
  chrome.action.setIcon({ path: "icons/not-recording.png" });
  recordTabState(false);
};

const openTabWithRecordedVideo = async (request) => {
  console.log("openTabWithRecordedVideo called:- ", request);

  // the message will either have a base64 or url property
  const { url: videoUrl, base64 } = request;

  if (!videoUrl && !base64) return;

  // open tab
  const url = chrome.runtime.getURL("video.html");
  const newTab = await chrome.tabs.create({ url });

  //send message to the video.html tab to play the video
  setTimeout(() => {
    chrome.tabs.sendMessage(newTab.id, {
      type: "play-video",
      videoUrl,
      base64,
    });
  }, 500);
};

// Add a listener for the 'Record Screen' button
chrome.runtime.onMessage.addListener((request, sender) => {
  // console.log("Service Worker received message:- ", request, sender);
  switch (request.type) {
    case "start-recording":
      startRecording(request.recordingType);
      break;
    case "stop-recording":
      stopRecording();
      break;
    case "open-tab":
      openTabWithRecordedVideo(request);
    default:
      console.log("default");
  }
});
