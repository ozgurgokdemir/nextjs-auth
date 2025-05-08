import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { UserMenu } from '@/components/user-menu';
import { ModeToggle } from '@/components/mode-toggle';
import GitHub from '@/components/icons/github';

export function Header() {
  return (
    <header className="border-dashed sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between gap-2 md:gap-4 border-dashed border-x">
        <Link href="/dashboard">
          <span className="font-mono font-bold">nextjs-auth</span>
        </Link>
        <div className="flex items-center gap-2">
          <UserMenu />
          <div className="flex gap-0.5">
            <Button variant="ghost" size="icon-sm" asChild>
              <a
                target="_blank"
                href="https://github.com/ozgurgokdemir/nextjs-auth"
              >
                <GitHub className="size-4 text-black dark:text-white" />
              </a>
            </Button>
            <ModeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
