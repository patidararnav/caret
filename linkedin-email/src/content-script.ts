// debug logs to see if content-script is being loaded (remove later)
console.log("content script loaded");
export interface InputData {
  text: string;
  cursorPosition: number;
  elementType: string;
  isEditable: boolean;
}

function getActiveInputData(): InputData | null {
  const activeElement = document.activeElement;
  if (!activeElement) return null;

  // checking if the element is an input field or contenteditable
  const isInput =
    activeElement instanceof HTMLInputElement ||
    activeElement instanceof HTMLTextAreaElement ||
    activeElement.hasAttribute("contenteditable");
  if (!isInput) return null;

  let text = "";
  let cursorPosition = 0;

  if (
    activeElement instanceof HTMLInputElement ||
    activeElement instanceof HTMLTextAreaElement
  ) {
    text = activeElement.value;
    cursorPosition = activeElement.selectionStart ?? 0;
  } else {
    text = activeElement.textContent ?? "";
    const selection = window.getSelection(); // what is this code doing? ask for expansion and add comment
    if (selection && selection.rangeCount > 0) {
      cursorPosition = selection.getRangeAt(0).startOffset;
    }
  }

  return {
    text,
    cursorPosition,
    elementType: activeElement.tagName.toLowerCase(),
    isEditable: true,
  };
}

document.addEventListener("input", () => {
  const inputData = getActiveInputData();
  if (inputData) {
    chrome.runtime.sendMessage({
      action: "INPUT_FOCUS_CHANGE",
      data: inputData,
    });
  }
});

document.addEventListener("selectionchange", () => {
  const selection = window.getSelection();
  const selectedText = selection?.toString().trim();

  if (selectedText) {
    console.log("selected text, from service worker", selectedText);
    // only send data if text is selected
    chrome.runtime.sendMessage({
      action: "HIGHLIGHT_CHANGE",
      data: {
        text: selectedText, // add data here later
      },
    });
  }
});
