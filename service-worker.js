
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'VIDEO_PAUSED'){
        console.log('Background received pause at: ', message.currentTime);
    }
});