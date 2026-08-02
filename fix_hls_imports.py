import re

with open('src/components/LiveScoring.tsx', 'r') as f:
    content = f.read()
if "import { streamManagement }" not in content:
    content = content.replace("import React, { useState, useEffect, useRef } from 'react';", "import React, { useState, useEffect, useRef } from 'react';\nimport { streamManagement } from '../services/StreamManagementAPI';")
with open('src/components/LiveScoring.tsx', 'w') as f:
    f.write(content)

