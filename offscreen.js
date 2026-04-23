/**
 * Offscreen document serves to take care of the tab capture as service worker is prohibited from doing so.
 */
let mediaRecorder = null;
let audioChunks = [];
let captureStream = null;
let geminiApiKey = null;

// Receive messages to know when to setup media and start/stop recording
chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'SETUP_STREAM') {
        geminiApiKey = message.geminiApiKey;
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
                // Next step: send audioBlob to Gemini for transcription
                try {
                    transcribeAndSummarize(audioBlob);
                    console.log("Transcription and summarization complete.");
                } catch (err){
                    console.error("Failed to transcribe:", err);
                }
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

// Set up capture stream to obtain tab audio
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

// Transcribe the audio blob, have Gemini return a summary.
async function transcribeAndSummarize(audioBlob) {
    if (!geminiApiKey){
        console.error("Gemini API key not found for transcription.");
    }

    const base64Audio = await blobToBase64(audioBlob);

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json'},
            body: JSON.stringify({
                contents: [{
                    parts: [
                        {
                            inline_data: {
                                mime_type: 'audio/webm',
                                data: base64Audio
                            }
                        },
                        {
                            text: 'Transcribe this audio. If it is not in English, translate \
                            it into English first. Do not give me the transcription of what was said, just \
                            use it to present the educational summary of what was said. \
                             You are to act as a a mentor / learning assistant \
                            to help the user retain the information that has been presented in the audio. \
                            Provide a concise summary of the key points covered in an educational format.'
                        }
                    ]
                }]
            })
        }
    );

    const data = await response.json();
    const summary = data.candidates[0].content.parts[0].text;
    console.log('Summary:', summary);
    chrome.runtime.sendMessage({type: 'SUMMARY_COMPLETE', summary: summary});
}

// Audio needs to be converted to Base 64
function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}