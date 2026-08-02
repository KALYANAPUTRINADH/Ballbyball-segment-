import { db, auth } from './firebase';
import LZString from 'lz-string';
import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, setDoc, onSnapshot, orderBy } from 'firebase/firestore';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  
  if (errInfo.error.toLowerCase().includes('permission') || errInfo.error.toLowerCase().includes('insufficient')) {
    console.error('CRITICAL SECURITY ERROR: Firestore permission denied.', JSON.stringify(errInfo));
  } else {
    console.warn('Firestore Error: ', JSON.stringify(errInfo));
  }
  return errInfo;
}

const NO_COMPRESS_KEYS = ["id","owner_id","created_by","ownerId","author_id","user_id","status","sport_type","sportType","phone","email","role","teamId","name","type","created_at","updated_at","date","time","searchType","is_pro","pro_expiration_date","venue","title","team_a","team_b","teamA","teamB","match_id","tournament_id","player_id","club_id","mobileNumber","username","displayName"];

function compressValue(val: any): any {
  if (val !== null && typeof val === 'object' && !(val instanceof Date)) {
    const str = JSON.stringify(val);
    if (str.length > 300) {
      const compressed = LZString.compressToBase64(str);
      if (compressed.length < str.length) {
         return { __c: true, d: compressed, t: 'o' };
      }
    }
  } else if (typeof val === 'string' && val.length > 300) {
    const compressed = LZString.compressToBase64(val);
    if (compressed.length < val.length) {
       return { __c: true, d: compressed, t: 's' };
    }
  }
  return val;
}

function sanitizeAndCompressPayload(payload: any, isRoot = true): any {
  if (payload === undefined) return undefined;
  if (!payload || typeof payload !== 'object' || payload instanceof Date) return payload;
  
  if (Array.isArray(payload)) {
    if (isRoot) {
      return payload.map(item => sanitizeAndCompressPayload(item, false));
    } else {
      const cleanedArray = payload.map(item => sanitizeAndCompressPayload(item, false)).filter(item => item !== undefined);
      return compressValue(cleanedArray);
    }
  }
  
  const sanitized: any = {};
  Object.keys(payload).forEach(key => {
    const value = payload[key];
    if (value !== undefined) {
      if (isRoot) {
        if (NO_COMPRESS_KEYS.includes(key)) {
           sanitized[key] = sanitizeAndCompressPayload(value, false);
        } else {
           // We clean undefined values first
           const cleaned = sanitizeAndCompressPayload(value, false);
           sanitized[key] = compressValue(cleaned);
        }
      } else {
        sanitized[key] = sanitizeAndCompressPayload(value, false);
      }
    }
  });
  
  if (!isRoot) {
    return sanitized; // Will be compressed by parent's compressValue if large
  }
  
  return sanitized;
}

function decompressValue(val: any): any {
  if (val && typeof val === 'object' && val.__c === true && val.d) {
    const decompressed = LZString.decompressFromBase64(val.d);
    if (decompressed !== null) {
      if (val.t === 'o') {
        try {
          return JSON.parse(decompressed);
        } catch (e) {
          return decompressed;
        }
      } else {
        return decompressed;
      }
    }
  }
  if (Array.isArray(val)) {
    return val.map(decompressValue);
  } else if (val !== null && typeof val === 'object' && !(val instanceof Date)) {
    const res: any = {};
    for (const k of Object.keys(val)) {
      res[k] = decompressValue(val[k]);
    }
    return res;
  }
  return val;
}

function sanitizePayload(payload: any): any {
  return sanitizeAndCompressPayload(payload, true);
}

function decompressPayload(payload: any): any {
  if (!payload || typeof payload !== 'object') return payload;
  return decompressValue(payload);
}

export const dbService = {
  subscribe(table: string, filters: Record<string, any>, callback: (data: any[]) => void, orderField?: string) {
    const colRef = collection(db, table);
    let q = query(colRef);
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        q = query(q, where(key, '==', value));
      }
    });
    if (orderField) {
      q = query(q, orderBy(orderField, 'asc'));
    }
    return onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => decompressPayload({ id: doc.id, ...doc.data() }));
      callback(items);
    }, (error) => {
      console.error(`Firestore onSnapshot failed for ${table}`, error);
    });
  },
  subscribeDoc(table: string, id: string, callback: (data: any) => void) {
    const docRef = doc(db, table, id);
    return onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        callback(decompressPayload({ id: snapshot.id, ...snapshot.data() }));
      } else {
        callback(null);
      }
    }, (error) => {
      console.error(`Firestore subscribeDoc failed for ${table}/${id}`, error);
    });
  },
  async get(table: string, id: string) {
    try {
      const docRef = doc(db, table, id);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? decompressPayload({ id: docSnap.id, ...docSnap.data() }) : null;
    } catch (e) {
      if (e instanceof Error && (e.message.includes('permission') || e.message.includes('insufficient'))) {
        handleFirestoreError(e, OperationType.GET, `${table}/${id}`);
      }
      throw e;
    }
  },
  async getAll(table: string, filters?: Record<string, any>) {
    try {
      const colRef = collection(db, table);
      let q = query(colRef);
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) {
            q = query(q, where(key, '==', value));
          }
        });
      }
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => decompressPayload({ id: doc.id, ...doc.data() }));
    } catch (e) {
      if (e instanceof Error && (e.message.includes('permission') || e.message.includes('insufficient'))) {
        handleFirestoreError(e, OperationType.LIST, table);
      }
      throw e;
    }
  },
  async create(table: string, payload: any) {
    const sanitized = sanitizePayload(payload);
    try {
      if (sanitized.id) {
        const idStr = String(sanitized.id);
        const docRef = doc(db, table, idStr);
        await setDoc(docRef, sanitized);
        return { id: idStr, ...sanitized };
      }
      const colRef = collection(db, table);
      const docRef = await addDoc(colRef, sanitized);
      return { id: docRef.id, ...sanitized };
    } catch (e) {
      if (e instanceof Error && (e.message.includes('permission') || e.message.includes('insufficient'))) {
        handleFirestoreError(e, OperationType.CREATE, table);
      }
      throw e;
    }
  },
  async update(table: string, id: string, payload: any) {
    const sanitized = sanitizePayload(payload);
    try {
      const docRef = doc(db, table, id);
      await updateDoc(docRef, sanitized);
      return { id, ...sanitized };
    } catch (e) {
      if (e instanceof Error && (
        e.message.includes('not-found') || 
        e.message.includes('not found') || 
        e.message.includes('No document to update') || 
        e.message.includes('NOT_FOUND')
      )) {
        try {
          const docRef = doc(db, table, id);
          await setDoc(docRef, sanitized, { merge: true });
          return { id, ...sanitized };
        } catch (fallbackError) {
          throw fallbackError;
        }
      }
      if (e instanceof Error && (e.message.includes('permission') || e.message.includes('insufficient'))) {
        handleFirestoreError(e, OperationType.UPDATE, `${table}/${id}`);
      }
      throw e;
    }
  },
  async upsert(table: string, payload: any) {
    const sanitized = sanitizePayload(payload);
    try {
      if (!sanitized.id) throw new Error('Upsert requires an ID');
      const docRef = doc(db, table, sanitized.id);
      await setDoc(docRef, sanitized, { merge: true });
      return { id: sanitized.id, ...sanitized };
    } catch (e) {
      if (e instanceof Error && (e.message.includes('permission') || e.message.includes('insufficient'))) {
        handleFirestoreError(e, OperationType.WRITE, table);
      }
      throw e;
    }
  },
  async remove(table: string, id: string) {
    try {
      const docRef = doc(db, table, id);
      await deleteDoc(docRef);
      return true;
    } catch (e) {
      if (e instanceof Error && (e.message.includes('permission') || e.message.includes('insufficient'))) {
        handleFirestoreError(e, OperationType.DELETE, `${table}/${id}`);
      }
      return false;
    }
  },
  async set(table: string, id: string, payload: any) {
    const sanitized = sanitizePayload(payload);
    try {
      const docRef = doc(db, table, id);
      await setDoc(docRef, sanitized, { merge: true });
      return { id, ...sanitized };
    } catch (e) {
      if (e instanceof Error && (e.message.includes('permission') || e.message.includes('insufficient'))) {
        handleFirestoreError(e, OperationType.WRITE, `${table}/${id}`);
      }
      throw e;
    }
  }
};
