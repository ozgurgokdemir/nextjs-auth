import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import GitHub from "@/components/icons/github";
import { Separator } from "@/components/ui/separator";

export async function Header() {
  return (
    <header className="flex h-8 mt-8 container items-center justify-between gap-2 md:gap-4">
      <Link href="/">
        <span className="font-mono font-bold">nextjs-auth</span>
      </Link>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon-sm" asChild>
          <a
            target="_blank"
            href="https://github.com/ozgurgokdemir/nextjs-auth"
          >
            <GitHub className="size-4" />
          </a>
        </Button>
        <Separator orientation="vertical" className="!h-4" />
        <ModeToggle />
        <Separator orientation="vertical" className="!h-4 mr-2" />
        <Button size="sm" asChild>
          <Link href="/signin">Sign In</Link>
        </Button>
      </div>
    </header>
  );
}
