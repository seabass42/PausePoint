let mediaRecorder = null;
let audioChunks = [];
let captureStream = null;

chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'SETUP_STREAM') {
        setupStream(message.streamId);
    }

    if (message.type === 'START_RECORDING') {
        if (captureStream && (!mediaRecorder || mediaRecorder.state === 'inactive')) {
            audioChunks = [];
            mediaRecorder = new MediaRecorder(captureStream);
            mediaRecorder.ondataavailable = (e) => audioChunks.push(e.data);
            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                console.log('Audio captured, blob size:', audioBlob.size);
                // Next step: send audioBlob to Whisper for transcription
            };
            mediaRecorder.start();
        }
    }

    if (message.type === 'STOP_RECORDING') {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
        }
    }
});

async function setupStream(streamId) {
    captureStream = await navigator.mediaDevices.getUserMedia({
        audio: {
            mandatory: {
                chromeMediaSource: 'tab',
                chromeMediaSourceId: streamId
            }
        }
    });
    const audioContext = new AudioContext();
    audioContext.createMediaStreamSource(captureStream).connect(audioContext.destination);
    console.log('Stream ready');
}
