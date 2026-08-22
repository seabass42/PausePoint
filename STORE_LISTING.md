# Chrome Web Store Listing — PausePoint

Copy/paste reference for the Developer Dashboard submission form.

## Short description (max 132 chars — this is 112)

AI-powered summaries of educational YouTube videos, delivered the moment you pause. Ask follow-up questions too.

## Detailed description

PausePoint turns every pause into a study break. While you watch an educational video on YouTube, PausePoint listens along — and the moment you hit pause, it gives you an AI-generated summary of what was just covered, written like notes from a mentor rather than a raw transcript.

Once you have a summary, you can keep the conversation going: ask PausePoint follow-up questions about what you just watched, and it responds with the video's context in mind.

Features:
- Automatic summaries triggered by pausing a YouTube video
- Follow-up chat about the video's content
- Optional text-to-speech playback of summaries
- Movable, resizable in-page panel
- Uses your own Google Gemini API key — no PausePoint account or server required

You'll need a free Google Gemini API key (available at ai.google.dev) to use PausePoint. Add it once in the extension's options page.

## Category

Education

## Language

English

## Permission justifications (required by the CWS review form)

- **tabCapture** — captures the active YouTube tab's audio so it can be transcribed and summarized when you pause the video. No audio is captured unless you've clicked the extension icon on that tab.
- **offscreen** — service workers can't access media APIs directly; an offscreen document is required to record tab audio and call the Gemini API.
- **activeTab** — grants temporary access to the current tab only when you click the extension icon, used to start audio capture for that tab.
- **tabs** — used to route the generated summary/chat reply back to the correct tab's content script after the background service worker receives it from the offscreen document.
- **storage** — stores your Gemini API key and preferences (language, text-to-speech toggle) locally via `chrome.storage.sync`, and the active tab ID for the current session via `chrome.storage.session`.
- **host_permissions (youtube.com)** — the content script that detects the video element and displays the summary panel only runs on YouTube pages.
- **host_permissions (generativelanguage.googleapis.com)** — required to call Google's Gemini API directly from the extension with your API key.

## Single purpose statement

PausePoint's single purpose is to generate AI summaries of YouTube video content when playback is paused, and to let the user ask follow-up questions about that content.

## Privacy policy URL

Host `PRIVACY.md` somewhere public (e.g. GitHub Pages, a gist, or your repo's raw file URL) and paste that URL into the "Privacy policy" field. The Chrome Web Store requires this URL to be reachable at submission time.
