import { InputData } from "./content-script";

chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));

// track the current state across the extension
let currentInputState: {
  tabId: number;
  inputData: InputData;
} | null = null;

function getAllPageText(): string {
  // Remove script and style elements to avoid their content
  const clone = document.cloneNode(true) as Document;
  const scripts = clone.getElementsByTagName("script");
  const styles = clone.getElementsByTagName("style");

  Array.from(scripts).forEach((script) => script.remove());
  Array.from(styles).forEach((style) => style.remove());

  // Get visible text
  return clone.body.innerText;
}

// handle messages from content-script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "extractText") {
    const text = getAllPageText();
    sendResponse({ text });
  }
  if (request.action === "INPUT_FOCUS_CHANGE") {
    if (sender.tab?.id) {
      currentInputState = {
        tabId: sender.tab.id,
        inputData: request.data,
      };
      console.log(
        "input state changed. new input state is:x",
        currentInputState
      );
    }
  } else if (request.action === "GET_CURRENT_INPUT_STATE") {
    sendResponse({ currentInputState });
  }
  if (request.action === "HIGHLIGHT_CHANGE") {
    console.log("Highlighted text:", request.data.text);
  }
  return true;
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "ask-caret",
    title: "Ask Caret",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "ask-caret" && info.selectionText && tab?.id) {
    chrome.sidePanel.open({ windowId: tab.windowId });
    // Add a small delay to ensure side panel is open before sending message
    await new Promise(resolve => setTimeout(resolve, 150));
    console.log("Sending 'ASK_CARET' message with text:", info.selectionText);
    chrome.tabs.sendMessage(tab.id, {
      action: "ASK_CARET",
      data: { text: info.selectionText }
    });
  }
});
