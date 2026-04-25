console.log("Pause Point activated.")
let currentVideo = null;

function onPause() {
    chrome.runtime.sendMessage({ type: 'VIDEO_PAUSED', currentTime: this.currentTime });
}

function onPlay() {
    chrome.runtime.sendMessage({ type: 'VIDEO_PLAYING'});
}

// Remove listener from old video, attach to new video for pause point to listen to
function attachToVideo(video) {
    if (currentVideo){
        currentVideo.removeEventListener('pause', onPause);
        currentVideo.removeEventListener('play', onPlay);
    }
    currentVideo = video;
    video.addEventListener('pause', onPause);
    video.addEventListener('play', onPlay);
    if (!videoPaused) onPlay();
}

function findMainVideo() {
    // Look for main youtube video if on youtube
    const ytVideo = document.querySelector('#movie_player video, ytd-player video');
    if (ytVideo) {
        console.log('Main YT video found');
        return ytVideo;
    }
    // Otherwise, look for other video element to return
    const videos = document.querySelectorAll('video');
    for (const v of videos) {
        if (v.readyState > 0) return v;
    }
    return videos[0] || null;
}

const observer = new MutationObserver(() => {
    const video = findMainVideo();
    if (video && video !== currentVideo) attachToVideo(video);
})

observer.observe(document.body, { childList: true, subtree: true});

// Handle for case when content script starts when video is already on screen (DOM change needed to affect MutationObserver)
const existingVideo = findMainVideo();
if (existingVideo) attachToVideo(existingVideo);

chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'SHOW_SUMMARY'){
        showSummaryPanel(message.summary);
    }
});

// UI Section meant to display the summary to the user

function showSummaryPanel(summary) {
    const existing = document.getElementById('pausepoint-panel');
    if (existing) existing.remove();

    injectStyles();

    const panel = document.createElement('div');
    panel.id = 'pausepoint-panel';
    panel.innerHTML = ` \
        <div id="pausepoint-header"> \
            <span id="pausepoint-title">PausePoint</span> \
            <button id="pausepoint-close">x</button> \
        </div> \
        <div id="pausepoint-body">${formatSummary(summary)}</div> \
    `;

    document.body.appendChild(panel);
    document.getElementById('pausepoint-close').addEventListener('click', () => panel.remove());
}

function formatSummary(text){
    return text
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
         .replace(/^### (.+)$/gm, '<h4>$1</h4>')
         .replace(/^## (.+)$/gm, '<h3>$1</h3>')
         .replace(/^# (.+)$/gm, '<h3>$1</h3>')
         .replace(/^- (.+)$/gm, '<li>$1</li>')
         .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
         .replace(/\n{2,}/g, '<br><br>')
         .replace(/\n/g, '<br>');

}

function injectStyles() {
    if (document.getElementById('pausepoint-styles')) return;
    const style = document.createElement('style');                                                                                                           style.id = 'pausepoint-styles';
      style.textContent = `
          #pausepoint-panel {
              position: fixed;
              top: 80px;
              right: 24px;
              width: 360px;
              max-height: 70vh;
              background: #1f1f1f;
              color: #e8e8e8;
              border-radius: 12px;
              box-shadow: 0 8px 32px rgba(0,0,0,0.5);
              z-index: 9999;
              display: flex;
              flex-direction: column;
              font-family: 'Roboto', sans-serif;
              font-size: 14px;
              overflow: hidden;
          }
          #pausepoint-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 14px 16px;
              background: #272727;
              border-bottom: 1px solid #333;
          }
          #pausepoint-title {
              font-weight: 600;
              font-size: 15px;
              color: #fff;
          }
          #pausepoint-close {
              background: none;
              border: none;
              color: #aaa;
              font-size: 16px;
              cursor: pointer;
          }
          #pausepoint-close:hover { color: #fff; }
          #pausepoint-body {
              padding: 16px;
              overflow-y: auto;
              line-height: 1.6;
              color: #d0d0d0;
          }
          #pausepoint-body h3, #pausepoint-body h4 { color: #fff; margin: 12px 0 6px; }
          #pausepoint-body strong { color: #fff; }
          #pausepoint-body ul { padding-left: 20px; margin: 6px 0; }
          #pausepoint-body li { margin-bottom: 4px; }
      `;
      document.head.appendChild(style);
  }

