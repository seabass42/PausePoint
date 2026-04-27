# PausePoint
 
> *Pause the video. Get the summary. Stop rewatching the same 5 minutes.*
 
**[▶ Watch Demo](your-demo-link-here)**
 
---
 
## Overview
 
PausePoint is a Chrome Extension that generates real-time AI summaries of lecture content whenever you pause a video. It captures the last 2-5 minutes of audio, transcribes it, and displays a concise summary of the key concepts directly on screen — no rewinding, no rewatching.
 
Built for students who lose focus mid-lecture, or anyone who wants to stay on top of educational video content without constantly scrubbing back.
 
Particularly useful for learners with ADHD or auditory processing challenges.
 
---
 
## Features
 
- **Auto-summary on pause** — detects video pause events and instantly triggers the AI pipeline
- **Real-time audio capture** — uses Chrome Tab Capture API to record the last 2-5 minutes of audio without any manual input
- **AI-powered concept extraction** — records audio and sends it to Gemini API for transcription and to extract and summarize key ideas
- **On-screen overlay** — injects a clean summary UI directly onto the page that appears on pause and dismisses on play
- **Text-to-speech playback** — summaries can be read aloud via Web Speech API for visually impaired users
- **Optional quiz generation** — generates comprehension questions from the summary to reinforce learning
- **Works across platforms** — YouTube, Canvas, and other video platforms
---
 
## How It Works
 
```
Video pauses → Tab Capture API grabs audio buffer
→ Gemini API transcribes the audio and extracts key concepts
→ Summary injected into page overlay
→ Optional: quiz questions generated from summary
```
 
---
 
## Tech Stack
 
- **JavaScript** — content scripts, background service worker, offscreen audio processing
- **Chrome Extension APIs** — Tab Capture, MutationObserver, Chrome Storage, Runtime Messaging
- **Google Gemini API** — AI transcription, summarization, and concept extraction
- **Web Speech API** — text-to-speech accessibility feature
- **HTML/CSS** — injected overlay UI
---
 
## Setup
 
### 1. Clone the repo
```bash
git clone https://github.com/seabass42/pausepoint.git
cd pausepoint
```
 
### 2. Get a Gemini API key
1. Go to [aistudio.google.com](https://aistudio.google.com)
2. Click **Get API key** → **Create API key**
3. Copy your key
### 3. Load the extension
1. Open Chrome and go to `chrome://extensions`
2. Enable **Developer Mode** (top right)
3. Click **Load unpacked** and select the `pausepoint` folder
### 4. Add your API key
1. Click the PausePoint icon in your Chrome toolbar
2. Open settings
3. Paste your Gemini API key
4. Save
### 5. Start learning!
Navigate to any lecture video on YouTube, Canvas, or similar platforms. Play the video, then pause it — your summary will appear automatically.
 
---
 
## PausePoint's Origins
 
Going through my Data Structures and Algorithms class, the videos our professor had us watch for the class were very dense and could go fast, often resulting in my having to constantly rewind certain parts I didn't quite understand. It was then when I thought of PausePoint - an application where I wouldn't have to constantly rewind, instead I could pause the video when I get confused, and PausePoint would explain to me the concepts in detail. Ever since making PausePoint, my rewatch time on lecture videos is slim to none and I am able to retain the information much faster.
 
---
 
## Built By
 
Sebastian Ezpeleta-Stewart — 2026
