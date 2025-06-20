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
    <header className="py-3 px-3 sm:py-4 sm:px-4 md:px-6 border-b bg-background shadow-sm sticky top-0 z-40">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          {loggedInUser && (
            <SidebarTrigger className="h-8 w-8" /> 
          )}
          <FileArchive className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">SnapClaim</h1>
        </div>
        {loggedInUser && (
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex items-center gap-2 text-muted-foreground">
              <UserCircle className="h-5 w-5 text-primary" />
              <span className="text-sm">{loggedInUser.name}</span>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onLogout}
              className="text-xs sm:text-sm px-2 sm:px-3"
            >
              <LogOut className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Cerrar Sesión</span>
              <span className="sm:hidden">Salir</span>
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
