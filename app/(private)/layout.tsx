import { Header } from '@/app/(private)/header';
import { Footer } from '@/components/footer';

type PrivateLayoutProps = {
  children: React.ReactNode;
};

export default function PrivateLayout({ children }: PrivateLayoutProps) {
  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
}
