// This file can be used for background tasks if needed in the future.
// For now, it can listen for events or messages from the popup.

chrome.runtime.onInstalled.addListener(() => {
    console.log("Voice Recognition YouTube Controller Extension Installed");
});

// You can add more event listeners or functions here as needed.