"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { auth } from '@/lib/firebase/firebase';
import { useRouter, usePathname } from 'next/navigation';
import { isProfileComplete } from '@/lib/firebase/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setUser(user);
      
      if (user) {
        // Check if profile is complete
        const profileComplete = await isProfileComplete(user.uid);
        
        // If profile is not complete and not already on profile setup page
        if (!profileComplete && pathname !== '/profile-setup') {
          router.push('/profile-setup');
        }
        // If profile is complete and on profile setup page
        else if (profileComplete && pathname === '/profile-setup') {
          router.push('/dashboard');
        }
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [pathname]);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
} 