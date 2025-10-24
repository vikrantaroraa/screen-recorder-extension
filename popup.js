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

runCode();
