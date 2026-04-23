const apiKeyInput = document.getElementById('apiKey');
const saveButton = document.getElementById('save');
const status = document.getElementById('status');
const languageInput = document.getElementById('language');

chrome.storage.sync.get(['geminiApiKey', 'language'], ({ geminiApiKey, language }) => {
    if (geminiApiKey) apiKeyInput.value = geminiApiKey;
    if (language) languageInput.value = language;
});

saveButton.addEventListener('click', () => {
    const key = apiKeyInput.value.trim();
    if (!key) {
        status.textContent = 'Please enter an API key.';
        status.className = 'error';
        return;
    }
    let lang = languageInput.value.trim();
    if (!lang) lang = 'English';
    chrome.storage.sync.set({ geminiApiKey: key, language: lang }, () => {
        status.textContent = 'Saved!';
        status.className = 'saved';
        setTimeout(() => status.textContent = '', 2000);
    });
});
