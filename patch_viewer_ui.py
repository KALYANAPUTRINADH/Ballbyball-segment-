import re
with open('src/components/MatchStreamer.tsx', 'r') as f:
    content = f.read()

# Make the video visible for viewers watching WebRTC
old_video = """<video 
             ref={videoRef}
             className={`absolute inset-0 w-full h-full object-cover ${!isOwner ? 'hidden' : ''}`}
            playsInline 
            muted 
          />"""

new_video = """<video 
             ref={videoRef}
             className={`absolute inset-0 w-full h-full object-cover`}
            playsInline 
            muted={isOwner} 
          />"""

content = content.replace(old_video, new_video)

# Fix the Stream Not Available block to only show if there is no WebRTC ID either
old_not_avail = "{(!isOwner && !matchData?.youtubeUrl) && ("
new_not_avail = "{(!isOwner && !matchData?.youtubeUrl && !matchData?.webrtc_peer_id) && ("

content = content.replace(old_not_avail, new_not_avail)

with open('src/components/MatchStreamer.tsx', 'w') as f:
    f.write(content)
