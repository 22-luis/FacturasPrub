
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
  SidebarHeader, // Added for potential use
  SidebarContent, // Added for structure
  SidebarFooter, // Added for potential use
  SidebarTrigger, // Already in AppHeader but good to have context
} from '@/components/ui/sidebar'; 
import {
  LayoutDashboard,
  Truck,
  Users,
  FileText,
  Map,
  FileEdit,
  Settings, // Generic icon for Gestionar Rutas if MapIcon isn't specific enough or used elsewhere.
  // For sub-menu alerts, more specific icons could be used if available or generic ones.
  AlertTriangle, // Example for general alerts
} from 'lucide-react';
import { cn } from '@/lib/utils';


interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  segment?: string; 
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
    href: '#', // Main dashboard link might go to a general dashboard page or just be a sub-menu trigger
    label: 'Dashboard',
    icon: LayoutDashboard,
    segment: 'dashboard',
    subMenu: [
      { href: '/dashboard/refacturacion', label: 'Refacturación', icon: FileEdit, segment: 'refacturacion' },
      // { href: '/dashboard/devoluciones', label: 'Devoluciones', icon: Undo2, segment: 'devoluciones' },
      // { href: '/dashboard/negociacion', label: 'Negociación Cliente', icon: MessageSquareWarning, segment: 'negociacion' },
    ],
  },
  { href: '/repartidores', label: 'Repartidores', icon: Truck, segment: 'repartidores' },
  { href: '/clientes', label: 'Clientes', icon: Users, segment: 'clientes' },
  { href: '/facturas', label: 'Facturas', icon: FileText, segment: 'facturas' },
  { href: '/rutas', label: 'Gestionar Rutas', icon: Settings, segment: 'rutas' }, // Using Settings as placeholder
];

export function AppSidebar() {
  const pathname = usePathname();

  const isActive = (itemSegment?: string, itemHref?: string) => {
    if (!pathname) return false;
    if (itemSegment) {
      // Ensure a more precise match, e.g., /dashboard should not match /dashboard/refacturacion if that's not desired
      // For simple cases, startsWith might be okay. For exact, use equality or regex.
      return pathname.startsWith(`/${itemSegment}`);
    }
    if (itemHref) {
      return pathname === itemHref;
    }
    return false;
  };

  const hasActiveSubItem = (subMenu?: SubNavItem[]) => {
    if (!subMenu) return false;
    return subMenu.some(subItem => isActive(subItem.segment, subItem.href));
  };

  return (
    <Sidebar collapsible="icon"> {/* Set to icon collapsible for desktop */}
      {/* Optional: SidebarHeader can be used for a logo or app name if SidebarTrigger moves inside */}
      {/* <SidebarHeader>
        <h2 className="text-lg font-semibold">SnapClaim</h2>
      </SidebarHeader> */}
      
      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.label}>
              {item.subMenu && item.subMenu.length > 0 ? (
                <>
                  <SidebarMenuButton
                    // The main button for a sub-menu doesn't navigate itself if href is "#"
                    // It toggles the sub-menu. The `isActive` here refers to its sub-items.
                    // If the parent item itself is a link, this logic might need adjustment.
                    // For now, assuming parent is non-navigable if it has sub-items.
                    asChild={item.href !== "#"} // Make it a link only if href is not "#"
                    isActive={hasActiveSubItem(item.subMenu)}
                    className="w-full"
                    tooltip={item.label} 
                  >
                    {item.href === "#" ? (
                      // Div wrapper for non-link button styling and layout
                      <div className="flex items-center gap-2 w-full">
                        <item.icon className="h-5 w-5" />
                        <span className="truncate">{item.label}</span>
                      </div>
                    ) : (
                      <Link href={item.href}>
                        <item.icon className="h-5 w-5" />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    )}
                  </SidebarMenuButton>
                  <SidebarMenuSub>
                    {item.subMenu.map((subItem) => (
                      <SidebarMenuItem key={subItem.label}>
                        <Link href={subItem.href} passHref legacyBehavior>
                          <SidebarMenuSubButton
                            asChild
                            isActive={isActive(subItem.segment, subItem.href)}
                            className="w-full"
                            // tooltip for sub-items usually not needed if parent is expanded
                          >
                            <a> 
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
                    tooltip={item.label}
                  >
                    <a> 
                      <item.icon className="h-5 w-5" />
                      <span className="truncate">{item.label}</span>
                    </a>
                  </SidebarMenuButton>
                </Link>
              )}
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      
      {/* Optional: SidebarFooter for settings, user profile, etc. */}
      {/* <SidebarFooter>
         <UserProfileButton /> 
      </SidebarFooter> */}
    </Sidebar>
  );
}
