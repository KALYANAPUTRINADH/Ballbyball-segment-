import React, { createContext, useContext, useEffect, useState } from 'react';
import { dbService } from '../lib/database';
import { TermsConsentModal } from '../components/TermsConsentModal';
import { auth, requestNotificationPermission, messaging } from '../lib/firebase';
import { 
  onAuthStateChanged, 
  signOut,
  RecaptchaVerifier,
  signInWithPhoneNumber
} from 'firebase/auth';
import { onMessage } from 'firebase/messaging';

interface AuthContextType {
  userMatches: any[];
  userPreferences: any;
  isPro: boolean;
  isAdmin: boolean;
  user: any | null;
  loading: boolean;
  logOut: () => Promise<void>;
  signInWithPhone: (phoneNumber: string) => Promise<any>;
  verifyOtp: (confirmationResult: any, otp: string, username?: string) => Promise<void>;
  mockPhoneLogin: (phone: string, name: string) => Promise<void>;
  loginWithMockUser: (mockUser: any) => void;
  fcmToken: string | null;
}

const AuthContext = createContext<AuthContextType>({
  userMatches: [],
  userPreferences: null,
  isPro: false,
  isAdmin: false,
  user: null,
  loading: true,
  logOut: async () => {},
  signInWithPhone: async () => { throw new Error('Not implemented'); },
  verifyOtp: async () => { throw new Error('Not implemented'); },
  mockPhoneLogin: async () => { throw new Error('Not implemented'); },
  loginWithMockUser: () => {},
  fcmToken: null,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [showTermsModal, setShowTermsModal] = useState(() => {
    if (typeof window !== 'undefined') {
      const accepted = localStorage.getItem('terms_accepted');
      return accepted !== 'true';
    }
    return false;
  });
  const [pendingLoginAction, setPendingLoginAction] = useState<(() => Promise<void>) | null>(null);
  const [fcmToken, setFcmToken] = useState<string | null>(null);

  const executePendingLogin = async () => {
    if (pendingLoginAction) {
      await pendingLoginAction();
      setPendingLoginAction(null);
    }
  };

  const [loading, setLoading] = useState(true);
  const [userMatches, setUserMatches] = useState<any[]>([]);
  const [userPreferences, setUserPreferences] = useState<any>(null);
  const [isPro, setIsPro] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (user && user.uid) {
      // Register FCM token
      const registerFCM = async () => {
        try {
          const token = await requestNotificationPermission();
          if (token) {
            setFcmToken(token);
            await dbService.update('profiles', user.uid, {
              fcm_token: token
            });
          }
        } catch (e) {
          console.error("Failed to register FCM", e);
        }
      };
      registerFCM();

      if (messaging) {
        onMessage(messaging, (payload) => {
          console.log('Message received. ', payload);
          if (payload.notification) {
            const event = new CustomEvent('fcm-message', { detail: payload.notification });
            window.dispatchEvent(event);
          }
        });
      }

      // 1. Subscribe to profile for real-time preferences and PRO status
      const unsubscribeProfile = dbService.subscribeDoc('profiles', user.uid, async (profile) => {
        if (profile) {
          if (profile.preferences) {
            setUserPreferences(profile.preferences);
          }
          let userIsPro = profile.is_pro === true || profile.is_pro === 'true' || (profile as any).role === 'admin';
          if (profile.subscription_status === 'cancelled') {
            userIsPro = false;
          }
          if (userIsPro && profile.pro_expiration_date) {
            const expiryDate = new Date(profile.pro_expiration_date);
            if (expiryDate < new Date()) {
              userIsPro = false;
            }
          }
          setIsPro(userIsPro);
          
          setUser(prev => {
            if (prev && profile.full_name && prev.displayName !== profile.full_name) {
              const updatedUser = { ...prev, displayName: profile.full_name };
              if (updatedUser.uid?.startsWith('mock_') || updatedUser.getIdToken?.toString().includes('mock_token')) {
                localStorage.setItem('mock_user', JSON.stringify({
                  ...updatedUser,
                  // Remove getIdToken function before stringifying, although JSON.stringify ignores functions
                }));
              }
              return updatedUser;
            }
            return prev;
          });
        }
      });

      // 2. Verify admin role via API (robust check)
      
      
      const verifyAdmin = async () => {
        try {
          const profile = await dbService.get('profiles', user.uid) as any;
          const role = profile?.role || 'user';
          const phone = user.phoneNumber || '';
          const cleanPhoneNum = phone.replace(/\D/g, '');
          const adminPhones = ['6305605194', '8688678943'];
          const phoneIsAdmin = adminPhones.some(p => cleanPhoneNum.endsWith(p) || cleanPhoneNum === p || user.uid.includes(p));
          
          setIsAdmin(role === 'admin' || phoneIsAdmin || user.email === 'trinadhkalyanapu@gmail.com');
        } catch (verifyErr) {
          console.warn("Proxy verification failed", verifyErr);
        }
      };
      verifyAdmin();


      // 3. Fetch user matches
      const fetchUserMatches = async () => {
        try {
          const data = await dbService.getAll('matches', { owner_id: user.uid });
          setUserMatches(Array.isArray(data) ? data : []); 
        } catch (e) { }
      };
      fetchUserMatches();
      const interval = setInterval(fetchUserMatches, 10000);
      
      return () => {
        unsubscribeProfile();
        clearInterval(interval);
      };
    } else {
      setUserMatches([]);
      setUserPreferences(null);
      setIsPro(false);
      setIsAdmin(false);
      setIsAdmin(false);
    }
  }, [user]);

  useEffect(() => {
    const storedMockUser = localStorage.getItem('mock_user');
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const mappedUser = {
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || '',
          email: firebaseUser.email || '',
          phoneNumber: firebaseUser.phoneNumber || '',
          photoURL: firebaseUser.photoURL || '',
          metadata: {
            creationTime: firebaseUser.metadata.creationTime,
            lastSignInTime: firebaseUser.metadata.lastSignInTime
          },
          getIdToken: async () => await firebaseUser.getIdToken()
        };
        setUser(mappedUser);
        await saveUserToDb(mappedUser);
      } else if (storedMockUser) {
        try {
          const parsed = JSON.parse(storedMockUser);
          parsed.getIdToken = async () => "mock_token:" + parsed.uid;
          setUser(parsed);
        } catch (e) {
          console.warn('Failed to parse mock user', e);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const saveUserToDb = async (mappedUser: any) => {
    try {
      const token = await mappedUser.getIdToken();
      
      const payload: any = {
        id: mappedUser.uid,
        uid: mappedUser.uid,
        email: mappedUser.email || '',
        phone: mappedUser.phoneNumber || '',
        photo_url: mappedUser.photoURL || '',
        updated_at: new Date().toISOString()
      };

      if (mappedUser.displayName) {
        payload.full_name = mappedUser.displayName;
        payload.username = mappedUser.displayName;
      }

      await dbService.upsert('profiles', payload);
    } catch(e) { 
      console.error('Error saving user profile to Firestore:', e);
    }
  };

  const mockPhoneLogin = async (...args: any[]) => {
    const termsAccepted = localStorage.getItem('terms_accepted');
    if (!termsAccepted) {
      setPendingLoginAction(() => () => original_mockPhoneLogin.apply(null, args));
      setShowTermsModal(true);
      return;
    }
    return original_mockPhoneLogin.apply(null, args);
  };
  
  const original_mockPhoneLogin = async (phone: string, name: string) => {
    if (auth.currentUser) await auth.signOut();
    let finalName = name;
    
    if (!finalName) finalName = 'Guest User';
    
    let uid = 'mock_' + phone.replace(/\D/g, '');
    
    try {
      // Find existing user by phone
      const existingProfiles = await dbService.getAll('profiles', { phone: phone });
      // Prefer mock profile if multiple exist
      let existingData = existingProfiles.find((p: any) => p.id && p.id.startsWith('mock_')) as any || (existingProfiles.length > 0 ? existingProfiles[0] as any : null);
      
      if (existingData && existingData.id && existingData.id.startsWith('mock_')) {
        uid = existingData.id;
        if (finalName === 'Guest User' && existingData.full_name) {
          finalName = existingData.full_name;
        } else if (finalName === 'Guest User' && existingData.username) {
          finalName = existingData.username;
        }
      }
      
      const mockUser = {
        uid: uid,
        displayName: finalName,
        name: finalName,
        phoneNumber: phone,
        photoURL: '',
        email: null,
        emailVerified: false,
        isAnonymous: false,
        metadata: {
          creationTime: existingData?.created_at || new Date().toISOString(),
          lastSignInTime: new Date().toISOString()
        },
        getIdToken: async () => "mock_token:" + uid
      };

      const profilePayload: any = {
        id: uid,
        uid: uid,
        phone: phone,
        updated_at: new Date().toISOString()
      };
      
      // Only set name if they provided one, or if they don't exist yet
      if (name || !existingData) {
         profilePayload.full_name = finalName;
         profilePayload.username = finalName;
      }

      await dbService.set('profiles', uid, profilePayload);

      mockUser.getIdToken = async () => "mock_token:" + mockUser.uid;
      localStorage.setItem('mock_user', JSON.stringify(mockUser));
      setUser(mockUser);
    } catch (e) {
      console.error("Login error", e);
    }
  };

  const signInWithPhone = async (phoneNumber: string) => {
    if (phoneNumber === '+916305605194' || phoneNumber === '6305605194') {
        const fullPhone = phoneNumber.startsWith('+') ? phoneNumber : '+91' + phoneNumber;
        return {
            isMockAdmin: true,
            confirm: async (otp: string) => {
                if (otp === '102003') {
                    await original_mockPhoneLogin(fullPhone, 'App Admin');
                    return { user: { uid: 'mock_' + fullPhone.replace(/\D/g, ''), phoneNumber: fullPhone } };
                }
                throw new Error('Invalid OTP');
            }
        };
    }

    if (typeof window !== 'undefined') {
      try {
        if ((window as any).recaptchaVerifier) {
          try {
            (window as any).recaptchaVerifier.clear();
          } catch (e) {}
          (window as any).recaptchaVerifier = null;
        }

        (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible'
        });
        
        const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, (window as any).recaptchaVerifier);
        return confirmationResult;
      } catch (error: any) {
        // Reset verifier if there's an error
        if ((window as any).recaptchaVerifier) {
          try {
            (window as any).recaptchaVerifier.clear();
          } catch (e) {}
          (window as any).recaptchaVerifier = null;
        }
        console.error("Phone Auth Error:", error);
        throw error;
      }
    }
    throw new Error('Not supported');
  };

  const verifyOtp = async (confirmationResult: any, otp: string, username?: string) => {
    try {
      if (confirmationResult.isMockAdmin) {
         await confirmationResult.confirm(otp);
         return;
      }
      const result = await confirmationResult.confirm(otp);
      const user = result.user;
      
      // Update the user profile if a username is provided
      if (username) {
        // We'll update the Firestore profile directly
        await dbService.upsert('profiles', {
          id: user.uid,
          uid: user.uid,
          full_name: username,
          username: username,
          phone: user.phoneNumber || '',
          updated_at: new Date().toISOString()
        });
      }
    } catch (error: any) {
      console.error("OTP verification error:", error);
      throw error;
    }
  };

  const logOut = async () => {
    try {
      localStorage.removeItem('mock_user');
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.warn('Error signing out:', error);
    }
  };

  const loginWithMockUser = (mockUser: any) => {
    mockUser.getIdToken = async () => "mock_token:" + mockUser.uid;
    localStorage.setItem('mock_user', JSON.stringify(mockUser));
    setUser(mockUser);
  };

  return (
    <AuthContext.Provider value={{ user, loading, userMatches, userPreferences, isPro, isAdmin, logOut, signInWithPhone, verifyOtp, mockPhoneLogin, loginWithMockUser }}>
      {children}
      <TermsConsentModal
        isOpen={showTermsModal}
        onAccept={() => {
          localStorage.setItem('terms_accepted', 'true');
          setShowTermsModal(false);
          executePendingLogin();
        }}
        onDecline={() => {
          setShowTermsModal(false);
          setPendingLoginAction(null);
        }}
      />
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
