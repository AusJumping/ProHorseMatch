import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  Bell,
  ChevronRight,
  CreditCard,
  Heart,
  Home,
  List,
  LogOut,
  MessageCircle,
  Plus,
  Search,
  Shield,
  UserRound,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const MobileNavbar = () => {
  const [location, navigate] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const { toast } = useToast();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const isAdmin = user?.email === "info@australianjumping.com.au";
  const { data: conversations = [] } = useQuery<Array<{ unread_count?: number }>>({
    queryKey: ["/api/conversations"],
    enabled: isAuthenticated,
    refetchInterval: 10000,
  });
  const unreadMessages = conversations.reduce((total, conversation) => total + (conversation.unread_count || 0), 0);

  const visit = (path: string) => {
    navigate(path);
    setProfileMenuOpen(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      setProfileMenuOpen(false);
      navigate("/auth");
    } catch {
      toast({
        title: "Logout error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const openPrivateDestination = (path: string) => {
    visit(isAuthenticated ? path : "/auth");
  };

  const active = (path: string) => location === path || (path === "/filter" && location === "/");

  const tabs = [
    { label: "Find Horses", path: "/filter", icon: Home, action: () => visit("/filter") },
    { label: "Favourites", path: "/favorites", icon: Heart, action: () => openPrivateDestination("/favorites") },
    { label: "Messages", path: "/messages", icon: MessageCircle, action: () => openPrivateDestination("/messages"), badge: unreadMessages },
    { label: "Alerts", path: "/saved-searches", icon: Bell, action: () => openPrivateDestination("/saved-searches") },
  ];

  const menuItem = (label: string, path: string, Icon: typeof Home) => (
    <Button
      key={path}
      type="button"
      variant="ghost"
      className={`h-12 w-full justify-start rounded-xl px-3 text-left ${
        location === path ? "bg-[#cdac6e]/15 text-[#705d37]" : "text-[#3c3b37] hover:bg-[#f1efe9]"
      }`}
      onClick={() => visit(path)}
    >
      <Icon className="mr-3 h-[1.1rem] w-[1.1rem]" aria-hidden="true" />
      <span className="flex-1">{label}</span>
      <ChevronRight className="h-4 w-4 text-[#aaa69d]" aria-hidden="true" />
    </Button>
  );

  return (
    <>
      <nav
        aria-label="Main navigation"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-[#dedbd3] bg-[#f8f7f4]/95 px-1 pt-1.5 shadow-[0_-8px_28px_rgba(44,40,31,0.08)] backdrop-blur-md"
        style={{ paddingBottom: "max(0.45rem, env(safe-area-inset-bottom))" }}
      >
        <div className="mx-auto grid max-w-xl grid-cols-5">
          {tabs.map(({ label, path, icon: Icon, action, badge }) => (
            <button
              key={label}
              type="button"
              onClick={action}
              aria-current={active(path) ? "page" : undefined}
              className={`relative flex min-h-[3.35rem] flex-col items-center justify-center gap-1 rounded-xl px-1 text-[0.63rem] font-medium tracking-[0.015em] transition-colors ${
                active(path) ? "text-[#705d37]" : "text-[#77756f] hover:text-foreground"
              }`}
            >
              <span className={`relative flex h-6 w-8 items-center justify-center rounded-full ${active(path) ? "bg-[#cdac6e]/20" : ""}`}>
                <Icon className="h-[1.15rem] w-[1.15rem]" strokeWidth={active(path) ? 2.2 : 1.8} aria-hidden="true" />
                {badge && badge > 0 ? (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#9e5344] px-1 text-[9px] font-bold text-white">
                    {badge > 99 ? "99+" : badge}
                  </span>
                ) : null}
              </span>
              <span>{label}</span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => setProfileMenuOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={profileMenuOpen}
            className={`flex min-h-[3.35rem] flex-col items-center justify-center gap-1 rounded-xl px-1 text-[0.63rem] font-medium tracking-[0.015em] transition-colors ${
              location === "/profile" || profileMenuOpen ? "text-[#705d37]" : "text-[#77756f] hover:text-foreground"
            }`}
          >
            <span className={`flex h-6 w-8 items-center justify-center rounded-full ${location === "/profile" || profileMenuOpen ? "bg-[#cdac6e]/20" : ""}`}>
              <UserRound className="h-[1.15rem] w-[1.15rem]" strokeWidth={1.8} aria-hidden="true" />
            </span>
            <span>Profile</span>
          </button>
        </div>
      </nav>

      <Sheet open={profileMenuOpen} onOpenChange={setProfileMenuOpen}>
        <SheetContent
          side="right"
          className="w-[min(88vw,22rem)] border-l border-[#dedbd3] bg-[#faf9f6] p-5"
          style={{ paddingTop: "calc(1.25rem + env(safe-area-inset-top, 0px))" }}
        >
          <SheetHeader className="mb-5 border-b border-[#e6e3dc] pb-4 text-left">
            <SheetTitle className="font-accent text-xl text-[#34332f]">
              {isAuthenticated ? user?.name || user?.business_name || "Your account" : "Welcome"}
            </SheetTitle>
            {isAuthenticated && user?.email ? (
              <p className="text-sm font-normal text-muted-foreground">{user.email}</p>
            ) : (
              <p className="text-sm font-normal text-muted-foreground">Sign in to save horses and message sellers.</p>
            )}
          </SheetHeader>
          <div className="flex flex-col gap-1.5">
            {isAuthenticated ? (
              <>
                {menuItem("Profile", "/profile", UserRound)}
                {menuItem("Saved Searches", "/saved-searches", Search)}
                {user?.is_selling ? (
                  <>
                    {menuItem("My Horses", "/my-horses", List)}
                    {menuItem("Add Horse", "/add-horse", Plus)}
                  </>
                ) : null}
                {isAdmin ? menuItem("Admin Dashboard", "/admin", Shield) : null}
                {menuItem("Subscription", "/subscription", CreditCard)}
                <Button
                  type="button"
                  variant="ghost"
                  className="mt-3 h-12 justify-start rounded-xl px-3 text-destructive hover:bg-destructive/5 hover:text-destructive"
                  onClick={() => void handleLogout()}
                >
                  <LogOut className="mr-3 h-[1.1rem] w-[1.1rem]" aria-hidden="true" />
                  Log out
                </Button>
              </>
            ) : (
              <>
                <Button type="button" className="h-12 justify-start rounded-xl" onClick={() => visit("/auth")}>
                  <UserRound className="mr-3 h-[1.1rem] w-[1.1rem]" aria-hidden="true" />
                  Log in
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 justify-start rounded-xl border-[#d9d4c8]"
                  onClick={() => visit("/auth?tab=register")}
                >
                  <Plus className="mr-3 h-[1.1rem] w-[1.1rem]" aria-hidden="true" />
                  Create account
                </Button>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default MobileNavbar;
