import { SignupForm } from "@/components/ui/signup-form";
import { Navbar } from "@/components/ui/navbar";

export default function SignupPage() {
  return (
    <main className="flex min-h-screen flex-col bg-white">
      <Navbar />
      <div className="flex-1 flex items-center justify-center pt-16">
        <SignupForm />
      </div>
    </main>
  );
} 