"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/contexts/auth-context";
import { IconArrowLeft, IconCalendar, IconUsers, IconClipboardList } from "@tabler/icons-react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";
import { DashboardLayout } from "@/components/ui/dashboard-layout";
import { CreateTaskDialog } from "@/components/ui/create-task-dialog";
import { TaskList } from "@/components/ui/task-list";

interface Project {
  id: string;
  name: string;
  course: string;
  dueDate: string;
  description: string;
  createdBy: string;
  status: string;
  inviteCode: string;
  members: string[];
}

interface Member {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

type TabType = "overview" | "team" | "tasks";

export default function ProjectPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  useEffect(() => {
    async function fetchProjectAndMembers() {
      if (!user) return;

      try {
        const projectDoc = await getDoc(doc(db, 'projects', params.id));
        if (!projectDoc.exists()) {
          router.push('/dashboard/projects');
          return;
        }

        const projectData = {
          id: projectDoc.id,
          ...projectDoc.data()
        } as Project;

        const memberData = await Promise.all(
          projectData.members.map(async (memberId) => {
            const memberDoc = await getDoc(doc(db, 'users', memberId));
            if (memberDoc.exists()) {
              return {
                id: memberId,
                ...memberDoc.data()
              } as Member;
            }
            return null;
          })
        );

        setProject(projectData);
        setMembers(memberData.filter((member): member is Member => member !== null));
        setLoading(false);
      } catch (error) {
        console.error('Error fetching project:', error);
        setLoading(false);
      }
    }

    fetchProjectAndMembers();
  }, [user, params.id, router]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <div className="h-8 w-64 bg-neutral-200 animate-pulse rounded mb-8" />
          <div className="h-32 bg-neutral-200 animate-pulse rounded-lg" />
        </div>
      </DashboardLayout>
    );
  }

  if (!project) return null;

  return (
    <DashboardLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center space-x-2 text-neutral-600 hover:text-black mb-4"
          >
            <IconArrowLeft className="w-5 h-5" />
            <span>Back to Projects</span>
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-neutral-800">
                {project.name}
              </h1>
              <p className="text-neutral-600 mt-1">
                {project.course}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-neutral-600">
                Due {new Date(project.dueDate).toLocaleDateString()}
              </div>
              <div className="px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm font-medium">
                {project.status}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b mb-6">
          <nav className="flex space-x-8">
            <TabButton
              active={activeTab === "overview"}
              onClick={() => setActiveTab("overview")}
              icon={<IconClipboardList className="w-5 h-5" />}
              label="Overview"
            />
            <TabButton
              active={activeTab === "team"}
              onClick={() => setActiveTab("team")}
              icon={<IconUsers className="w-5 h-5" />}
              label="Team"
            />
            <TabButton
              active={activeTab === "tasks"}
              onClick={() => setActiveTab("tasks")}
              icon={<IconCalendar className="w-5 h-5" />}
              label="Tasks"
            />
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg border p-6">
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-neutral-800 mb-2">
                  Description
                </h3>
                <p className="text-neutral-600">
                  {project.description || "No description provided."}
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-neutral-800 mb-2">
                  Invite Link
                </h3>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={`${window.location.origin}/invite/${project.inviteCode}`}
                    readOnly
                    className="flex-1 px-4 py-2 border rounded-lg bg-neutral-50 text-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  />
                  <button
                    onClick={() => navigator.clipboard.writeText(`${window.location.origin}/invite/${project.inviteCode}`)}
                    className="px-4 py-2 bg-black text-white rounded-lg text-sm hover:bg-black/90 transition-colors"
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "team" && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {project.members.map((memberId) => {
                  const member = members.find(m => m.id === memberId);
                  return (
                    <div
                      key={memberId}
                      className="p-4 border rounded-lg flex items-center space-x-4"
                    >
                      <div className="w-10 h-10 rounded-full bg-neutral-200 flex items-center justify-center">
                        <span className="text-neutral-600 font-medium">
                          {member?.firstName?.[0]}{member?.lastName?.[0]}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-medium text-neutral-800">
                          {member?.firstName} {member?.lastName}
                        </h4>
                        <p className="text-sm text-neutral-600">
                          {member?.email}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === "tasks" && (
            <div className="space-y-6">
              <div className="flex justify-end">
                <CreateTaskDialog projectId={params.id} />
              </div>
              <TaskList projectId={params.id} members={members} />
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center space-x-2 py-2 border-b-2 px-1 ${
        active
          ? "border-black text-black"
          : "border-transparent text-neutral-600 hover:text-black"
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
} 