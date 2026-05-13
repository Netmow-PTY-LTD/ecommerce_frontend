'use client';

import { ReactNode, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Image, LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  Package,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  LogOut,
  Bell,
  Search,
  Menu,
  CreditCard,
  Clock,
  CheckCircle2,
  XCircle,
  FolderTree,
  Ruler,
  Star,
  Tag,
  Zap,
  MessageCircle,
  MessageSquare,
  BookOpen,
  Sparkles,
  Mail,
  BarChart3,
  TrendingUp,
  Globe,
  DollarSign,
  Layers,
  Box
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useSettingsContext } from '@/contexts/SettingsContext';

interface AdminLayoutProps {
  children: ReactNode;
  defaultSidebarCollapsed?: boolean;
  title?: string;
  subtitle?: string;
}

interface NavItem {
  name: string;
  href?: string;
  icon: LucideIcon;
  badge?: number;
  subitems?: {
    name: string;
    href: string;
    icon?: LucideIcon;
  }[];
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  {
    name: 'Media Library',
    href: '/admin/gallery',
    icon: Image,
  },
  {
    name: 'Orders',
    icon: ShoppingCart,
    subitems: [
      { name: 'All Orders', href: '/admin/orders', icon: ShoppingCart },
      { name: 'Paid Orders', href: '/admin/orders/paid', icon: CheckCircle2 },
      { name: 'Unpaid Orders', href: '/admin/orders/unpaid', icon: XCircle },
      { name: 'Pending Orders', href: '/admin/orders/pending', icon: Clock },
    ],
  },
  { name: 'Customers', href: '/admin/customers', icon: Users },
  { name: 'Products', href: '/admin/products', icon: Package },
  { name: 'Categories', href: '/admin/products/categories', icon: FolderTree },
  { name: 'Units', href: '/admin/products/units', icon: Ruler },
  { name: 'Stock Management', href: '/admin/stock', icon: Box },
  { name: 'Reviews', href: '/admin/reviews', icon: Star },
  {
    name: 'Pricing',
    icon: Tag,
    subitems: [
      { name: 'Coupons', href: '/admin/coupons', icon: Tag },
      { name: 'Flash Sales', href: '/admin/flash-sales', icon: Zap },
    ],
  },
  {
    name: 'Chat Support',
    icon: MessageCircle,
    subitems: [
      { name: 'Chats', href: '/admin/chat/chats', icon: MessageSquare },
      { name: 'Answer Guide', href: '/admin/chat/answer-guide', icon: BookOpen },
    ],
  },
  // {
  //   name: 'Email',
  //   icon: Mail,
  //   subitems: [
  //     { name: 'Templates', href: '/admin/email/templates', icon: FileText },
  //     // { name: 'Automation', href: '/admin/email/automation', icon: Clock },
  //     // { name: 'Logs', href: '/admin/email/logs', icon: Mail },
  //   ],
  // },
  {
    name: 'Analytics',
    icon: BarChart3,
    subitems: [
      { name: 'Sales & Revenue', href: '/admin/analytics/sales', icon: TrendingUp },
      { name: 'Products', href: '/admin/analytics/products', icon: Package },
      { name: 'Customers', href: '/admin/analytics/customers', icon: Users },
      { name: 'Orders', href: '/admin/analytics/orders', icon: ShoppingCart },
      { name: 'Payments', href: '/admin/analytics/payments', icon: CreditCard },
      { name: 'Profit & Loss', href: '/admin/analytics/profit-loss', icon: DollarSign },
    ],
  },


  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export default function AdminLayout({
  children,
  defaultSidebarCollapsed = false,
  title,
  subtitle
}: AdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { settings } = useSettingsContext();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(defaultSidebarCollapsed);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isClosingMobileMenu, setIsClosingMobileMenu] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set(['Orders']));

  const handleLogout = async () => {
    await logout();
    router.push('/admin/login');
  };

  const getInitials = (name: string | undefined) => {
    if (!name) return 'A';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const closeMobileMenu = () => {
    setIsClosingMobileMenu(true);
    setTimeout(() => {
      setMobileMenuOpen(false);
      setIsClosingMobileMenu(false);
    }, 300); // Match the animation duration
  };

  const toggleExpanded = (itemName: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemName)) {
        newSet.delete(itemName);
      } else {
        newSet.add(itemName);
      }
      return newSet;
    });
  };

  const isActive = (href: string) => {
    return pathname === href || pathname?.startsWith(href + '/');
  };

  return (
    <>
      {/* Custom CSS for smooth animations */}
      <style jsx global>{`
        @keyframes slideInLeft {
          from {
            transform: translateX(-100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes slideOutLeft {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(-100%);
            opacity: 0;
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes fadeOut {
          from {
            opacity: 1;
          }
          to {
            opacity: 0;
          }
        }
        @keyframes scaleIn {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        .mobile-sidebar-slide-in {
          animation: slideInLeft 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .mobile-sidebar-slide-out {
          animation: slideOutLeft 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .mobile-overlay-fade-in {
          animation: fadeIn 0.2s ease-out;
        }
        .mobile-overlay-fade-out {
          animation: fadeOut 0.2s ease-out forwards;
        }
        .mobile-nav-item {
          animation: scaleIn 0.2s ease-out backwards;
        }
      `}</style>

      <div className="flex h-screen overflow-hidden bg-gray-50">
        {/* Sidebar */}
        <aside
          className={cn(
            'flex flex-col transition-all duration-300 ease-in-out bg-background border-r border-border overflow-hidden',
            sidebarCollapsed ? 'w-16' : 'w-64',
            'hidden lg:flex'
          )}
        >
          {/* Logo */}
          <div className="flex items-center justify-between h-14 px-3 border-b border-border">
            <div className={cn(
              'flex items-center transition-all duration-300 ease-in-out',
              sidebarCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'
            )}>
              {settings?.logo_url ? (
                <div className="h-8 w-auto max-w-[140px] flex items-center overflow-hidden">
                  <img
                    src={settings.logo_url.startsWith('http') ? settings.logo_url : `${process.env.NEXT_PUBLIC_API_URL}${settings.logo_url}`}
                    alt="Logo"
                    className="h-full w-auto object-contain"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-brand flex items-center justify-center shrink-0">
                    <LayoutDashboard className="h-4 w-4 text-white" />
                  </div>
                  <span className="font-semibold text-lg text-foreground whitespace-nowrap">
                    {settings?.company_name || 'Admin'}
                  </span>
                </div>
              )}
            </div>
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1.5 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors shrink-0 text-muted-foreground"
            >
              {sidebarCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-2 overflow-y-auto">
            <div className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const hasSubitems = item.subitems && item.subitems.length > 0;
                const isExpanded = expandedItems.has(item.name);
                const isItemActive = item.href ? isActive(item.href) : false;
                const hasActiveSubitem = item.subitems?.some(sub => isActive(sub.href));

                return (
                  <div key={item.name}>
                    {/* Main navigation item */}
                    {item.href ? (
                      <Link
                        href={item.href}
                        className={cn(
                          'group flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200',
                          'hover:bg-accent hover:text-accent-foreground',
                          (isItemActive || hasActiveSubitem)
                            ? 'bg-accent text-accent-foreground'
                            : 'text-muted-foreground',
                          sidebarCollapsed && 'justify-center px-3'
                        )}
                      >
                        <Icon className={cn(
                          'h-4 w-4 shrink-0',
                          (isItemActive || hasActiveSubitem) ? 'text-foreground' : 'text-muted-foreground'
                        )} />
                        <span className={cn(
                          'flex-1 whitespace-nowrap transition-all duration-300',
                          sidebarCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'
                        )}>
                          {item.name}
                        </span>
                        {item.badge && !sidebarCollapsed && (
                          <span className="ml-auto bg-brand/10 text-brand text-xs px-2 py-0.5 rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    ) : (
                      <button
                        onClick={() => toggleExpanded(item.name)}
                        className={cn(
                          'group flex items-center gap-3 w-full px-3 py-2 text-sm font-medium rounded-md transition-all duration-200',
                          'hover:bg-accent hover:text-accent-foreground cursor-pointer',
                          (isExpanded || hasActiveSubitem)
                            ? 'bg-accent text-accent-foreground'
                            : 'text-muted-foreground',
                          sidebarCollapsed && 'justify-center px-3'
                        )}
                      >
                        <Icon className={cn(
                          'h-4 w-4 shrink-0',
                          (isExpanded || hasActiveSubitem) ? 'text-foreground' : 'text-muted-foreground'
                        )} />
                        <span className={cn(
                          'flex-1 whitespace-nowrap text-left transition-all duration-300',
                          sidebarCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'
                        )}>
                          {item.name}
                        </span>
                        {!sidebarCollapsed && (
                          <ChevronRight className={cn(
                            "h-4 w-4 shrink-0 transition-transform duration-200",
                            isExpanded && "rotate-90"
                          )} />
                        )}
                      </button>
                    )}

                    {/* Submenu items */}
                    {hasSubitems && !sidebarCollapsed && (
                      <div className={cn(
                        'ml-6 mt-1 space-y-1 overflow-hidden transition-all duration-300 ease-in-out',
                        isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                      )}>
                        {item.subitems!.map((subitem) => {
                          const SubIcon = subitem.icon;
                          const isSubActive = isActive(subitem.href);

                          return (
                            <Link
                              key={subitem.href}
                              href={subitem.href}
                              className={cn(
                                'group flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200',
                                'hover:bg-accent hover:text-accent-foreground',
                                isSubActive
                                  ? 'bg-accent/50 text-accent-foreground'
                                  : 'text-muted-foreground'
                              )}
                            >
                              {SubIcon && <SubIcon className="h-4 w-4 shrink-0" />}
                              <span className="flex-1 whitespace-nowrap">{subitem.name}</span>
                              {isSubActive && (
                                <div className="h-1.5 w-1.5 rounded-full bg-brand" />
                              )}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </nav>

          {/* User Section */}
          <div className="p-3 border-t border-border">
            <div className={cn(
              'flex items-center gap-3 transition-all duration-300 ease-in-out',
              sidebarCollapsed ? 'justify-center' : 'justify-start'
            )}>
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className="bg-brand text-white text-xs">
                  {getInitials(user?.name)}
                </AvatarFallback>
              </Avatar>
              <div className={cn(
                'flex-1 min-w-0 overflow-hidden transition-all duration-300 ease-in-out',
                sidebarCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'
              )}>
                <p className="text-sm font-medium text-foreground truncate whitespace-nowrap">
                  {user?.name}
                </p>
                <p className="text-xs text-muted-foreground truncate whitespace-nowrap">{user?.email}</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="bg-background border-b border-border h-14 flex items-center justify-between px-4 sm:px-6">
            <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
              {/* Mobile Menu Button */}
              <button
                onClick={() => mobileMenuOpen ? closeMobileMenu() : setMobileMenuOpen(true)}
                className="lg:hidden p-2 rounded-md hover:bg-accent transition-colors text-muted-foreground flex-shrink-0"
              >
                <Menu className="h-5 w-5" />
              </button>

              {/* Breadcrumb / Title Area */}
              <div className="flex-1 min-w-0">
                {title && (
                  <div className="flex flex-col">
                    <h1 className="text-sm sm:text-base font-semibold text-foreground truncate">
                      {title}
                    </h1>
                    {subtitle && (
                      <p className="text-[10px] sm:text-xs text-muted-foreground truncate hidden sm:block">
                        {subtitle}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Search */}
              <div className="hidden sm:block relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="pl-10 pr-4 py-2 w-64 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                />
              </div>

              {/* Notifications */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5 text-gray-600" />
                    <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="max-h-64 overflow-y-auto">
                    <DropdownMenuItem>
                      <div className="flex flex-col gap-1">
                        <p className="text-sm font-medium">New order received</p>
                        <p className="text-xs text-gray-500">2 minutes ago</p>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <div className="flex flex-col gap-1">
                        <p className="text-sm font-medium">Customer registered</p>
                        <p className="text-xs text-gray-500">1 hour ago</p>
                      </div>
                    </DropdownMenuItem>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-center text-sm text-brand font-semibold cursor-pointer">
                    View all notifications
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-brand text-white text-sm">
                        {getInitials(user?.name)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col gap-1">
                      <p className="text-sm font-medium">{user?.name}</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push('/admin/profile')}>
                    <Users className="h-4 w-4 mr-2" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/admin/settings')}>
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-muted/30">
            {children}
          </main>
        </div>

        {/* Mobile Sidebar Overlay */}
        {mobileMenuOpen && (
          <>
            <div
              className={cn(
                "fixed inset-0 bg-black/50 z-40 lg:hidden",
                isClosingMobileMenu ? "mobile-overlay-fade-out" : "mobile-overlay-fade-in"
              )}
              onClick={closeMobileMenu}
            ></div>
            <aside className={cn(
              "fixed left-0 top-0 h-full w-64 bg-background border-r border-border z-50 lg:hidden flex flex-col shadow-2xl",
              isClosingMobileMenu ? "mobile-sidebar-slide-out" : "mobile-sidebar-slide-in"
            )}>
              {/* Mobile Sidebar Content */}
              <div className="flex items-center justify-between h-14 px-3 border-b border-border">
                <div className="flex items-center transition-all duration-300 ease-in-out">
                  {settings?.logo_url ? (
                    <div className="h-8 w-auto max-w-[120px] flex items-center overflow-hidden">
                      <img
                        src={settings.logo_url.startsWith('http') ? settings.logo_url : `${process.env.NEXT_PUBLIC_API_URL}${settings.logo_url}`}
                        alt="Logo"
                        className="h-full w-auto object-contain"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-brand flex items-center justify-center shrink-0">
                        <LayoutDashboard className="h-4 w-4 text-white" />
                      </div>
                      <span className="font-semibold text-lg text-foreground">
                        {settings?.company_name || 'Admin'}
                      </span>
                    </div>
                  )}
                </div>
                <button
                  onClick={closeMobileMenu}
                  className="p-1.5 rounded-md hover:bg-accent transition-colors text-muted-foreground"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {/* Mobile Navigation */}
              <nav className="flex-1 px-3 py-2 overflow-y-auto">
                <div className="space-y-1">
                  {navigation.map((item) => {
                    const Icon = item.icon;
                    const hasSubitems = item.subitems && item.subitems.length > 0;
                    const isExpanded = expandedItems.has(item.name);
                    const isItemActive = item.href ? isActive(item.href) : false;
                    const hasActiveSubitem = item.subitems?.some(sub => isActive(sub.href));

                    return (
                      <div key={item.name}>
                        {/* Main navigation item */}
                        {item.href ? (
                          <Link
                            href={item.href}
                            onClick={closeMobileMenu}
                            className={cn(
                              'group flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200',
                              'hover:bg-accent hover:text-accent-foreground',
                              (isItemActive || hasActiveSubitem)
                                ? 'bg-accent text-accent-foreground'
                                : 'text-muted-foreground'
                            )}
                          >
                            <Icon className={cn(
                              'h-4 w-4 shrink-0',
                              (isItemActive || hasActiveSubitem) ? 'text-foreground' : 'text-muted-foreground'
                            )} />
                            <span className="flex-1 whitespace-nowrap">{item.name}</span>
                            {item.badge && (
                              <span className="ml-auto bg-brand/10 text-brand text-xs px-2 py-0.5 rounded-full">
                                {item.badge}
                              </span>
                            )}
                          </Link>
                        ) : (
                          <button
                            onClick={() => toggleExpanded(item.name)}
                            className={cn(
                              'group flex items-center gap-3 w-full px-3 py-2 text-sm font-medium rounded-md transition-all duration-200',
                              'hover:bg-accent hover:text-accent-foreground',
                              (isExpanded || hasActiveSubitem)
                                ? 'bg-accent text-accent-foreground'
                                : 'text-muted-foreground'
                            )}
                          >
                            <Icon className={cn(
                              'h-4 w-4 shrink-0',
                              (isExpanded || hasActiveSubitem) ? 'text-foreground' : 'text-muted-foreground'
                            )} />
                            <span className="flex-1 whitespace-nowrap text-left">{item.name}</span>
                            <ChevronRight className={cn(
                              "h-4 w-4 shrink-0 transition-transform duration-200",
                              isExpanded && "rotate-90"
                            )} />
                          </button>
                        )}

                        {/* Submenu items */}
                        {hasSubitems && (
                          <div className={cn(
                            'ml-6 mt-1 space-y-1 overflow-hidden transition-all duration-300 ease-in-out',
                            isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                          )}>
                            {item.subitems!.map((subitem) => {
                              const SubIcon = subitem.icon;
                              const isSubActive = isActive(subitem.href);

                              return (
                                <Link
                                  key={subitem.href}
                                  href={subitem.href}
                                  onClick={closeMobileMenu}
                                  className={cn(
                                    'group flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200',
                                    'hover:bg-accent hover:text-accent-foreground',
                                    isSubActive
                                      ? 'bg-accent/50 text-accent-foreground'
                                      : 'text-muted-foreground'
                                  )}
                                >
                                  {SubIcon && <SubIcon className="h-4 w-4 shrink-0" />}
                                  <span className="flex-1 whitespace-nowrap">{subitem.name}</span>
                                  {isSubActive && (
                                    <div className="h-1.5 w-1.5 rounded-full bg-brand" />
                                  )}
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </nav>

              {/* Mobile User Section */}
              <div className="p-3 border-t border-border">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-brand text-white text-xs">
                      {getInitials(user?.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {user?.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="mt-3 w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-md transition-all duration-200"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </aside>
          </>
        )}
      </div>
    </>
  );
}
