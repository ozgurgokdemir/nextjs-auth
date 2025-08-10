import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="container py-24">
      <div className="flex flex-col items-center text-center gap-4 mx-auto">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Next.js Authentication
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl text-balance">
          A complete authentication solution with email verification, password
          reset, two-factor authentication, and OAuth providers.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 mt-2">
          <Button size="sm" asChild>
            <Link href="/dashboard">Go to Dashboard</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/signup">Get Started</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
