
import { FileArchive, LogOut, UserCircle, PanelLeft } from 'lucide-react'; // Added PanelLeft
import type { User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar'; // Import SidebarTrigger

interface AppHeaderProps {
  loggedInUser: User | null;
  onLogout: () => void;
}

export function AppHeader({ loggedInUser, onLogout }: AppHeaderProps) {
  return (
    <header className="py-4 px-4 md:px-6 border-b bg-background shadow-sm sticky top-0 z-40"> {/* Added sticky and z-index */}
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          {loggedInUser && (
            <SidebarTrigger className="h-8 w-8" /> 
          )}
          <FileArchive className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">SnapClaim</h1>
        </div>
        {loggedInUser && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <UserCircle className="h-5 w-5 text-primary" />
              <span className="text-xs sm:text-sm">{loggedInUser.name}</span>
            </div>
            <Button variant="outline" size="sm" onClick={onLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar Sesión
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
