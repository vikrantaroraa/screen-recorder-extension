console.log("✅ Offscreen document loaded!");

chrome.runtime.onMessage.addListener((request, sender) => {
  console.log("[offscreen] message received :- ", request, sender);

  switch (request.type) {
    case "start-recording":
      console.log("offscreen start recording tab");
      break;
    case "stop-recording":
      console.log("stop recording tab");
      break;
    default:
      console.log("default");
  }

  return true;
});
