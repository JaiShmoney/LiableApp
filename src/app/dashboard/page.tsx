"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/contexts/auth-context";
import { IconPlus, IconFolder, IconCheckbox, IconClock } from "@tabler/icons-react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/ui/dashboard-layout";

interface Project {
  id: string;
  name: string;
  course: string;
  dueDate: string;
  description: string;
  createdBy: string;
  status: string;
}

interface Task {
  id: string;
  name: string;
  description: string;
  dueDate: string;
  createdAt: string;
  projectId: string;
  status: string;
  priority: string;
  assignedTo: string;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalTasks: 0,
    dueSoonTasks: 0,
  });
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);

  useEffect(() => {
    async function fetchDashboardData() {
      if (!user) return;

      try {
        // Query tasks assigned to the user
        const tasksRef = collection(db, 'tasks');
        const q = query(tasksRef, where('assignedTo', '==', user.uid));
        const querySnapshot = await getDocs(q);
        
        const tasks = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Task[];

        // Calculate metrics
        const now = new Date();
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(now.getDate() + 7);

        const totalTasks = tasks.length;
        const dueSoonTasks = tasks.filter(task => {
          const dueDate = new Date(task.dueDate);
          return dueDate <= sevenDaysFromNow && dueDate >= now;
        }).length;

        // Get recent projects (keeping this for the projects section)
        const projectsRef = collection(db, 'projects');
        const projectsQuery = query(projectsRef, where('members', 'array-contains', user.uid));
        const projectsSnapshot = await getDocs(projectsQuery);
        
        const projects = projectsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Project[];

        const sortedProjects = [...projects].sort((a, b) => 
          new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()
        ).slice(0, 3);

        setMetrics({
          totalTasks,
          dueSoonTasks,
        });
        setRecentProjects(sortedProjects);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [user]);

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-neutral-800">
              Welcome back, {user?.displayName?.split(' ')[0] || 'there'}!
            </h1>
            <p className="text-neutral-600 mt-2">
              Here's an overview of your tasks and projects
            </p>
          </div>
          <button
            onClick={() => router.push("/dashboard/projects/new")}
            className="flex items-center space-x-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-black/90 transition-colors"
          >
            <IconPlus className="w-5 h-5" />
            <span>New Project</span>
          </button>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            icon={<IconCheckbox className="w-5 h-5" />}
            label="Total Tasks"
            value={loading ? "-" : metrics.totalTasks.toString()}
            description="Tasks assigned to you"
            onClick={() => router.push("/dashboard/tasks")}
          />
          <StatCard
            icon={<IconClock className="w-5 h-5" />}
            label="Tasks Due Soon"
            value={loading ? "-" : metrics.dueSoonTasks.toString()}
            description="Due within 7 days"
            onClick={() => router.push("/dashboard/tasks")}
          />
          <StatCard
            icon={<IconFolder className="w-5 h-5" />}
            label="Active Projects"
            value={loading ? "-" : recentProjects.length.toString()}
            description="Currently in progress"
            onClick={() => router.push("/dashboard/projects")}
          />
        </div>

        {/* Recent Projects */}
        <div>
          <h2 className="text-lg font-semibold text-neutral-800 mb-4">Recent Projects</h2>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-neutral-200 animate-pulse rounded-lg" />
              ))}
            </div>
          ) : recentProjects.length === 0 ? (
            <div className="bg-white rounded-lg p-6 shadow-sm border text-center">
              <p className="text-neutral-600">
                No projects yet. Create your first project to get started!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentProjects.map((project) => (
                <div
                  key={project.id}
                  className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer border"
                  onClick={() => router.push(`/dashboard/projects/${project.id}`)}
                >
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-neutral-100 rounded-lg">
                      <IconFolder className="w-5 h-5" />
                    </div>
                    <h3 className="font-medium text-neutral-800 truncate">
                      {project.name}
                    </h3>
                  </div>
                  {project.description && (
                    <p className="text-sm text-neutral-800 mb-4 line-clamp-2">
                      {project.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-600">{project.course}</span>
                    <span className="text-neutral-500">
                      Due {new Date(project.dueDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

function StatCard({
  icon,
  label,
  value,
  description,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  description: string;
  onClick?: () => void;
}) {
  return (
    <div 
      className={`bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow border ${
        onClick ? "cursor-pointer" : ""
      }`}
      onClick={onClick}
    >
      <div className="flex items-center space-x-3 mb-3">
        <div className="p-2 bg-neutral-100 rounded-lg">
          {icon}
        </div>
        <h3 className="font-medium text-neutral-600">{label}</h3>
      </div>
      <div className="space-y-1">
        <p className="text-3xl font-bold text-neutral-800">{value}</p>
        <p className="text-sm text-neutral-500">{description}</p>
      </div>
    </div>
  );
} 