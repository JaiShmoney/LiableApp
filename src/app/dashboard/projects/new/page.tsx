"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/contexts/auth-context";
import { IconArrowLeft } from "@tabler/icons-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addDoc, collection, serverTimestamp, doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";
import { nanoid } from 'nanoid';
import { DashboardLayout } from "@/components/ui/dashboard-layout";

export default function NewProjectPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    course: "",
    dueDate: "",
    description: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const inviteCode = nanoid(10);
      const projectId = doc(collection(db, 'projects')).id; // Generate ID first

      // Create project with the generated ID
      await setDoc(doc(db, 'projects', projectId), {
        ...formData,
        id: projectId, // Store the ID in the document
        createdBy: user.uid,
        members: [user.uid],
        status: "active",
        inviteCode,
        createdAt: new Date().toISOString(),
      });

      console.log("Project created with ID:", projectId);
      
      setSuccess(true);
      setInviteLink(`${window.location.origin}/invite/${inviteCode}`);

      // Redirect after 5 seconds
      setTimeout(() => {
        router.push('/dashboard/projects');
      }, 5000);
    } catch (error) {
      console.error('Error creating project:', error);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-white rounded-lg p-8 shadow-sm border">
              <h2 className="text-2xl font-bold text-neutral-800 mb-4">
                Project Created Successfully! 🎉
              </h2>
              <p className="text-neutral-600 mb-6">
                Your project has been created. You'll be redirected to the projects page in a few seconds.
              </p>
              <div className="mb-6">
                <p className="text-sm text-neutral-600 mb-2">Share this link to invite others:</p>
                <div className="flex items-center justify-center gap-2">
                  <input
                    type="text"
                    value={inviteLink}
                    readOnly
                    className="px-4 py-2 border rounded-lg bg-neutral-50 text-neutral-800 text-sm w-full focus:outline-none focus:ring-2 focus:ring-black"
                  />
                  <button
                    onClick={() => navigator.clipboard.writeText(inviteLink)}
                    className="px-4 py-2 bg-black text-white rounded-lg text-sm hover:bg-black/90 transition-colors"
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => router.back()}
            className="flex items-center space-x-2 text-neutral-600 hover:text-black mb-8"
          >
            <IconArrowLeft className="w-5 h-5" />
            <span>Back to Projects</span>
          </button>

          <h1 className="text-2xl font-bold text-neutral-800">Create New Project</h1>
          <p className="text-neutral-600 mt-2 mb-8">
            Set up a new project to start tracking your work
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white rounded-lg p-8 shadow-sm border">
              <div className="space-y-6">
                <div>
                  <Label htmlFor="name" className="text-neutral-800">Project Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Enter project name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <Label htmlFor="course" className="text-neutral-800">Course</Label>
                  <Input
                    id="course"
                    name="course"
                    placeholder="Enter course name"
                    value={formData.course}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <Label htmlFor="dueDate" className="text-neutral-800">Due Date</Label>
                  <Input
                    id="dueDate"
                    name="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <Label htmlFor="description" className="text-neutral-800">
                    Description <span className="text-neutral-500">(optional)</span>
                  </Label>
                  <textarea
                    id="description"
                    name="description"
                    placeholder="Enter project description"
                    value={formData.description}
                    onChange={handleChange}
                    disabled={loading}
                    className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-black text-neutral-800"
                    rows={4}
                  />
                </div>
              </div>

              <div className="mt-8">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-black text-white py-2 px-4 rounded-lg hover:bg-black/90 transition-colors disabled:opacity-50"
                >
                  {loading ? "Creating Project..." : "Create Project"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
} 