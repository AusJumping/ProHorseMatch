import { useLocation } from "wouter";
import { 
  Home, Heart, Filter, User, List, CreditCard, 
  Menu, ChevronRight, LogOut, ShieldAlert, Plus, Settings, Search, MessageCircle, Shield
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
  const isAdmin = user?.email === "info@australianjumping.com.au";

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
        <Button 
          variant="ghost" 
          className={`justify-start h-12 ${location === "/filter" ? "bg-primary-light bg-opacity-10 text-primary" : ""}`}
          onClick={() => {
            console.log("Find Horses clicked, navigating to /filter");
            navigate("/filter");
            setOpen(false); // Close the sheet
          }}
        >
          <Home className="mr-3 h-5 w-5" />
          <span>Find Horses</span>
        </Button>
        
        {isAuthenticated && (
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
        )}
        
        {isOwner && (
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
        )}
        
        {isAuthenticated && (
          <SheetClose asChild>
            <Button 
              variant="ghost" 
              className={`justify-start h-12 ${location === "/favorites" ? "bg-primary-light bg-opacity-10 text-primary" : ""}`}
              onClick={() => navigate("/favorites")}
            >
              <Heart className="mr-3 h-5 w-5" />
              <span>My Favourites</span>
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
              <MessageCircle className="mr-3 h-5 w-5" />
              <span>Messages</span>
            </Button>
          </SheetClose>
        )}
        
        {isAuthenticated && (
          <SheetClose asChild>
            <Button 
              variant="ghost" 
              className={`justify-start h-12 ${location === "/saved-searches" ? "bg-primary-light bg-opacity-10 text-primary" : ""}`}
              onClick={() => navigate("/saved-searches")}
            >
              <Search className="mr-3 h-5 w-5" />
              <span>Saved Searches</span>
            </Button>
          </SheetClose>
        )}
        
        {isAdmin && (
          <SheetClose asChild>
            <Button 
              variant="ghost" 
              className={`justify-start h-12 ${
                location === "/admin" ? "bg-red-600 text-white" : "text-red-600 hover:bg-red-50"
              }`}
              onClick={() => navigate("/admin")}
            >
              <Shield className="mr-3 h-5 w-5" />
              <span>Admin Dashboard</span>
            </Button>
          </SheetClose>
        )}

        

        
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
        <SheetTrigger asChild>
          <Button 
            variant="outline" 
            size="icon" 
            className="h-16 w-16 p-1 border-2 border-[#cdac6e] hover:bg-[#cdac6e]/10" 
            aria-label="Menu"
          >
            <Menu className="h-14 w-14 stroke-[2.5px] text-[#cdac6e]" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="fixed inset-y-0 right-0 z-50 h-full w-[80%] border-l bg-white p-4 shadow-lg sm:max-w-sm">
          {renderMobileMenu()}
        </SheetContent>
      </Sheet>
    </>
  );
};

export default MobileNavbar;
