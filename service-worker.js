async function setupOffscreenDocument() {
    if (await chrome.offscreen.hasDocument()) return;
    await chrome.offscreen.createDocument({
        url: 'offscreen.html',
        reasons: ['DISPLAY_MEDIA'],
        justification: 'Audio transcript needed to present video summary to user.'
    });
}

chrome.action.onClicked.addListener(async (tab) => {
    await setupOffscreenDocument();
    try {
        const streamId = await chrome.tabCapture.getMediaStreamId({ targetTabId: tab.id });
        chrome.runtime.sendMessage({ type: 'SETUP_STREAM', streamId });
        console.log('PausePoint activated for tab:', tab.id);
    } catch (err) {
        console.error('Failed to activate PausePoint:', err);
    }
});

chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'VIDEO_PAUSED') {
        console.log('Video paused, telling offscreen to stop');
        chrome.runtime.sendMessage({ type: 'STOP_RECORDING' });
    }

    if (message.type === 'VIDEO_PLAYING') {
        console.log('Video playing, telling offscreen to start');
        chrome.runtime.sendMessage({ type: 'START_RECORDING' });
    }
});
