"use client";

import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/contexts/auth-context";
import { updateUserProfile, isUsernameAvailable } from "@/lib/firebase/auth";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { debounce } from "lodash";

export function ProfileSetupForm() {
  const router = useRouter();
  const { user } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [usernameError, setUsernameError] = useState("");
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    university: "",
    phoneNumber: "",
  });

  // Debounced username check
  const checkUsername = debounce(async (username: string) => {
    if (!username) return;
    
    try {
      setCheckingUsername(true);
      const isAvailable = await isUsernameAvailable(username);
      if (!isAvailable) {
        setUsernameError("This username is already taken");
      } else {
        setUsernameError("");
      }
    } catch (err) {
      console.error("Error checking username:", err);
      setUsernameError("Error checking username availability");
    } finally {
      setCheckingUsername(false);
    }
  }, 500);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (name === "username") {
      checkUsername(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    if (usernameError) return;

    try {
      setLoading(true);
      setError("");
      
      // Final check before submission
      const isAvailable = await isUsernameAvailable(formData.username);
      if (!isAvailable) {
        setUsernameError("This username is already taken");
        return;
      }

      await updateUserProfile(user.uid, formData);
      router.push("/dashboard");
    } catch (err) {
      console.error("Profile setup error:", err);
      setError("Failed to set up profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full mx-auto rounded-none md:rounded-2xl p-4 md:p-8 shadow-input bg-white">
      <h2 className="font-bold text-xl text-neutral-800">
        Complete Your Profile
      </h2>
      <p className="text-neutral-600 text-sm max-w-sm mt-2">
        Please provide some additional information to complete your profile
      </p>

      {error && (
        <p className="text-red-500 text-sm mt-4">{error}</p>
      )}

      <form className="my-8" onSubmit={handleSubmit}>
        <LabelInputContainer className="mb-4">
          <Label htmlFor="username">Username</Label>
          <Input 
            id="username"
            name="username"
            placeholder="johndoe123"
            type="text"
            value={formData.username}
            onChange={handleChange}
            required
            disabled={loading}
            className={cn(
              usernameError && "border-red-500 focus-visible:ring-red-500"
            )}
          />
          {checkingUsername && (
            <p className="text-neutral-600 text-sm">Checking username...</p>
          )}
          {usernameError && (
            <p className="text-red-500 text-sm">{usernameError}</p>
          )}
        </LabelInputContainer>

        <LabelInputContainer className="mb-4">
          <Label htmlFor="university">University</Label>
          <Input 
            id="university"
            name="university"
            placeholder="University of Example"
            type="text"
            value={formData.university}
            onChange={handleChange}
            required
            disabled={loading}
          />
        </LabelInputContainer>

        <LabelInputContainer className="mb-8">
          <Label htmlFor="phoneNumber">Phone Number</Label>
          <Input 
            id="phoneNumber"
            name="phoneNumber"
            placeholder="+1 (123) 456-7890"
            type="tel"
            value={formData.phoneNumber}
            onChange={handleChange}
            required
            disabled={loading}
          />
        </LabelInputContainer>

        <button
          className="bg-black relative group/btn w-full text-white rounded-md h-10 font-medium shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] disabled:opacity-50"
          type="submit"
          disabled={loading || !!usernameError || checkingUsername}
        >
          {loading ? "Saving..." : "Complete Profile →"}
          <BottomGradient />
        </button>
      </form>
    </div>
  );
}

function LabelInputContainer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col space-y-2", className)}>
      {children}
    </div>
  );
}

function BottomGradient() {
  return (
    <div className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-[#fff8] to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity" />
  );
} 