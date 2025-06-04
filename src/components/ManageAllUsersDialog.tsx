
'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { User as UserIcon, Pencil, Trash2, ShieldAlert, ShieldCheck, UserSquare2 } from 'lucide-react';
import type { User } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ManageAllUsersDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  allUsers: User[];
  currentUser: User | null; // To check if trying to delete self
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
}

const roleDisplayInfo: Record<User['role'], { Icon: React.ElementType; label: string, badgeClass?: string }> = {
  administrador: { Icon: ShieldAlert, label: 'Administrador', badgeClass: 'bg-purple-600 text-white hover:bg-purple-700' },
  supervisor: { Icon: ShieldCheck, label: 'Supervisor', badgeClass: 'bg-blue-500 text-white hover:bg-blue-600' },
  repartidor: { Icon: UserSquare2, label: 'Repartidor', badgeClass: 'bg-green-500 text-white hover:bg-green-600' },
};

export function ManageAllUsersDialog({
  isOpen,
  onOpenChange,
  allUsers,
  currentUser,
  onEdit,
  onDelete,
}: ManageAllUsersDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Gestionar Todos los Usuarios</DialogTitle>
          <DialogDescription>
            Edita o elimina usuarios existentes en el sistema.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-grow pr-4 -mr-4 my-4">
          <div className="space-y-3">
            {allUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No hay usuarios en el sistema.
              </p>
            ) : (
              allUsers.map((user) => {
                const displayInfo = roleDisplayInfo[user.role] || { Icon: UserIcon, label: user.role };
                const isCurrentUser = user.id === currentUser?.id;
                return (
                  <Card key={user.id} className="shadow-sm">
                    <CardContent className="p-3 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <displayInfo.Icon className={cn("h-6 w-6 flex-shrink-0",
                          user.role === 'administrador' ? 'text-purple-600' :
                          user.role === 'supervisor' ? 'text-blue-500' :
                          user.role === 'repartidor' ? 'text-green-500' : 'text-primary'
                        )} />
                        <div className="flex-grow min-w-0">
                           <span className="font-medium block truncate" title={user.name}>{user.name}</span>
                           <Badge variant={user.role === 'administrador' || user.role === 'supervisor' || user.role === 'repartidor' ? "default" : "secondary"}
                                  className={cn("text-xs", displayInfo.badgeClass)}>
                            {displayInfo.label}
                           </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => onEdit(user)}
                          aria-label={`Editar ${user.name}`}
                          className="h-8 w-8"
                          disabled={isCurrentUser && user.role === 'administrador'} // Admin cannot edit own role via this flow
                          title={isCurrentUser && user.role === 'administrador' ? "Los administradores no pueden cambiar su propio rol aquí" : `Editar ${user.name}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => onDelete(user)}
                          aria-label={`Eliminar ${user.name}`}
                          className="h-8 w-8"
                          disabled={isCurrentUser}
                          title={isCurrentUser ? "No puedes eliminarte a ti mismo" : `Eliminar ${user.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </ScrollArea>
        <DialogFooter className="mt-auto pt-4 border-t">
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cerrar
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
