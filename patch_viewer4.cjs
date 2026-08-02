const fs = require('fs');
let code = fs.readFileSync('src/components/MatchStreamer.tsx', 'utf-8');

const target = `
      if (useExternalCamera || !isOwner) {
        // Viewer mode: Simulate receiving the live stream
        if (!isOwner) {
            setExternalCameraUrl('https://assets.mixkit.co/videos/preview/mixkit-cricket-batsman-playing-a-shot-34281-large.mp4');
        }

        if (stream) {
          stream.getTracks().forEach(track => track.stop());
          setStream(null);
        }
        if (videoRef.current) {
          videoRef.current.srcObject = null;
          videoRef.current.crossOrigin = "anonymous";
          videoRef.current.src = externalCameraUrl;
          videoRef.current.loop = true;
          await videoRef.current.play();
`;

const replacement = `
      if (useExternalCamera || !isOwner) {
        // Viewer mode: Simulate receiving the live stream
        const targetUrl = !isOwner ? 'https://assets.mixkit.co/videos/preview/mixkit-cricket-batsman-playing-a-shot-34281-large.mp4' : externalCameraUrl;

        if (stream) {
          stream.getTracks().forEach(track => track.stop());
          setStream(null);
        }
        if (videoRef.current) {
          videoRef.current.srcObject = null;
          videoRef.current.crossOrigin = "anonymous";
          videoRef.current.src = targetUrl;
          videoRef.current.loop = true;
          await videoRef.current.play();
`;

code = code.replace(target, replacement);

fs.writeFileSync('src/components/MatchStreamer.tsx', code);
console.log("Success");
