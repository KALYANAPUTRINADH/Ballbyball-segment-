import re

with open('src/components/LiveScoring.tsx', 'r') as f:
    content = f.read()

# 1. Add state for webrtcPeerId
state_insert = """  const [isReceivingWebRTC, setIsReceivingWebRTC] = useState(false);
  const [webrtcPeerId, setWebrtcPeerId] = useState<string | null>(null);"""
content = content.replace("  const [isReceivingWebRTC, setIsReceivingWebRTC] = useState(false);", state_insert)

# 2. Add it to subscribeToMatch
subscribe_old = """          if (data.youtubeUrl !== undefined) setYoutubeUrl(data.youtubeUrl);"""
subscribe_new = """          if (data.youtubeUrl !== undefined) setYoutubeUrl(data.youtubeUrl);
          if (data.webrtc_peer_id !== undefined) setWebrtcPeerId(data.webrtc_peer_id);"""
content = content.replace(subscribe_old, subscribe_new)

# 3. Update the useEffect for WebRTC
effect_old = """  // WebRTC Viewer Logic
  useEffect(() => {
    if (!matchData?.webrtc_peer_id || isOwner) {"""
effect_new = """  // WebRTC Viewer Logic
  useEffect(() => {
    if (!webrtcPeerId || isOwner) {"""
content = content.replace(effect_old, effect_new)

effect_old_2 = """      const conn = peer.call(matchData.webrtc_peer_id, dummyStream);"""
effect_new_2 = """      const conn = peer.call(webrtcPeerId, dummyStream);"""
content = content.replace(effect_old_2, effect_new_2)

effect_old_3 = """  }, [matchData?.webrtc_peer_id, isOwner]);"""
effect_new_3 = """  }, [webrtcPeerId, isOwner]);"""
content = content.replace(effect_old_3, effect_new_3)

with open('src/components/LiveScoring.tsx', 'w') as f:
    f.write(content)
print("Added webrtcPeerId state")
