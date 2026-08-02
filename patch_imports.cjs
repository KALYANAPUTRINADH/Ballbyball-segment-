const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const target = `import { initializeApp as initClientApp } from 'firebase/app';
import { 
  getFirestore as getClientFirestore, 
  collection as clientCollection, 
  doc as clientDoc, 
  getDoc as clientGetDoc, 
  getDocs as clientGetDocs, 
  setDoc as clientSetDoc, 
  updateDoc as clientUpdateDoc, 
  deleteDoc as clientDeleteDoc, 
  addDoc as clientAddDoc, 
  query as clientQuery, 
  where as clientWhere, 
  limit as clientLimit,
  serverTimestamp as clientServerTimestamp,
  orderBy as clientOrderBy,
  writeBatch as clientWriteBatch
} from 'firebase/firestore';`;

code = code.replace(target, '');
code = code.replace(`const clientApp = initClientApp(firebaseConfig);\nconst firestoreInstance = getClientFirestore(clientApp, firebaseConfig.firestoreDatabaseId);\n`, '');

fs.writeFileSync('server.ts', code);
