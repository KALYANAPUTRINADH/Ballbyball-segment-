import React, { useEffect, useState } from 'react';
import { Camera, Mic, AlertCircle, CheckCircle, HelpCircle } from 'lucide-react';

export const DeviceDiagnostics: React.FC = () => {
  const [cameraState, setCameraState] = useState<'granted' | 'denied' | 'prompt' | 'unknown'>('unknown');
  const [micState, setMicState] = useState<'granted' | 'denied' | 'prompt' | 'unknown'>('unknown');
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkPermissions = async () => {
      setIsChecking(true);
      try {
        if (navigator.permissions && navigator.permissions.query) {
          try {
            const camPerm = await navigator.permissions.query({ name: 'camera' as PermissionName });
            setCameraState(camPerm.state);
            camPerm.onchange = () => setCameraState(camPerm.state);
          } catch (e) {
            console.warn('Camera permission query not supported', e);
          }
          
          try {
            const micPerm = await navigator.permissions.query({ name: 'microphone' as PermissionName });
            setMicState(micPerm.state);
            micPerm.onchange = () => setMicState(micPerm.state);
          } catch (e) {
            console.warn('Microphone permission query not supported', e);
          }
        }
        
        if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
          const devs = await navigator.mediaDevices.enumerateDevices();
          setDevices(devs);
          // If labels are empty, permissions haven't been granted
          if (devs.length > 0 && devs[0].label === '') {
             if (cameraState === 'unknown') setCameraState('prompt');
             if (micState === 'unknown') setMicState('prompt');
          } else if (devs.length > 0 && devs[0].label !== '') {
             if (cameraState === 'unknown') setCameraState('granted');
             if (micState === 'unknown') setMicState('granted');
          }
        }
      } catch (error) {
        console.error('Error checking permissions:', error);
      } finally {
        setIsChecking(false);
      }
    };
    
    checkPermissions();
  }, []);

  const requestAccess = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      // Rerun check
      const devs = await navigator.mediaDevices.enumerateDevices();
      setDevices(devs);
      setCameraState('granted');
      setMicState('granted');
    } catch (err: any) {
      if (err.message && err.message.includes('Could not start video source')) {
        try {
          await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          const devs = await navigator.mediaDevices.enumerateDevices();
          setDevices(devs);
          setCameraState('granted');
          setMicState('denied');
        } catch (e2) {
          console.error('Failed to get user media (no audio)', e2);
          setCameraState('denied');
          setMicState('denied');
        }
      } else {
        console.error('Failed to get user media', err);
        setCameraState('denied');
        setMicState('denied');
      }
    }
  };

  const getStatusIcon = (state: string) => {
    if (state === 'granted') return <CheckCircle className="w-5 h-5 text-green-500" />;
    if (state === 'denied') return <AlertCircle className="w-5 h-5 text-red-500" />;
    return <HelpCircle className="w-5 h-5 text-amber-500" />;
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 my-4">
      <h3 className="font-bold text-slate-800 mb-4 flex items-center">
        <AlertCircle className="w-5 h-5 mr-2 text-slate-500" />
        Device & Permission Diagnostics
      </h3>
      
      {isChecking ? (
        <div className="text-sm text-slate-500">Checking device status...</div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-slate-100 shadow-sm">
            <div className="flex items-center space-x-3">
              <Camera className="w-5 h-5 text-slate-400" />
              <div>
                <div className="text-sm font-semibold text-slate-700">Camera Access</div>
                <div className="text-xs text-slate-500 capitalize">{cameraState}</div>
              </div>
            </div>
            {getStatusIcon(cameraState)}
          </div>
          
          <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-slate-100 shadow-sm">
            <div className="flex items-center space-x-3">
              <Mic className="w-5 h-5 text-slate-400" />
              <div>
                <div className="text-sm font-semibold text-slate-700">Microphone Access</div>
                <div className="text-xs text-slate-500 capitalize">{micState}</div>
              </div>
            </div>
            {getStatusIcon(micState)}
          </div>

          <div className="p-3 bg-white rounded-lg border border-slate-100 shadow-sm">
             <div className="text-sm font-semibold text-slate-700 mb-2">Detected Devices</div>
             {devices.length === 0 ? (
               <div className="text-xs text-slate-500">No devices found.</div>
             ) : (
               <ul className="text-xs text-slate-500 space-y-1">
                 {devices.filter(d => d.kind === 'videoinput').map(d => (
                   <li key={d.deviceId}>📷 {d.label || 'Unknown Camera'}</li>
                 ))}
                 {devices.filter(d => d.kind === 'audioinput').map(d => (
                   <li key={d.deviceId}>🎤 {d.label || 'Unknown Microphone'}</li>
                 ))}
               </ul>
             )}
          </div>

          {(cameraState === 'denied' || micState === 'denied') && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-xs leading-relaxed">
              <p className="font-bold mb-1">Access Denied</p>
              <p>Your browser is blocking access to your camera and microphone. To fix this:</p>
              <ol className="list-decimal pl-4 mt-2 space-y-1">
                <li>Click the lock icon (🔒) or camera icon next to the URL in your browser's address bar.</li>
                <li>Find "Camera" and "Microphone" in the site settings.</li>
                <li>Change the permission to "Allow".</li>
                <li>Refresh the page.</li>
                <li>If using the embedded preview, try opening the app in a new tab using the "Open App" button.</li>
              </ol>
            </div>
          )}

          {(cameraState === 'prompt' || micState === 'prompt' || cameraState === 'unknown') && (
            <button 
              onClick={requestAccess}
              className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors"
            >
              Request Permissions
            </button>
          )}
        </div>
      )}
    </div>
  );
};
