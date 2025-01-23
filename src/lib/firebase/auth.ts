import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  UserCredential
} from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db, googleProvider } from './firebase';

export type UserData = {
  uid: string;
  email: string | null;
  firstName: string;
  lastName: string;
  createdAt: Date;
  // Profile fields
  username?: string;
  university?: string;
  phoneNumber?: string;
  profileComplete?: boolean;
};

// Check if user profile is complete
export async function isProfileComplete(uid: string): Promise<boolean> {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (!userDoc.exists()) return false;
    const userData = userDoc.data() as UserData;
    return !!userData.profileComplete;
  } catch (error) {
    console.error('Error checking profile completion:', error);
    return false;
  }
}

// Update user profile
export async function updateUserProfile(
  uid: string,
  profileData: {
    username: string;
    university: string;
    phoneNumber: string;
  }
): Promise<void> {
  try {
    await setDoc(doc(db, 'users', uid), {
      ...profileData,
      profileComplete: true,
    }, { merge: true });
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
}

// Sign up with email and password
export async function signUpWithEmail(
  email: string,
  password: string,
  firstName: string,
  lastName: string
): Promise<UserCredential> {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Create user document in Firestore
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      uid: userCredential.user.uid,
      email: userCredential.user.email,
      firstName,
      lastName,
      createdAt: new Date(),
    });

    return userCredential;
  } catch (error) {
    console.error('Error in signUpWithEmail:', error);
    throw error;
  }
}

// Sign in with email and password
export async function signInWithEmail(
  email: string,
  password: string
): Promise<UserCredential> {
  try {
    return await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    console.error('Error in signInWithEmail:', error);
    throw error;
  }
}

// Sign in with Google
export async function signInWithGoogle(): Promise<UserCredential> {
  try {
    const userCredential = await signInWithPopup(auth, googleProvider);
    
    // Check if user document exists
    const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
    
    if (!userDoc.exists()) {
      // Create user document if it doesn't exist
      const [firstName, lastName] = userCredential.user.displayName?.split(' ') || ['', ''];
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        firstName,
        lastName,
        createdAt: new Date(),
      });
    }

    return userCredential;
  } catch (error) {
    console.error('Error in signInWithGoogle:', error);
    throw error;
  }
}

// Sign out
export async function signOutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error in signOut:', error);
    throw error;
  }
}

// Check if username is available
export async function isUsernameAvailable(username: string): Promise<boolean> {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('username', '==', username));
    const querySnapshot = await getDocs(q);
    return querySnapshot.empty;
  } catch (error) {
    console.error('Error checking username availability:', error);
    throw error;
  }
} 