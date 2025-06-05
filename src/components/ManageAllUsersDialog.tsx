
'use client';

import React, { useState, useMemo } from 'react';
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
import { User as UserIcon, Pencil, Trash2, ShieldAlert, ShieldCheck, UserSquare2, Filter } from 'lucide-react';
import type { User, UserRole } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface ManageAllUsersDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  allUsers: User[];
  currentUser: User | null;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
}

const roleDisplayInfo: Record<User['role'], { Icon: React.ElementType; label: string, badgeClass?: string }> = {
  administrador: { Icon: ShieldAlert, label: 'Administrador', badgeClass: 'bg-purple-600 text-white hover:bg-purple-700' },
  supervisor: { Icon: ShieldCheck, label: 'Supervisor', badgeClass: 'bg-blue-500 text-white hover:bg-blue-600' },
  repartidor: { Icon: UserSquare2, label: 'Repartidor', badgeClass: 'bg-green-500 text-white hover:bg-green-600' },
};

const availableRolesForFilter: UserRole[] = ['administrador', 'supervisor', 'repartidor'];

export function ManageAllUsersDialog({
  isOpen,
  onOpenChange,
  allUsers,
  currentUser,
  onEdit,
  onDelete,
}: ManageAllUsersDialogProps) {
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<UserRole | 'all'>('all');

  const filteredUsers = useMemo(() => {
    if (selectedRoleFilter === 'all') {
      return allUsers;
    }
    return allUsers.filter(user => user.role === selectedRoleFilter);
  }, [allUsers, selectedRoleFilter]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col p-0">
        <DialogHeader className="p-4 sm:p-6 border-b">
          <DialogTitle>Gestionar Todos los Usuarios</DialogTitle>
          <DialogDescription>
            Edita o elimina usuarios existentes. Filtra por rol para refinar la lista.
          </DialogDescription>
        </DialogHeader>

        <div className="px-4 sm:px-6 pt-4">
          <Label htmlFor="role-filter-select" className="mb-2 block text-xs font-medium text-muted-foreground">
            <Filter className="inline-block h-4 w-4 mr-1" />
            Filtrar por Rol:
          </Label>
          <Select
            value={selectedRoleFilter}
            onValueChange={(value) => setSelectedRoleFilter(value as UserRole | 'all')}
            name="role-filter-select"
          >
            <SelectTrigger className="w-full sm:w-[200px] h-9 text-sm">
              <SelectValue placeholder="Seleccionar rol..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los Roles</SelectItem>
              {availableRolesForFilter.map(role => (
                <SelectItem key={role} value={role}>
                  {roleDisplayInfo[role]?.label || role.charAt(0).toUpperCase() + role.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-grow min-h-0 overflow-hidden px-4 sm:px-6 py-3"> {/* Container for ScrollArea with padding */}
          <ScrollArea className="h-full" scrollbarProps={{ type: "always" }}>
            <div className="space-y-3 pr-1"> {/* Added pr-1 for scrollbar spacing */}
              {filteredUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay usuarios que coincidan con el filtro seleccionado.
                </p>
              ) : (
                filteredUsers.map((user) => {
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
                            disabled={(isCurrentUser && user.role === 'administrador') || (user.role === 'administrador' && user.id !== currentUser?.id)}
                            title={
                              (isCurrentUser && user.role === 'administrador') ? "Los administradores no pueden cambiar su propio rol aquí" :
                              (user.role === 'administrador' && user.id !== currentUser?.id) ? "El rol de otros administradores no se puede cambiar" :
                              `Editar ${user.name}`
                            }
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
        </div>
        <DialogFooter className="p-4 sm:p-6 border-t">
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
