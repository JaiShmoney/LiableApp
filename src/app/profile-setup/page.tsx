import { ProfileSetupForm } from "@/components/ui/profile-setup-form";
import { Navbar } from "@/components/ui/navbar";

export default function ProfileSetupPage() {
  return (
    <main className="flex min-h-screen flex-col bg-white">
      <Navbar />
      <div className="flex-1 flex items-center justify-center pt-16">
        <ProfileSetupForm />
      </div>
    </main>
  );
} 