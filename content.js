console.log("Pause Point activated.")
const notifyPlaying = () => chrome.runtime.sendMessage({ type: "VIDEO_PLAYING" });

const observer = new MutationObserver(() => {
    const video = document.querySelector('video');
    if (video) {
        observer.disconnect();
        video.addEventListener('pause', () => {
            chrome.runtime.sendMessage({
                type: 'VIDEO_PAUSED',
                currentTime: video.currentTime
            });
        });
        video.addEventListener('play', notifyPlaying);
        if (!video.paused) notifyPlaying();

    }
});

observer.observe(document.body, { childList: true, subtree: true});