"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/contexts/auth-context";
import { doc, getDoc, collection, query, where, getDocs, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";
import { IconUsers } from "@tabler/icons-react";

interface Project {
  id: string;
  name: string;
  course: string;
  members: string[];
  inviteCode: string;
}

export default function InvitePage({ params }: { params: { code: string } }) {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<Project | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    async function fetchProjectByInviteCode() {
      try {
        console.log("Fetching project with invite code:", params.code);
        // Query for project with matching invite code
        const projectsRef = collection(db, 'projects');
        const q = query(projectsRef, where('inviteCode', '==', params.code));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          console.error('No project found with invite code:', params.code);
          setError('Invalid invite link');
          setLoading(false);
          return;
        }

        const projectDoc = querySnapshot.docs[0];
        const projectData = {
          id: projectDoc.id,
          ...projectDoc.data()
        } as Project;

        console.log("Found project:", projectData);

        // If user is logged in, check if they're already a member
        if (user && projectData.members.includes(user.uid)) {
          console.log("User is already a member, redirecting to project");
          router.push(`/dashboard/projects/${projectData.id}`);
          return;
        }

        setProject(projectData);
      } catch (error) {
        console.error('Error fetching project:', error);
        setError('Something went wrong');
      } finally {
        setLoading(false);
      }
    }

    fetchProjectByInviteCode();
  }, [params.code, user, router]);

  const handleJoin = async () => {
    if (!project) return;

    setJoining(true);

    try {
      if (!user) {
        // Save invite code and redirect to signup
        localStorage.setItem('pendingInvite', params.code);
        router.push('/signup');
        return;
      }

      console.log("Joining project:", project.id, "for user:", user.uid);
      // Add user to project members using arrayUnion to prevent duplicates
      const projectRef = doc(db, 'projects', project.id);
      await updateDoc(projectRef, {
        members: arrayUnion(user.uid)
      });

      console.log("Successfully joined project");
      // Redirect to project page
      router.push(`/dashboard/projects/${project.id}`);
    } catch (error) {
      console.error('Error joining project:', error);
      setError('Failed to join project');
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-sm border">
          <div className="h-8 bg-neutral-200 animate-pulse rounded mb-4" />
          <div className="h-4 bg-neutral-200 animate-pulse rounded w-2/3" />
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-sm border text-center">
          <h1 className="text-xl font-semibold text-red-600 mb-2">
            {error || 'Project not found'}
          </h1>
          <p className="text-neutral-600 mb-4">
            This invite link may be invalid or expired.
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-black/90 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-sm border">
        <h1 className="text-2xl font-bold text-neutral-800 mb-2">
          You're invited to join
        </h1>
        <h2 className="text-3xl font-bold text-black mb-6">
          {project.name}
        </h2>
        
        <div className="space-y-4 mb-8">
          <div className="flex items-center space-x-2 text-neutral-600">
            <span className="font-medium">Course:</span>
            <span>{project.course}</span>
          </div>
          <div className="flex items-center space-x-2 text-neutral-600">
            <IconUsers className="w-5 h-5" />
            <span>{project.members.length} members</span>
          </div>
        </div>

        <button
          onClick={handleJoin}
          disabled={joining}
          className="w-full px-4 py-3 bg-black text-white rounded-lg hover:bg-black/90 transition-colors font-medium disabled:opacity-50"
        >
          {joining ? (
            "Joining..."
          ) : user ? (
            'Join Project'
          ) : (
            'Sign up to join'
          )}
        </button>

        {!user && (
          <p className="text-neutral-600 text-sm text-center mt-4">
            Already have an account?{" "}
            <button
              onClick={() => {
                localStorage.setItem('pendingInvite', params.code);
                router.push('/login');
              }}
              className="text-black font-medium hover:underline"
            >
              Log in
            </button>
          </p>
        )}
      </div>
    </div>
  );
} 