/**
 * Offscreen document serves to take care of the tab capture as service worker is prohibited from doing so.
 */
let mediaRecorder = null;
let captureStream = null;
let geminiApiKey = null;
let conversationHistory = [];

const SYSTEM_INSTRUCTION = {
    parts: [{
        text: 'You are a learning assistant helping someone understand educational video content. \
        Talk to them like a knowledgeable peer, not a customer service rep. Never open with or include \
        praise like "great question", "that\'s a fantastic point", or similar throat-clearing — get \
        straight to the substance. Do not pad answers with encouragement, validation, or filler. \
        Assume the user is a capable adult who wants accurate, direct information, not reassurance.'
    }]
};

// Starts a fresh recording with its own private chunk buffer, so a recorder's
// onstop handler can never read chunks belonging to a different recording.
function startRecording() {
    if (!captureStream) return;
    const chunks = [];
    mediaRecorder = new MediaRecorder(captureStream);
    mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
    mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        console.log('Audio captured, blob size:', audioBlob.size);
        if (audioBlob.size === 0){
            console.log('Audio uncaptured, transcription cancelled.');
            return;
        }
        transcribeAndSummarize(audioBlob).catch((err) => console.error('Failed to transcribe:', err));
    };
    mediaRecorder.start();
}

// Receive messages to know when to setup media and start/stop recording
chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'SETUP_STREAM') {
        geminiApiKey = message.geminiApiKey;
        setupStream(message.streamId);
    }

    if (message.type === 'START_RECORDING') {
        if (!mediaRecorder || mediaRecorder.state === 'inactive') startRecording();
    }

    if (message.type === 'STOP_RECORDING') {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
        }
    }

    if (message.type === 'RESET_RECORDING') {
        // A seek happened mid-playback: discard the in-flight clip (it spans two
        // unrelated points in the video) and start a clean recording from here.
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.onstop = null;
            mediaRecorder.stop();
        }
        startRecording();
    }

    if (message.type === 'CHAT_MESSAGE') {
        sendChatMessage(message.message);
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

    conversationHistory.push({
        role: 'user',
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
                use it to present a concise, educational summary of the key points covered.'
            }
        ]
    });

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json'},
            body: JSON.stringify({ contents: conversationHistory, systemInstruction: SYSTEM_INSTRUCTION })
        }
    );

    const data = await response.json();
    console.log(data);
    const summary = data.candidates[0].content.parts[0].text;
    console.log('Summary:', summary);

    // Swap the heavy inline audio out of history now that we have the summary,
    // so later chat turns don't keep re-sending every past audio clip.
    conversationHistory[conversationHistory.length - 1] = {
        role: 'user',
        parts: [{ text: '[Audio clip from video]' }]
    };
    conversationHistory.push({ role: 'model', parts: [{ text: summary }] });

    chrome.runtime.sendMessage({type: 'SUMMARY_COMPLETE', summary: summary});
}

// Continue the conversation with a text-only follow-up question from the user.
async function sendChatMessage(userMessage) {
    if (!geminiApiKey) {
        console.error('Gemini API key not found for chat.');
        return;
    }

    conversationHistory.push({ role: 'user', parts: [{ text: userMessage }] });

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: conversationHistory, systemInstruction: SYSTEM_INSTRUCTION })
            }
        );

        const data = await response.json();
        const reply = data.candidates[0].content.parts[0].text;
        conversationHistory.push({ role: 'model', parts: [{ text: reply }] });

        chrome.runtime.sendMessage({ type: 'CHAT_REPLY', reply });
    } catch (err) {
        console.error('Failed to get chat reply:', err);
    }
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