"use client";

import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { IconBrandGoogle } from "@tabler/icons-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { setDoc, doc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/firebase";
import { signInWithGoogle } from "@/lib/firebase/firebaseUtils";
import { collection, query, where, getDocs, updateDoc, arrayUnion } from "firebase/firestore";

export function SignupForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (name === "confirmPassword" || name === "password") {
      if (name === "confirmPassword" && value !== formData.password) {
        setPasswordError("Passwords do not match");
      } else if (name === "password" && value !== formData.confirmPassword && formData.confirmPassword) {
        setPasswordError("Passwords do not match");
      } else {
        setPasswordError("");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match");
        return;
      }

      // Create user account
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      // Update user profile with display name
      await updateProfile(userCredential.user, {
        displayName: `${formData.firstname} ${formData.lastname}`
      });

      // Create user profile in Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        firstName: formData.firstname,
        lastName: formData.lastname,
        email: formData.email,
        createdAt: new Date().toISOString(),
      });

      console.log("User created successfully:", userCredential.user.uid);

      // Check for pending invite
      const pendingInvite = localStorage.getItem('pendingInvite');
      if (pendingInvite) {
        console.log("Found pending invite after signup:", pendingInvite);
        localStorage.removeItem('pendingInvite');
        
        // Add user to project members
        const projectsRef = collection(db, 'projects');
        const q = query(projectsRef, where('inviteCode', '==', pendingInvite));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const projectDoc = querySnapshot.docs[0];
          await updateDoc(doc(db, 'projects', projectDoc.id), {
            members: arrayUnion(userCredential.user.uid)
          });
          
          console.log("Added user to project members");
          router.push(`/dashboard/projects/${projectDoc.id}`);
          return;
        }
      }

      router.push('/dashboard');
    } catch (error: any) {
      console.error('Error signing up:', error);
      setError(error.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError("");
      const user = await signInWithGoogle();
      
      // Check for pending invite
      const pendingInvite = localStorage.getItem('pendingInvite');
      if (pendingInvite) {
        console.log("Found pending invite after Google signup:", pendingInvite);
        localStorage.removeItem('pendingInvite');
        
        // Add user to project members
        const projectsRef = collection(db, 'projects');
        const q = query(projectsRef, where('inviteCode', '==', pendingInvite));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const projectDoc = querySnapshot.docs[0];
          await updateDoc(doc(db, 'projects', projectDoc.id), {
            members: arrayUnion(user.uid)
          });
          
          console.log("Added user to project members");
          router.push(`/dashboard/projects/${projectDoc.id}`);
          return;
        }
      }

      router.push("/dashboard");
    } catch (err) {
      console.error("Google signin error:", err);
      setError("Failed to sign in with Google. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full mx-auto rounded-none md:rounded-2xl p-4 md:p-8 shadow-input bg-white">
      <h2 className="font-bold text-xl text-neutral-800">
        Welcome to Liable
      </h2>
      <p className="text-neutral-600 text-sm max-w-sm mt-2">
        Sign up to start managing your projects efficiently
      </p>

      {error && (
        <p className="text-red-500 text-sm mt-4">{error}</p>
      )}

      <form className="my-8" onSubmit={handleSubmit}>
        <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2 mb-4">
          <LabelInputContainer>
            <Label htmlFor="firstname">First name</Label>
            <Input 
              id="firstname"
              name="firstname"
              placeholder="John"
              type="text"
              value={formData.firstname}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </LabelInputContainer>
          <LabelInputContainer>
            <Label htmlFor="lastname">Last name</Label>
            <Input 
              id="lastname"
              name="lastname"
              placeholder="Doe"
              type="text"
              value={formData.lastname}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </LabelInputContainer>
        </div>
        <LabelInputContainer className="mb-4">
          <Label htmlFor="email">Email Address</Label>
          <Input 
            id="email"
            name="email"
            placeholder="you@example.com"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
            disabled={loading}
          />
        </LabelInputContainer>
        <LabelInputContainer className="mb-4">
          <Label htmlFor="password">Password</Label>
          <Input 
            id="password"
            name="password"
            placeholder="••••••••"
            type="password"
            value={formData.password}
            onChange={handleChange}
            required
            disabled={loading}
          />
        </LabelInputContainer>
        <LabelInputContainer className="mb-8">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            placeholder="••••••••"
            type="password"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            disabled={loading}
          />
          {passwordError && (
            <p className="text-red-500 text-sm mt-1">{passwordError}</p>
          )}
        </LabelInputContainer>

        <button
          className="bg-black relative group/btn w-full text-white rounded-md h-10 font-medium shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] disabled:opacity-50"
          type="submit"
          disabled={loading || !!passwordError}
        >
          {loading ? "Creating account..." : "Sign up →"}
          <BottomGradient />
        </button>

        <div className="bg-gradient-to-r from-transparent via-neutral-300 to-transparent my-8 h-[1px] w-full" />

        <div className="flex flex-col space-y-4">
          <button
            className="relative group/btn flex space-x-2 items-center justify-center px-4 w-full text-black rounded-md h-10 font-medium shadow-input bg-gray-50 disabled:opacity-50"
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            <IconBrandGoogle className="h-4 w-4 text-neutral-800" />
            <span className="text-neutral-700 text-sm">
              {loading ? "Signing in..." : "Continue with Google"}
            </span>
            <BottomGradient />
          </button>
        </div>

        <p className="text-neutral-600 text-sm text-center mt-4">
          Already have an account?{" "}
          <Link href="/login" className="text-black font-medium hover:underline">
            Log in
          </Link>
        </p>
      </form>
    </div>
  );
}

const BottomGradient = () => {
  return (
    <>
      <span className="group-hover/btn:opacity-100 block transition duration-500 opacity-0 absolute h-px w-full -bottom-px inset-x-0 bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />
      <span className="group-hover/btn:opacity-100 blur-sm block transition duration-500 opacity-0 absolute h-px w-1/2 mx-auto -bottom-px inset-x-10 bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />
    </>
  );
};

const LabelInputContainer = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={cn("flex flex-col space-y-2 w-full", className)}>
      {children}
    </div>
  );
}; 