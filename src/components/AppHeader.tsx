import { FileArchive } from 'lucide-react';

export function AppHeader() {
  return (
    <header className="py-6 px-4 md:px-6 border-b">
      <div className="container mx-auto flex items-center gap-2">
        <FileArchive className="h-8 w-8 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">SnapClaim</h1>
      </div>
    </header>
  );
}
