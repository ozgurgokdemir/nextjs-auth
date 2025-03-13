export default async function DashboardPage() {
  return (
    <main className="flex flex-col items-center sm:items-start min-h-[calc(100dvh-114px)]">
      <div className="border-dashed border-b w-full">
        <div className="container border-dashed border-x flex flex-col gap-4 py-12">
          <h1 className="text-2xl font-bold leading-tight tracking-tighter sm:text-3xl md:text-4xl lg:leading-[1.1]">
            Dashboard – Private Route
          </h1>
        </div>
      </div>
      <div className="container border-dashed border-x py-12 h-full flex-1"></div>
    </main>
  );
}
