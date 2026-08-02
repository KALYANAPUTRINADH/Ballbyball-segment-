const fs = require('fs');
let code = fs.readFileSync('src/components/MatchStreamer.tsx', 'utf-8');

// Inside startCamera, we want to bypass getUserMedia if !isOwner
code = code.replace(
  "if (useExternalCamera) {",
  "if (useExternalCamera || !isOwner) {\n        // Viewer mode: Simulate receiving the live stream\n        if (!isOwner) {\n            setExternalCameraUrl('https://assets.mixkit.co/videos/preview/mixkit-cricket-batsman-playing-a-shot-34281-large.mp4');\n        }\n"
);

// We need to hide the Broadcast Control Center Sidebar and the bottom controls if !isOwner
code = code.replace(
  "{!showControlDrawer && (",
  "{isOwner && !showControlDrawer && ("
);

code = code.replace(
  "showControlDrawer ? 'translate-x-0' : 'translate-x-full'",
  "(isOwner && showControlDrawer) ? 'translate-x-0' : 'translate-x-full'"
);

code = code.replace(
  "{/* Controls */}",
  "{/* Controls */}\n      {isOwner && ("
);

code = code.replace(
  "        {!isLive && (\n           <p className=\"text-center text-slate-500 text-xs mt-6\">Ensure your device has at least 50% battery before starting.</p>\n        )}\n      </div>\n    </div>\n  );\n}",
  "        {!isLive && (\n           <p className=\"text-center text-slate-500 text-xs mt-6\">Ensure your device has at least 50% battery before starting.</p>\n        )}\n      </div>\n      )}\n    </div>\n  );\n}"
);

fs.writeFileSync('src/components/MatchStreamer.tsx', code);
console.log("Success");
