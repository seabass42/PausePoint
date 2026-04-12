console.log("Pause Point activated.")

const observer = new MutationObserver(() => {
    const video = document.querySelector('video');
    if (video) {
        observer.disconnect();
        video.addEventListener('pause', async () => {
            chrome.runtime.sendMessage({
                type: 'VIDEO_PAUSED',
                currentTime: video.currentTime
            });
        });
    }
});

observer.observe(document.body, { childList: true, subtree: true});