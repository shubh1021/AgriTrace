import { Leaf } from 'lucide-react';

export function Header() {
  return (
    <header className="bg-primary text-primary-foreground sticky top-0 z-50 shadow-md">
      <div className="container mx-auto flex items-center h-16 px-4">
        <div className="flex items-center gap-3">
          <Leaf className="h-8 w-8" />
          <h1 className="text-3xl font-headline tracking-wider text-shadow">AgriTrace</h1>
        </div>
      </div>
    </header>
  );
}
