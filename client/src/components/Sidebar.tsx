import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Home, Heart, User, LogOut, Settings, List, PlusCircle, ShieldAlert, CreditCard, MessageCircle, Search, Shield } from "lucide-react";
import { useAuth } from "@/lib/auth";
import logoImage from "../assets/logo-filter.png";
import { useQuery } from "@tanstack/react-query";

const Sidebar = () => {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const { user, isAuthenticated, logout } = useAuth();
  
  // Fetch conversations to calculate total unread messages for navigation badge
  const { data: conversations = [] } = useQuery({
    queryKey: ["/api/conversations"],
    enabled: isAuthenticated && !!user,
    refetchInterval: 5000, // Refresh every 5 seconds to check for new messages
  });

  // Calculate total unread messages across all conversations
  const totalUnreadMessages = conversations.reduce((total: number, conversation: any) => {
    return total + (conversation.unread_count || 0);
  }, 0);

  // Debug log with more details
  console.log("Sidebar - Auth state:", { isAuthenticated, user });

  // Check if current user is admin
  const isAdmin = user?.email === "info@australianjumping.com.au";

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logged out",
        description: "You have been logged out successfully.",
      });
      navigate("/auth");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to logout. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <aside className="w-64 bg-white border-r border-neutral-200 flex flex-col">
      <div className="py-4 px-3 border-b border-neutral-200 bg-white">
        <div className="flex justify-center">
          <img 
            src={logoImage} 
            alt="Pro Horse Match" 
            className="h-[5.25rem] w-auto object-contain max-w-[368px]"
          />
        </div>
        {isAuthenticated && user && (
          <div className="mt-3 text-center">
            <p className="text-sm font-medium text-primary">
              Welcome, {user.name || user.business_name || 'User'}
            </p>
          </div>
        )}
      </div>
      
      <div className="flex-1 py-5">
        <ul className="space-y-1">
          <li>
            <Button
              variant={location === "/" ? "default" : "ghost"}
              className={`w-full justify-start px-5 py-3 hover:bg-[#cdac6e] hover:text-white ${
                location === "/" ? "bg-primary-light bg-opacity-10 text-primary" : "text-neutral-800"
              }`}
              onClick={(e) => {
                e.preventDefault();
                window.location.href = "/filter";
              }}
            >
              <Home className="mr-3 h-5 w-5" />
              <span>Find Horses</span>
            </Button>
          </li>
          <li>
            <Button
              variant={location === "/favorites" ? "default" : "ghost"}
              className={`w-full justify-start px-5 py-3 hover:bg-[#cdac6e] hover:text-white ${
                location === "/favorites" ? "bg-primary-light bg-opacity-10 text-primary" : "text-neutral-800"
              }`}
              onClick={(e) => {
                e.preventDefault();
                navigate("/favorites");
              }}
            >
              <Heart className="mr-3 h-5 w-5" />
              <span>My Favorites</span>
            </Button>
          </li>
          <li>
            <Button
              variant={location === "/messages" ? "default" : "ghost"}
              className={`w-full justify-start px-5 py-3 relative hover:bg-[#cdac6e] hover:text-white ${
                location === "/messages" ? "bg-primary-light bg-opacity-10 text-primary" : "text-neutral-800"
              }`}
              onClick={(e) => {
                e.preventDefault();
                navigate("/messages");
              }}
            >
              <MessageCircle className="mr-3 h-5 w-5" />
              <span>Messages</span>
              {totalUnreadMessages > 0 && (
                <Badge 
                  variant="destructive" 
                  className="ml-auto min-w-[20px] h-5 text-xs px-1.5 bg-red-500 hover:bg-red-500"
                >
                  {totalUnreadMessages}
                </Badge>
              )}
            </Button>
          </li>
          <li>
            <Button
              variant={location === "/saved-searches" ? "default" : "ghost"}
              className={`w-full justify-start px-5 py-3 hover:bg-[#cdac6e] hover:text-white ${
                location === "/saved-searches" ? "bg-primary-light bg-opacity-10 text-primary" : "text-neutral-800"
              }`}
              onClick={(e) => {
                e.preventDefault();
                navigate("/saved-searches");
              }}
            >
              <Search className="mr-3 h-5 w-5" />
              <span>Saved Searches</span>
            </Button>
          </li>

          {isAdmin && (
            <li>
              <Button
                variant={location === "/admin" ? "default" : "ghost"}
                className={`w-full justify-start px-5 py-3 ${
                  location === "/admin" ? "bg-red-600 text-white" : "text-red-600 hover:bg-red-50"
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/admin");
                }}
              >
                <Shield className="mr-3 h-5 w-5" />
                <span>Admin Dashboard</span>
              </Button>
            </li>
          )}

          {user?.is_selling && (
            <>
              <li>
                <Button
                  variant={location === "/my-horses" ? "default" : "ghost"}
                  className={`w-full justify-start px-5 py-3 hover:bg-[#cdac6e] hover:text-white ${
                    location === "/my-horses" ? "bg-primary-light bg-opacity-10 text-primary" : "text-neutral-800"
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate("/my-horses");
                  }}
                >
                  <List className="mr-3 h-5 w-5" />
                  <span>My Horses</span>
                </Button>
              </li>
              <li>
                <Button
                  variant={location === "/add-horse" ? "default" : "ghost"}
                  className={`w-full justify-start px-5 py-3 hover:bg-[#cdac6e] hover:text-white ${
                    location === "/add-horse" ? "bg-primary-light bg-opacity-10 text-primary" : "text-neutral-800"
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate("/add-horse");
                  }}
                >
                  <PlusCircle className="mr-3 h-5 w-5" />
                  <span>Add Horse</span>
                </Button>
              </li>
            </>
          )}
        </ul>
        
        <div className="border-t border-neutral-200 my-6"></div>
        
        <ul className="space-y-1 px-5">
          <li>
            <Button 
              variant="outline" 
              className="w-full justify-start px-5 py-3 hover:bg-[#cdac6e] hover:text-white"
              onClick={(e) => {
                e.preventDefault();
                navigate("/profile");
              }}
            >
              <User className="mr-3 h-5 w-5" />
              Profile
            </Button>
          </li>
          <li>
            <Button 
              variant="outline"
              className="w-full justify-start px-5 py-3 hover:bg-[#cdac6e] hover:text-white"
              onClick={(e) => {
                e.preventDefault();
                navigate("/subscription");
              }}
            >
              <CreditCard className="mr-3 h-5 w-5" />
              Subscription
            </Button>
          </li>
          {/* Account Settings link removed as requested */}
          <li>
            <Button 
              variant="outline"
              className="w-full justify-start px-5 py-3 hover:bg-[#cdac6e] hover:text-white"
              onClick={(e) => {
                e.preventDefault();
                handleLogout();
              }}
            >
              <LogOut className="mr-3 h-5 w-5" />
              Logout
            </Button>
          </li>
        </ul>
      </div>
      
      <div className="mt-auto p-5">
      </div>
    </aside>
  );
};

export default Sidebar;
