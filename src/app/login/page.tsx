import { LoginForm } from "@/components/ui/login-form";
import { Navbar } from "@/components/ui/navbar";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col bg-white">
      <Navbar />
      <div className="flex-1 flex items-center justify-center pt-16">
        <LoginForm />
      </div>
    </main>
  );
} 