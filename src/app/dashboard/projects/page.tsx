"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/contexts/auth-context";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";
import { DashboardLayout } from "@/components/ui/dashboard-layout";

interface Project {
  id: string;
  name: string;
  course: string;
  dueDate: string;
  description?: string;
  status: string;
}

export default function ProjectsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    async function fetchProjects() {
      if (!user) return;

      try {
        // Query projects where the user is a member
        const projectsRef = collection(db, 'projects');
        const q = query(projectsRef, where('members', 'array-contains', user.uid));
        const querySnapshot = await getDocs(q);
        
        const projectsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Project[];

        setProjects(projectsData);
      } catch (error) {
        console.error('Error fetching projects:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchProjects();
  }, [user]);

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-neutral-800">Projects</h1>
            <p className="text-neutral-600 mt-1">
              Manage and track all your projects
            </p>
          </div>
          <button
            onClick={() => router.push("/dashboard/projects/new")}
            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-black/90 transition-colors"
          >
            New Project
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-neutral-200 animate-pulse rounded-lg" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-neutral-600 mb-4">No projects yet</p>
            <button
              onClick={() => router.push("/dashboard/projects/new")}
              className="text-sm text-black hover:underline"
            >
              Create your first project →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div
                key={project.id}
                onClick={() => router.push(`/dashboard/projects/${project.id}`)}
                className="bg-white p-6 rounded-lg border shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              >
                <h3 className="font-semibold text-lg text-neutral-800 mb-2">
                  {project.name}
                </h3>
                <p className="text-neutral-600 text-sm mb-4">
                  {project.description || "No description"}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600">
                    {project.course}
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-neutral-500">
                      Due {new Date(project.dueDate).toLocaleDateString()}
                    </span>
                    <div className="px-2 py-1 rounded-full bg-green-100 text-green-800 text-xs">
                      {project.status}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
} 