import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { apiRequest } from '../lib/apiClient';
import {
 ensureProfile,
 getAuthErrorMessage,
 type AuthUserRecord,
 type ProfileRow,
} from '../lib/customerPortal';

type AuthResult = {
 success: boolean;
 message?: string;
 requiresEmailConfirmation?: boolean;
};

type SignInInput = {
 email: string;
 password: string;
};

type SignUpInput = {
 fullName: string;
 email: string;
 phone: string;
 password: string;
 emailRedirectTo?: string;
};

type SaveProfileInput = {
 fullName?: string;
 email?: string;
 phone?: string;
};

type Session = {
 user: AuthUserRecord;
};

type AuthContextValue = {
 user: AuthUserRecord | null;
 session: Session | null;
 profile: ProfileRow | null;
 loading: boolean;
 authBusy: boolean;
 signInWithEmail: (input: SignInInput) => Promise<AuthResult>;
 signUpWithEmail: (input: SignUpInput) => Promise<AuthResult>;
 signOut: () => Promise<void>;
 refreshProfile: () => Promise<void>;
 saveProfile: (input: SaveProfileInput) => Promise<ProfileRow | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function syncProfile(currentUser: AuthUserRecord | null) {
 if (!currentUser) {
 return null;
 }

 return ensureProfile(currentUser);
}

export function AuthProvider({ children }: { children: ReactNode }) {
 const [session, setSession] = useState<Session | null>(null);
 const [user, setUser] = useState<AuthUserRecord | null>(null);
 const [profile, setProfile] = useState<ProfileRow | null>(null);
 const [loading, setLoading] = useState(true);
 const [authBusy, setAuthBusy] = useState(false);

 useEffect(() => {
 let active = true;

 const initialiseSession = async () => {
 const data = await apiRequest<{
 user: AuthUserRecord | null;
 profile: ProfileRow | null;
 }>('auth.me');

 if (!active) {
 return;
 }

 const nextUser = data.user ?? null;
 const nextSession = nextUser ? { user: nextUser } : null;

 setSession(nextSession);
 setUser(nextUser);

 if (!nextUser) {
 setProfile(null);
 setLoading(false);
 return;
 }

 setProfile(data.profile ?? null);
 };

  void (async () => {
    try {
      await initialiseSession();
    } catch (error) {
      console.error('Failed to load API session', error);
      if (active) {
        setUser(null);
        setSession(null);
        setProfile(null);
      }
    } finally {
      // Always unblock loading, even if catch itself throws
      if (active) setLoading(false);
    }
  })();

 return () => {
 active = false;
 };
 }, []);

 const refreshProfile = async () => {
 if (!user) {
 setProfile(null);
 return;
 }

 const nextProfile = await syncProfile(user);
 setProfile(nextProfile);
 };

 const saveProfile = async (input: SaveProfileInput) => {
 if (!user) {
 return null;
 }

 const nextProfile = await ensureProfile(user, input);
 setProfile(nextProfile);
 return nextProfile;
 };

 const signInWithEmail = async (input: SignInInput) => {
 setAuthBusy(true);

 try {
 const data = await apiRequest<{
 user: AuthUserRecord;
 profile: ProfileRow | null;
 }>('auth.login', {
 email: input.email.trim(),
 password: input.password,
 });

 setUser(data.user);
 setSession({ user: data.user });
 setProfile(data.profile);

 return { success: true };
 } catch (error) {
 return {
 success: false,
 message: getAuthErrorMessage(error instanceof Error ? error.message : ''),
 };
 } finally {
 setAuthBusy(false);
 }
 };

 const signUpWithEmail = async (input: SignUpInput) => {
 setAuthBusy(true);

 try {
 const data = await apiRequest<{
 user: AuthUserRecord;
 profile: ProfileRow | null;
 }>('auth.register', {
 email: input.email.trim(),
 password: input.password,
 fullName: input.fullName.trim(),
 phone: input.phone.trim(),
 });

 setUser(data.user);
 setSession({ user: data.user });
 setProfile(data.profile);
 return { success: true };
 } catch (error) {
 return {
 success: false,
 message: getAuthErrorMessage(error instanceof Error ? error.message : ''),
 };
 } finally {
 setAuthBusy(false);
 }
 };

 const signOut = async () => {
 await apiRequest('auth.logout');
 setUser(null);
 setSession(null);
 setProfile(null);
 };

 const value = useMemo<AuthContextValue>(
 () => ({
 user,
 session,
 profile,
 loading,
 authBusy,
 signInWithEmail,
 signUpWithEmail,
 signOut,
 refreshProfile,
 saveProfile,
 }),
 [user, session, profile, loading, authBusy]
 );

 return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
 const context = useContext(AuthContext);

 if (!context) {
 throw new Error('useAuth must be used within an AuthProvider');
 }

 return context;
}
