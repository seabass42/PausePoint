let mediaRecorder = null;
let audioChunks = [];
chrome.runtime.onMessage.addListener(( message, sender, sendResponse ) => {
    if (message.type === 'VIDEO_PAUSED'){
        if (mediaRecorder){
            mediaRecorder.stop();
        }
        console.log('Pause received at: ', message.currentTime);
    }

    if (message.type === 'VIDEO_PLAYING'){
        audioChunks = [];
        chrome.tabCapture.capture({ audio: true, video: false}, (stream) => {
            mediaRecorder = new MediaRecorder(stream);
            mediaRecorder.ondataavailable = (e) => {
                audioChunks.push(e.data);
            };
            mediaRecorder.onstop = (e) => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                console.log(audioBlob.size);
            }
            mediaRecorder.start();
        })
    }
})