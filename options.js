const apiKeyInput = document.getElementById('apiKey');
const saveButton = document.getElementById('save');
const status = document.getElementById('status');

chrome.storage.sync.get('geminiApiKey', ({ geminiApiKey }) => {
    if (geminiApiKey) apiKeyInput.value = geminiApiKey;
});

saveButton.addEventListener('click', () => {
    const key = apiKeyInput.value.trim();
    if (!key) {
        status.textContent = 'Please enter an API key.';
        status.className = 'error';
        return;
    }
    chrome.storage.sync.set({ geminiApiKey: key }, () => {
        status.textContent = 'Saved!';
        status.className = 'saved';
        setTimeout(() => status.textContent = '', 2000);
    });
});
