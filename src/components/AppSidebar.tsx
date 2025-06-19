
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sidebar,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubButton,
} from '@/components/ui/sidebar'; // Assuming this is the path to your generic sidebar components
import {
  LayoutDashboard,
  Truck,
  Users,
  FileText,
  Map,
  FileEdit,
  Undo2,
  MessageSquareWarning,
  Settings, // Placeholder for Gestionar Rutas icon if Map is used elsewhere
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Define the structure of navigation items
interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  segment?: string; // For matching active state based on path segment
  subMenu?: SubNavItem[];
}

interface SubNavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  segment?: string;
}

const navItems: NavItem[] = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    segment: 'dashboard',
    subMenu: [
      { href: '/dashboard/refacturacion', label: 'Refacturación', icon: FileEdit, segment: 'refacturacion' },
      { href: '/dashboard/devoluciones', label: 'Devoluciones', icon: Undo2, segment: 'devoluciones' },
      { href: '/dashboard/negociacion', label: 'Negociación Cliente', icon: MessageSquareWarning, segment: 'negociacion' },
    ],
  },
  { href: '/repartidores', label: 'Repartidores', icon: Truck, segment: 'repartidores' },
  { href: '/clientes', label: 'Clientes', icon: Users, segment: 'clientes' },
  { href: '/facturas', label: 'Facturas', icon: FileText, segment: 'facturas' },
  { href: '/rutas', label: 'Gestionar Rutas', icon: Map, segment: 'rutas' },
];

export function AppSidebar() {
  const pathname = usePathname();

  const isActive = (itemSegment?: string, itemHref?: string) => {
    if (!pathname) return false;
    if (itemSegment) {
      return pathname.startsWith(`/${itemSegment}`);
    }
    if (itemHref) {
      return pathname === itemHref;
    }
    return false;
  };

  return (
    <Sidebar> {/* This is the generic Sidebar wrapper from your ui/sidebar.tsx */}
      {/* SidebarHeader could be added here if needed, e.g., for a logo or app name */}
      {/* <SidebarHeader>...</SidebarHeader> */}
      
      {/* SidebarContent typically wraps the scrollable menu part */}
      {/* For this component, we'll assume SidebarMenu handles its own scrolling or is within a SidebarContent */}
      <SidebarMenu>
        {navItems.map((item) => (
          <SidebarMenuItem key={item.href}>
            {item.subMenu ? (
              <>
                <SidebarMenuSubButton
                  // The main button for a sub-menu doesn't navigate itself, it toggles.
                  // isActive can be based on whether any of its sub-items are active.
                  isActive={item.subMenu.some(subItem => isActive(subItem.segment, subItem.href))}
                  className="w-full"
                >
                  <item.icon className="h-5 w-5" />
                  <span className="truncate">{item.label}</span>
                </SidebarMenuSubButton>
                <SidebarMenuSub>
                  {item.subMenu.map((subItem) => (
                    <SidebarMenuItem key={subItem.href}>
                      <Link href={subItem.href} passHref legacyBehavior>
                        <SidebarMenuSubButton
                          asChild
                          isActive={isActive(subItem.segment, subItem.href)}
                          className="w-full"
                        >
                          <a> {/* Content of the link */}
                            <subItem.icon className="h-4 w-4" />
                            <span className="truncate">{subItem.label}</span>
                          </a>
                        </SidebarMenuSubButton>
                      </Link>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenuSub>
              </>
            ) : (
              <Link href={item.href} passHref legacyBehavior>
                <SidebarMenuButton
                  asChild
                  isActive={isActive(item.segment, item.href)}
                  className="w-full"
                >
                  <a> {/* Content of the link */}
                    <item.icon className="h-5 w-5" />
                    <span className="truncate">{item.label}</span>
                  </a>
                </SidebarMenuButton>
              </Link>
            )}
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
      
      {/* SidebarFooter could be added here if needed, e.g., for settings or user profile */}
      {/* <SidebarFooter>...</SidebarFooter> */}
    </Sidebar>
  );
}
