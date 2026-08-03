import React, { useEffect, useRef, useState } from 'react';
import { Video, AlertCircle } from 'lucide-react';

export const WebcamStream = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function getDevices() {
      try {
        await navigator.mediaDevices.getUserMedia({ video: true }); // Request permission first
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = allDevices.filter(device => device.kind === 'videoinput');
        setDevices(videoDevices);
        if (videoDevices.length > 0) {
          // Try to select OBS Virtual Camera automatically if available
          const obsDevice = videoDevices.find(d => d.label.toLowerCase().includes('obs'));
          setSelectedDeviceId(obsDevice ? obsDevice.deviceId : videoDevices[0].deviceId);
        }
      } catch (err) {
        console.error("Error enumerating devices", err);
        setError("Camera permission denied or no cameras found.");
      }
    }
    getDevices();
  }, []);

  useEffect(() => {
    if (!selectedDeviceId) return;

    let currentStream: MediaStream | null = null;

    async function startStream() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: { exact: selectedDeviceId } },
          audio: false
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        currentStream = stream;
        setError(null);
      } catch (err) {
        console.error("Error starting webcam stream", err);
        setError("Failed to start the selected camera.");
      }
    }

    startStream();

    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [selectedDeviceId]);

  return (
    <div className="w-full h-full flex flex-col bg-black relative">
      {error && (
        <div className="absolute z-10 flex flex-col items-center justify-center text-center p-6 bg-black/80 backdrop-blur-sm inset-0">
          <div className="flex flex-col items-center">
            <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
            <p className="text-neutral-300 font-medium max-w-sm">{error}</p>
          </div>
        </div>
      )}
      
      <div className="absolute top-4 right-4 z-20 bg-black/50 backdrop-blur-md p-2 rounded-lg border border-white/10">
        <div className="flex items-center gap-2">
          <Video className="w-4 h-4 text-neutral-400" />
          <select 
            className="bg-transparent text-white text-xs font-medium focus:outline-none max-w-[200px]"
            value={selectedDeviceId}
            onChange={(e) => setSelectedDeviceId(e.target.value)}
          >
            {devices.map(device => (
              <option key={device.deviceId} value={device.deviceId} className="bg-neutral-900">
                {device.label || `Camera ${device.deviceId.substring(0, 5)}...`}
              </option>
            ))}
          </select>
        </div>
      </div>

      <video 
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-contain"
      />
    </div>
  );
};
