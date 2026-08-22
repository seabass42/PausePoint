# Privacy Policy for PausePoint

**Last updated:** 2026-08-22

PausePoint is a browser extension that summarizes educational YouTube videos when you pause them, and lets you ask follow-up questions about what you just watched.

## What PausePoint accesses

- **Tab audio** — while active on a YouTube tab, PausePoint captures that tab's audio in order to generate a transcript and summary.
- **Video play/pause state** — used to know when to start and stop capturing audio.
- **Your Gemini API key** — you provide your own Google Gemini API key in the extension's options page. It's stored locally via Chrome's `storage.sync` (synced across your signed-in Chrome browsers) and is only ever sent directly to Google's Generative Language API as part of your own requests.
- **Chat messages** — questions you type into the panel are sent to Google's Gemini API, along with the video's summary context, using your own API key.

## What PausePoint does not do

- PausePoint has no backend server operated by the developer — there is nowhere else for your data to go.
- PausePoint does not sell, share, or transmit your data to any third party other than Google's Generative Language API (Gemini), invoked directly with your own API key.
- PausePoint does not track browsing activity outside the YouTube tab you actively choose to run it on.

## Data retention

- Captured audio is processed in memory by the extension's offscreen document and sent directly to Google's Gemini API. It is never written to disk and is discarded once sent.
- Chat/conversation history for a video is kept in memory only for that browsing session and is cleared when the tab closes, the extension reloads, or the browser restarts.
- Your Gemini API key persists in `chrome.storage.sync` until you clear it from the options page or uninstall the extension.

## Third-party processing

Audio and text submitted through PausePoint is processed by Google's Generative Language API (Gemini), governed by Google's own privacy policy: https://policies.google.com/privacy

## Your controls

- PausePoint only runs on a tab after you explicitly click the extension icon.
- You can clear your API key and preferences anytime from the options page.
- Uninstalling the extension removes all locally stored settings.

## Contact

Questions about this policy: bastiantwofaces@gmail.com
