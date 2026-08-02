# Streamlify

Streamlify is a fully integrated Cricket Live Streaming and Live Scoring application with built-in OBS Studio broadcasting capabilities.

## Features
- **Live Video Streaming:** Built-in WebRTC camera streaming and RTMP Server for OBS integration.
- **Dynamic Scorecards:** Glassmorphism scorecards injected directly into the live video feed.
- **YouTube Integration:** Multi-stream seamlessly to YouTube Live.
- **Mobile Friendly:** Fully responsive live scoring interface.

## Local Development
To run this application locally and connect to OBS:
```bash
npm install
npm run dev
```

## Production Deployment (AWS EC2)
To allow OBS Studio to stream directly to this application via RTMP, you must deploy it on a VPS (like AWS EC2) since the AI Studio preview environment blocks port 1935.
Please refer to the `deploy-to-ec2.md` file for step-by-step instructions!
