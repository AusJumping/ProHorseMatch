import { useLocation } from "wouter";
import { 
  Home, Heart, Filter, MessageSquare, User, List, CreditCard, 
  Menu, ChevronRight, LogOut, ShieldAlert, Plus, Settings
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useState } from "react";
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger, 
  SheetHeader, 
  SheetTitle,
  SheetClose
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const MobileNavbar = () => {
  const [location, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  
  // Log for debugging
  console.log("MobileNavbar - Auth state:", { isAuthenticated, isSelling: user?.is_selling });
  
  const isOwner = user?.is_selling;

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout");
      window.location.href = "/";
    } catch (error) {
      toast({
        title: "Logout Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Side menu navigation items
  const renderMobileMenu = () => (
    <div className="flex flex-col h-full">
      <SheetHeader className="text-left border-b border-neutral-200 pb-4 mb-4">
        <SheetTitle className="font-accent text-xl">
          {user ? (
            <div className="flex flex-col">
              <span>{user.name || user.business_name || 'Welcome!'}</span>
              <span className="text-sm font-normal text-neutral-500">{user.email}</span>
            </div>
          ) : (
            'Menu'
          )}
        </SheetTitle>
      </SheetHeader>
      
      <div className="flex-1 flex flex-col space-y-1">
        <SheetClose asChild>
          <Button 
            variant="ghost" 
            className={`justify-start h-12 ${location === "/" ? "bg-primary-light bg-opacity-10 text-primary" : ""}`}
            onClick={() => {
              setTimeout(() => {
                navigate("/filter");
              }, 300);
            }}
          >
            <Home className="mr-3 h-5 w-5" />
            <span>Discover</span>
          </Button>
        </SheetClose>
        
        {isOwner && (
          <>
            <SheetClose asChild>
              <Button 
                variant="ghost" 
                className={`justify-start h-12 ${location === "/my-horses" ? "bg-primary-light bg-opacity-10 text-primary" : ""}`}
                onClick={() => navigate("/my-horses")}
              >
                <List className="mr-3 h-5 w-5" />
                <span>My Horses</span>
              </Button>
            </SheetClose>
            
            <SheetClose asChild>
              <Button 
                variant="ghost" 
                className={`justify-start h-12 ${location === "/add-horse" ? "bg-primary-light bg-opacity-10 text-primary" : ""}`}
                onClick={() => navigate("/add-horse")}
              >
                <Plus className="mr-3 h-5 w-5" />
                <span>Add Horse</span>
              </Button>
            </SheetClose>
          </>
        )}
        
        {isAuthenticated && !isOwner && (
          <SheetClose asChild>
            <Button 
              variant="ghost" 
              className={`justify-start h-12 ${location === "/favorites" ? "bg-primary-light bg-opacity-10 text-primary" : ""}`}
              onClick={() => navigate("/favorites")}
            >
              <Heart className="mr-3 h-5 w-5" />
              <span>Favorites</span>
            </Button>
          </SheetClose>
        )}
        
        {isAuthenticated && (
          <SheetClose asChild>
            <Button 
              variant="ghost" 
              className={`justify-start h-12 ${location === "/messages" ? "bg-primary-light bg-opacity-10 text-primary" : ""}`}
              onClick={() => navigate("/messages")}
            >
              <MessageSquare className="mr-3 h-5 w-5" />
              <span>Messages</span>
            </Button>
          </SheetClose>
        )}
        
        <SheetClose asChild>
          <Button 
            variant="ghost" 
            className={`justify-start h-12 ${location === "/filter" ? "bg-primary-light bg-opacity-10 text-primary" : ""}`}
            onClick={() => navigate("/filter")}
          >
            <Filter className="mr-3 h-5 w-5" />
            <span>Filter Horses</span>
          </Button>
        </SheetClose>
        
        <SheetClose asChild>
          <Button 
            variant="ghost" 
            className={`justify-start h-12 ${location === "/subscription" ? "bg-primary-light bg-opacity-10 text-primary" : ""}`}
            onClick={() => navigate("/subscription")}
          >
            <CreditCard className="mr-3 h-5 w-5" />
            <span>Subscription</span>
          </Button>
        </SheetClose>
        
        {user?.id === 1 && (
          <SheetClose asChild>
            <Button 
              variant="ghost" 
              className={`justify-start h-12 ${location === "/admin" ? "bg-primary-light bg-opacity-10 text-primary" : ""}`}
              onClick={() => navigate("/admin")}
            >
              <ShieldAlert className="mr-3 h-5 w-5" />
              <span>Admin Panel</span>
            </Button>
          </SheetClose>
        )}
      </div>
      
      {isAuthenticated && (
        <>
          <div className="border-t border-neutral-200 my-4 pt-4">
            <SheetClose asChild>
              <Button 
                variant="ghost" 
                className={`justify-start h-12 ${location === "/profile" ? "bg-primary-light bg-opacity-10 text-primary" : ""}`}
                onClick={() => navigate("/profile")}
              >
                <User className="mr-3 h-5 w-5" />
                <span>Profile</span>
              </Button>
            </SheetClose>
            
            <SheetClose asChild>
              <Button 
                variant="ghost" 
                className="justify-start h-12 text-destructive hover:text-destructive"
                onClick={handleLogout}
              >
                <LogOut className="mr-3 h-5 w-5" />
                <span>Logout</span>
              </Button>
            </SheetClose>
          </div>
        </>
      )}
      
      {!isAuthenticated && (
        <div className="border-t border-neutral-200 my-4 pt-4">
          <SheetClose asChild>
            <Button 
              variant="ghost" 
              className="justify-start h-12"
              onClick={() => {
                setTimeout(() => {
                  navigate("/auth");
                }, 300);
              }}
            >
              <LogOut className="mr-3 h-5 w-5 transform rotate-180" />
              <span>Login</span>
            </Button>
          </SheetClose>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Side Menu */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="fixed inset-y-0 left-0 z-50 h-full w-[80%] border-r bg-white p-4 shadow-lg sm:max-w-sm">
          {renderMobileMenu()}
        </SheetContent>
      </Sheet>
      
      {/* Bottom Navigation Bar - Fixed at bottom */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 py-2 px-4 z-40">
        <div className="flex justify-around items-center">
          <button 
            className="flex flex-col items-center text-neutral-500"
            onClick={() => setOpen(true)}
          >
            <Menu className="h-5 w-5" />
            <span className="text-xs mt-1 font-medium">Menu</span>
          </button>
          
          <button 
            className={`flex flex-col items-center ${
              location === "/browse" ? "text-primary" : "text-neutral-500"
            }`}
            onClick={() => {
              setTimeout(() => {
                navigate("/filter");
              }, 300);
            }}
          >
            <Home className="h-5 w-5" />
            <span className="text-xs mt-1 font-medium">Discover</span>
          </button>
          
          {isOwner ? (
            <button 
              className={`flex flex-col items-center ${
                location === "/my-horses" ? "text-primary" : "text-neutral-500"
              }`}
              onClick={(e) => {
                e.preventDefault();
                navigate("/my-horses");
              }}
            >
              <List className="h-5 w-5" />
              <span className="text-xs mt-1">My Horses</span>
            </button>
          ) : (
            <button 
              className={`flex flex-col items-center ${
                location === "/favorites" ? "text-primary" : "text-neutral-500"
              }`}
              onClick={(e) => {
                e.preventDefault();
                navigate("/favorites");
              }}
            >
              <Heart className="h-5 w-5" />
              <span className="text-xs mt-1">Favorites</span>
            </button>
          )}
          
          <button 
            className={`flex flex-col items-center ${
              location === "/messages" ? "text-primary" : "text-neutral-500"
            }`}
            onClick={(e) => {
              e.preventDefault();
              navigate("/messages");
            }}
          >
            <MessageSquare className="h-5 w-5" />
            <span className="text-xs mt-1">Messages</span>
          </button>
          
          <button 
            className={`flex flex-col items-center ${
              location === "/profile" ? "text-primary" : "text-neutral-500"
            }`}
            onClick={(e) => {
              e.preventDefault();
              navigate("/profile");
            }}
          >
            <User className="h-5 w-5" />
            <span className="text-xs mt-1">Profile</span>
          </button>
        </div>
      </nav>
      
      {/* Add padding at the bottom to prevent content from being hidden behind the fixed navbar */}
      <div className="h-16"></div>
    </>
  );
};

export default MobileNavbar;
