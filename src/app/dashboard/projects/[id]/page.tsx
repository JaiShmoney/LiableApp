"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";
import { DashboardLayout } from "@/components/ui/dashboard-layout";
import { TaskList } from "@/components/ui/task-list";
import { CreateTaskDialog } from "@/components/ui/create-task-dialog";
import { ProgressTracker } from "@/components/ui/progress-tracker";
import { MilestoneList } from "@/components/ui/milestone-list";
import { MeetingList } from "@/components/ui/meeting-list";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IconCopy } from "@tabler/icons-react";

interface Project {
  id: string;
  name: string;
  course?: string;
  description?: string;
  members: string[];
  inviteCode: string;
}

interface Member {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export default function ProjectPage() {
  const { id } = useParams() as { id: string };
  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchProject() {
      try {
        const projectDoc = await getDoc(doc(db, "projects", id));
        if (!projectDoc.exists()) return;

        const projectData = { id: projectDoc.id, ...projectDoc.data() } as Project;
        setProject(projectData);

        // Fetch member details
        const memberPromises = projectData.members.map(async (memberId) => {
          const memberDoc = await getDoc(doc(db, "users", memberId));
          if (memberDoc.exists()) {
            return { id: memberId, ...memberDoc.data() } as Member;
          }
          return null;
        });

        const memberData = await Promise.all(memberPromises);
        setMembers(memberData.filter((m): m is Member => m !== null));
        setLoading(false);
      } catch (error) {
        console.error("Error fetching project:", error);
        setLoading(false);
      }
    }

    fetchProject();
  }, [id]);

  const copyInviteLink = async () => {
    if (!project) return;
    const inviteLink = `${window.location.origin}/invite/${project.inviteCode}`;
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="h-8 w-64 bg-neutral-200 rounded animate-pulse" />
            <div className="h-24 bg-neutral-200 rounded animate-pulse" />
            <div className="h-96 bg-neutral-200 rounded animate-pulse" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!project) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center py-12">
              <h2 className="text-2xl font-semibold text-neutral-800">Project not found</h2>
              <p className="text-neutral-600 mt-2">The project you're looking for doesn't exist.</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Project Header */}
          <div>
            <h1 className="text-2xl font-semibold text-neutral-800">{project.name}</h1>
            {project.course && (
              <p className="text-neutral-600 mt-1">{project.course}</p>
            )}
            {project.description && (
              <p className="text-neutral-600 mt-2">{project.description}</p>
            )}
          </div>

          {/* Progress Tracker */}
          <ProgressTracker projectId={id} />

          {/* Tabs */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="w-full justify-start border-b rounded-none p-0 h-auto">
              <TabsTrigger
                value="overview"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-transparent px-4 py-2"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="tasks"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-transparent px-4 py-2"
              >
                Tasks
              </TabsTrigger>
              <TabsTrigger
                value="milestones"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-transparent px-4 py-2"
              >
                Milestones
              </TabsTrigger>
              <TabsTrigger
                value="meetings"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-transparent px-4 py-2"
              >
                Meetings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <div className="space-y-8">
                {/* Team Members */}
                <div>
                  <h2 className="text-lg font-medium text-neutral-800 mb-4">Team Members</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {members.map((member) => (
                      <div
                        key={member.id}
                        className="bg-white rounded-lg border border-neutral-200 p-4 flex items-center space-x-4"
                      >
                        <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center">
                          <span className="text-neutral-600 font-medium">
                            {member.firstName[0]}{member.lastName[0]}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-medium text-neutral-800">
                            {member.firstName} {member.lastName}
                          </h3>
                          <p className="text-sm text-neutral-600">{member.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Invite Link */}
                <div>
                  <h2 className="text-lg font-medium text-neutral-800 mb-4">Invite Link</h2>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 px-4 py-2 bg-neutral-50 text-neutral-800 rounded-lg border">
                      {window.location.origin}/invite/{project.inviteCode}
                    </div>
                    <button
                      onClick={copyInviteLink}
                      className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-black/90 transition-colors"
                    >
                      <IconCopy className="w-4 h-4" />
                      {copied ? "Copied!" : "Copy"}
                    </button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="tasks" className="mt-6">
              <div className="flex justify-end mb-6">
                <CreateTaskDialog projectId={id} />
              </div>
              <TaskList projectId={id} members={members} />
            </TabsContent>

            <TabsContent value="milestones" className="mt-6">
              <MilestoneList projectId={id} />
            </TabsContent>

            <TabsContent value="meetings" className="mt-6">
              <MeetingList projectId={id} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DashboardLayout>
  );
} 