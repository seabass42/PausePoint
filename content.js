console.log("Pause Point activated.")
let currentVideo = null;

// YouTube reuses the same <video> element for ads and content, marking the
// player with 'ad-showing'/'ad-interrupting' while an ad plays. Use that to
// keep ad audio out of the capture.
function isAdShowing() {
    const player = document.querySelector('#movie_player');
    return !!(player && (player.classList.contains('ad-showing') || player.classList.contains('ad-interrupting')));
}

function notifyPaused() {
    chrome.runtime.sendMessage({ type: 'VIDEO_PAUSED' });
}

function notifyPlaying() {
    chrome.runtime.sendMessage({ type: 'VIDEO_PLAYING' });
}

function onPause() {
    if (isAdShowing()) return;
    notifyPaused();
}

function onPlay() {
    if (isAdShowing()) return;
    notifyPlaying();
}

// Jumping to a new point mid-playback doesn't fire pause/play, so without this
// the recorder just keeps running and blends audio from two unrelated points
// in the video into one clip. Only matters while actually playing — seeking
// while paused has no in-flight recording to reset.
function onSeeking() {
    if (isAdShowing() || currentVideo.paused) return;
    chrome.runtime.sendMessage({ type: 'VIDEO_SEEKED' });
}

// Watch the player for ad state changes so a mid-roll ad stops capture and
// resuming content afterward restarts it, even if no pause/play event fires.
let adObserverTarget = null;
const adObserver = new MutationObserver(() => {
    if (!currentVideo) return;
    if (isAdShowing()) {
        notifyPaused();
    } else if (!currentVideo.paused) {
        notifyPlaying();
    }
});

function watchAdState() {
    const player = document.querySelector('#movie_player');
    if (!player || player === adObserverTarget) return;
    adObserver.disconnect();
    adObserver.observe(player, { attributes: true, attributeFilter: ['class'] });
    adObserverTarget = player;
}

// Remove listener from old video, attach to new video for pause point to listen to
function attachToVideo(video) {
    if (currentVideo){
        currentVideo.removeEventListener('pause', onPause);
        currentVideo.removeEventListener('play', onPlay);
        currentVideo.removeEventListener('seeking', onSeeking);
    }
    currentVideo = video;
    video.addEventListener('pause', onPause);
    video.addEventListener('play', onPlay);
    video.addEventListener('seeking', onSeeking);
    watchAdState();
    if (!video.paused) onPlay();
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
        addMessage('ai', message.summary);
        chrome.storage.sync.get('textToSpeech', ({ textToSpeech }) => {
            if (textToSpeech) speakSummary(message.summary);
        });
    }
    if (message.type === 'CHAT_REPLY'){
        addMessage('ai', message.reply);
        chrome.storage.sync.get('textToSpeech', ({ textToSpeech }) => {
            if (textToSpeech) speakSummary(message.reply);
        });
    }
});

// UI Section meant to display the conversation to the user

function ensurePanel() {
    let panel = document.getElementById('pausepoint-panel');
    if (panel) return panel;

    injectStyles();

    panel = document.createElement('div');
    panel.id = 'pausepoint-panel';
    panel.innerHTML = ` \
        <div id="pausepoint-header"> \
            <span id="pausepoint-title">PausePoint</span> \
            <button id="pausepoint-close">x</button> \
        </div> \
        <div id="pausepoint-messages"></div> \
        <div id="pausepoint-input-row"> \
            <input id="pausepoint-input" type="text" placeholder="Ask about the video..." /> \
            <button id="pausepoint-send">Send</button> \
        </div> \
    `;

    document.body.appendChild(panel);

    // Switch from right-anchored to left/top-anchored positioning (without moving
    // it) so dragging and native resize both behave predictably from a fixed corner.
    const rect = panel.getBoundingClientRect();
    panel.style.left = `${rect.left}px`;
    panel.style.top = `${rect.top}px`;
    panel.style.right = 'auto';

    document.getElementById('pausepoint-close').addEventListener('click', () => panel.remove());
    document.getElementById('pausepoint-send').addEventListener('click', sendChatMessage);
    document.getElementById('pausepoint-input').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') sendChatMessage();
    });

    makeDraggable(panel, panel.querySelector('#pausepoint-header'));

    return panel;
}

// Lets the user reposition the panel by dragging its header.
function makeDraggable(panel, handle) {
    let startX, startY, startLeft, startTop;

    function onMouseDown(e) {
        if (e.target.closest('#pausepoint-close')) return;
        e.preventDefault();

        const rect = panel.getBoundingClientRect();
        startX = e.clientX;
        startY = e.clientY;
        startLeft = rect.left;
        startTop = rect.top;

        document.body.style.userSelect = 'none';
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }

    function onMouseMove(e) {
        const maxLeft = window.innerWidth - panel.offsetWidth;
        const maxTop = window.innerHeight - panel.offsetHeight;
        const nextLeft = startLeft + (e.clientX - startX);
        const nextTop = startTop + (e.clientY - startY);
        panel.style.left = `${Math.min(Math.max(0, nextLeft), Math.max(0, maxLeft))}px`;
        panel.style.top = `${Math.min(Math.max(0, nextTop), Math.max(0, maxTop))}px`;
    }

    function onMouseUp() {
        document.body.style.userSelect = '';
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
    }

    handle.addEventListener('mousedown', onMouseDown);
}

function addMessage(role, text) {
    const panel = ensurePanel();
    const messages = panel.querySelector('#pausepoint-messages');

    const bubble = document.createElement('div');
    bubble.className = `pausepoint-message pausepoint-${role}`;
    bubble.innerHTML = formatSummary(text);

    messages.appendChild(bubble);
    messages.scrollTop = messages.scrollHeight;
}

function sendChatMessage() {
    const input = document.getElementById('pausepoint-input');
    const text = input.value.trim();
    if (!text) return;

    addMessage('user', text);
    input.value = '';
    chrome.runtime.sendMessage({ type: 'CHAT_MESSAGE', message: text });
}

function speakSummary(text) {
    window.speechSynthesis.cancel();
    const plain = text
        .replace(/\*\*(.+?)\*\*/g, '$1')
        .replace(/^#{1,3} /gm, '')
        .replace(/^- /gm, '')
        .replace(/\n+/g, ' ')
        .trim();
    const utterance = new SpeechSynthesisUtterance(plain);
    window.speechSynthesis.speak(utterance);
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
              height: 480px;
              min-width: 280px;
              min-height: 220px;
              max-width: 90vw;
              max-height: 90vh;
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
              resize: both;
          }
          #pausepoint-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 14px 16px;
              background: #272727;
              border-bottom: 1px solid #333;
              cursor: move;
              user-select: none;
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
          #pausepoint-messages {
              padding: 16px;
              overflow-y: auto;
              line-height: 1.6;
              color: #d0d0d0;
              flex: 1;
              display: flex;
              flex-direction: column;
              gap: 10px;
          }
          #pausepoint-messages h3, #pausepoint-messages h4 { color: #fff; margin: 12px 0 6px; }
          #pausepoint-messages strong { color: #fff; }
          #pausepoint-messages ul { padding-left: 20px; margin: 6px 0; }
          #pausepoint-messages li { margin-bottom: 4px; }
          .pausepoint-message {
              padding: 10px 12px;
              border-radius: 10px;
              max-width: 90%;
          }
          .pausepoint-message.pausepoint-ai {
              background: #2a2a2a;
              align-self: flex-start;
          }
          .pausepoint-message.pausepoint-user {
              background: #2f5f8f;
              color: #fff;
              align-self: flex-end;
          }
          #pausepoint-input-row {
              display: flex;
              gap: 8px;
              padding: 12px 16px;
              border-top: 1px solid #333;
              background: #272727;
          }
          #pausepoint-input {
              flex: 1;
              padding: 8px 10px;
              border-radius: 6px;
              border: 1px solid #444;
              background: #1a1a1a;
              color: #fff;
              font-size: 13px;
          }
          #pausepoint-input:focus { outline: none; border-color: #2f5f8f; }
          #pausepoint-send {
              padding: 8px 14px;
              border-radius: 6px;
              border: none;
              background: #2f5f8f;
              color: #fff;
              font-size: 13px;
              cursor: pointer;
          }
          #pausepoint-send:hover { background: #3a72ab; }
      `;
      document.head.appendChild(style);
  }

