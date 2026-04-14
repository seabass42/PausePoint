let mediaRecorder = null;
let audioChunks = [];

chrome.offscreen.createDocument({
    url: 'off_screen.html',
    reasons: ['DISPLAY_MEDIA'],
    justification: 'Audio transcript needed to present video summary to user.'
})

