import re

with open('src/components/MatchStreamer.tsx', 'r') as f:
    content = f.read()

# Add imports
import_str = """
import { Peer } from 'peerjs';
import { streamManagement } from '../services/StreamManagementAPI';
"""
content = content.replace("import { dbService } from '../lib/database';", "import { dbService } from '../lib/database';\n" + import_str)

# Add state variables
state_vars = """
  const peerRef = useRef<Peer | null>(null);
  const [viewerConnections, setViewerConnections] = useState<number>(0);
"""
content = content.replace("  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');", "  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');\n" + state_vars)

with open('src/components/MatchStreamer.tsx', 'w') as f:
    f.write(content)
print("Fixed MatchStreamer")

