import { Hero } from "@/components/blocks/hero"
import { Navbar } from "@/components/ui/navbar"

// Assuming the original type is defined as follows
type Action = {
  label: string;
  href: string;
  variant?: "link" | "default" | "destructive" | "outline" | "secondary" | "ghost";
};

// Extend the type to include className
type ActionWithClassName = Action & {
  className?: string;
};

export default function Home() {
  // Use the new type in your component
  const actions: ActionWithClassName[] = [
    {
      label: "Get Started",
      href: "/signup",
      variant: "default",
      className: "text-black"
    }
  ];

  return (
    <main className="flex min-h-screen flex-col bg-white">
      <Navbar />
      <div className="pt-16"> {/* Add padding top to account for fixed navbar */}
        <Hero
          title="Projects That Work."
          subtitle="Designed for students, built for success. Organize, collaborate, and deliver."
          actions={[
            {
              label: "Get Started",
              href: "/signup",
              variant: "default"
            }
          ]}
          titleClassName="text-5xl md:text-6xl font-extrabold text-black"
          subtitleClassName="text-lg md:text-xl max-w-[600px] text-gray-600"
          actionsClassName="mt-8"
          className="bg-white"
        />
      </div>
    </main>
  )
}
