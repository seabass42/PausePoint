console.log("Pause Point activated.")
const notifyPlaying = () => chrome.runtime.sendMessage({ type: "VIDEO_PLAYING" });

// Mutation observer to observe changes in the DOM, in this case look for video so pause point can gather info
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

