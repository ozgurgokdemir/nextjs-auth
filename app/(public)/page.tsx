import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex flex-col items-center sm:items-start min-h-[calc(100dvh-114px)]">
      <div className="border-dashed border-b w-full">
        <div className="container border-dashed border-x flex flex-col gap-4 py-12">
          <h1 className="text-2xl font-bold leading-tight tracking-tighter sm:text-3xl md:text-4xl lg:leading-[1.1]">
            Home – Public Route
          </h1>
        </div>
      </div>
      <div className="container border-dashed border-x py-12 h-full flex-1">
        <Button className="group w-fit" asChild>
          <Link href="/dashboard">
            Dashboard
            <ArrowRight
              className="transition-transform group-hover:translate-x-0.5"
              size={16}
              aria-hidden="true"
            />
          </Link>
        </Button>
      </div>
    </main>
  );
}
