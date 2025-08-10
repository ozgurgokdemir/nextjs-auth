import { Header } from "@/app/(private)/header";

type PrivateLayoutProps = {
  children: React.ReactNode;
};

export default function PrivateLayout({ children }: PrivateLayoutProps) {
  return (
    <>
      <Header />
      {children}
    </>
  );
}
