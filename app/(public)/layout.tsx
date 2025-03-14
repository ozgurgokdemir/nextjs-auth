import { Header } from '@/app/(public)/header';
import { Footer } from '@/components/footer';

type PublicLayoutProps = {
  children: React.ReactNode;
};

export default function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
}
