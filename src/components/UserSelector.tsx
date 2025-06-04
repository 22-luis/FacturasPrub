
'use client';

import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { User } from '@/lib/types';
import { Label } from '@/components/ui/label';

interface UserSelectorProps {
  users: User[];
  currentUser: User | null;
  onSelectUser: (userId: string) => void;
  className?: string;
}

export function UserSelector({ users, currentUser, onSelectUser, className }: UserSelectorProps) {
  return (
    <div className={className}>
      <Label htmlFor="user-selector" className="mb-2 block text-sm font-medium text-foreground">
        Seleccionar Usuario:
      </Label>
      <Select value={currentUser?.id || ''} onValueChange={onSelectUser} name="user-selector">
        <SelectTrigger className="w-full sm:w-[280px] bg-background">
          <SelectValue placeholder="Selecciona un usuario..." />
        </SelectTrigger>
        <SelectContent>
          {users.map((user) => (
            <SelectItem key={user.id} value={user.id}>
              {user.name} ({user.role})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
