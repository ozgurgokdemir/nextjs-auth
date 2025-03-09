import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

type AuthLayoutProps = {
  children: React.ReactNode;
};

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <>
      <header className="border-dashed w-full border-b">
        <div className="container flex items-center h-14 border-dashed border-x">
          <Button className="group" variant="ghost" size="sm" asChild>
            <Link href="/">
              <ArrowLeft
                className="transition-transform group-hover:-translate-x-0.5"
                size={16}
                aria-hidden="true"
              />
              Back
            </Link>
          </Button>
        </div>
      </header>
      <main className="flex min-h-[calc(100dvh-114px)] w-full items-center justify-center container border-dashed border-x">
        {children}
      </main>
      <footer className="border-dashed w-full border-t">
        <div className="container flex h-14 border-dashed border-x"></div>
      </footer>
    </>
  );
}
