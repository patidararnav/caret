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
    contexts: ["selection"],
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "ask-caret" && info.selectionText && tab?.id) {
    try {
      // First, open the side panel
      await chrome.sidePanel.open({ windowId: tab.windowId });
      
      // Then store the selected text
      console.log("Adding selected text to local storage:", info.selectionText);
      await chrome.storage.local.set({
        selectedText: info.selectionText,
      });

      // Add a small delay to ensure panel is open
      await new Promise(resolve => setTimeout(resolve, 100));

      // Send a message to notify that new text is available
      chrome.runtime.sendMessage({
        action: "NEW_SELECTED_TEXT",
        data: { text: info.selectionText }
      });
    } catch (error) {
      console.error("Error handling context menu click:", error);
    }
  }
});
