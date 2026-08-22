async function setupOffscreenDocument() {
    if (await chrome.offscreen.hasDocument()) return;
    await chrome.offscreen.createDocument({
        url: 'offscreen.html',
        reasons: ['DISPLAY_MEDIA'],
        justification: 'Audio transcript needed to present video summary to user.'
    });
}

const BADGE_STATE = {
    armed: { text: 'ON', color: '#2f5f8f', title: 'PausePoint is armed for this tab' },
    recording: { text: 'REC', color: '#d33232', title: 'PausePoint is capturing audio' },
    error: { text: '!', color: '#d33232', title: 'PausePoint failed to activate — click to retry' }
};

function setBadge(tabId, state) {
    if (state === 'off') {
        chrome.action.setBadgeText({ text: '', tabId });
        chrome.action.setTitle({ title: 'Activate PausePoint on this tab', tabId });
        return;
    }
    const { text, color, title } = BADGE_STATE[state];
    chrome.action.setBadgeText({ text, tabId });
    chrome.action.setBadgeBackgroundColor({ color, tabId });
    chrome.action.setTitle({ title, tabId });
}

chrome.action.onClicked.addListener(async (tab) => {
    await setupOffscreenDocument();
    try {
        const streamId = await chrome.tabCapture.getMediaStreamId({ targetTabId: tab.id });
        const { geminiApiKey } = await chrome.storage.sync.get('geminiApiKey');
        await chrome.storage.session.set({ tabId: tab.id });
        chrome.runtime.sendMessage({ type: 'SETUP_STREAM', streamId, geminiApiKey });
        setBadge(tab.id, 'armed');
        console.log('PausePoint activated for tab:', tab.id);
    } catch (err) {
        setBadge(tab.id, 'error');
        console.error('Failed to activate PausePoint:', err);
    }
});

chrome.runtime.onMessage.addListener((message, sender) => {
    if (message.type === 'VIDEO_PAUSED') {
        console.log('Video paused, telling offscreen to stop');
        chrome.runtime.sendMessage({ type: 'STOP_RECORDING' });
        if (sender.tab) setBadge(sender.tab.id, 'armed');
    }

    if (message.type === 'VIDEO_PLAYING') {
        console.log('Video playing, telling offscreen to start');
        chrome.runtime.sendMessage({ type: 'START_RECORDING' });
        if (sender.tab) setBadge(sender.tab.id, 'recording');
    }

    if (message.type === 'SUMMARY_COMPLETE'){
        console.log('Summary received by service-worker, forwarding to client');
        chrome.storage.session.get('tabId').then(({ tabId }) => {
            console.log(tabId);
            chrome.tabs.sendMessage(tabId, { type: 'SHOW_SUMMARY', summary: message.summary });
        });
    }

    if (message.type === 'CHAT_REPLY'){
        console.log('Chat reply received by service-worker, forwarding to client');
        chrome.storage.session.get('tabId').then(({ tabId }) => {
            chrome.tabs.sendMessage(tabId, { type: 'CHAT_REPLY', reply: message.reply });
        });
    }
});
