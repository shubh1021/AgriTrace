import { Header } from '@/components/layout/header';
import { MainDashboard } from '@/components/main-dashboard';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 container mx-auto p-4 md:p-8">
        <MainDashboard />
      </main>
    </div>
  );
}
