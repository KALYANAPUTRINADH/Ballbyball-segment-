import re

with open('src/components/MatchStreamer.tsx', 'r') as f:
    content = f.read()

# Replace the error handling in connectPhysicalObs to give more verbose output
old_catch = """    } catch (e: any) {
      console.error(e);
      setObsConnectionStatus('error');
      addStreamLog(`OBS WebSocket failed: ${e.message || 'Check IP/Port or Password'}`);
    }"""

new_catch = """    } catch (e: any) {
      console.error("OBS Connection Catch Error:", e);
      setObsConnectionStatus('error');
      let msg = e.message || 'Check IP/Port or Password';
      if (e.code === 4009) msg = 'Authentication failed (Incorrect Password)';
      else if (e.code === 4010) msg = 'OBS requires a password, but none was provided';
      else if (e.code === 4011) msg = 'OBS does not require a password, but one was provided';
      else if (e instanceof Event || e.name === 'ErrorEvent') msg = 'Network/Browser block (Try allowing Insecure Content for ws:// or check if OBS is running)';
      
      addStreamLog(`OBS WebSocket failed: ${msg}`);
    }"""

content = content.replace(old_catch, new_catch)

with open('src/components/MatchStreamer.tsx', 'w') as f:
    f.write(content)
print("Updated OBS error logging")
