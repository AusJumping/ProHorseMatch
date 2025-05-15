import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Home, Heart, MessageSquare, Clock, User, LogOut, Settings, List, PlusCircle } from "lucide-react";
import { useAuth } from "@/lib/auth";

const Sidebar = () => {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const { user, isAuthenticated, logout } = useAuth();
  
  // Debug log
  console.log("Sidebar - Auth state:", { isAuthenticated });

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
      <div className="p-5 border-b border-neutral-200">
        <h1 className="font-display font-bold text-2xl text-primary">
          Pro<span className="text-accent">Horse</span>Match
        </h1>
      </div>
      
      <div className="flex-1 py-5">
        <ul className="space-y-1">
          <li>
            <Button
              variant={location === "/" ? "default" : "ghost"}
              className={`w-full justify-start px-5 py-3 ${
                location === "/" ? "bg-primary-light bg-opacity-10 text-primary" : "text-neutral-800"
              }`}
              onClick={() => navigate("/")}
            >
              <Home className="mr-3 h-5 w-5" />
              <span>Home</span>
            </Button>
          </li>
          <li>
            <Button
              variant="ghost"
              className="w-full justify-start px-5 py-3 text-neutral-800 hover:bg-neutral-100"
              onClick={() => navigate("/favorites")}
              disabled
            >
              <Heart className="mr-3 h-5 w-5" />
              <span>My Favorites</span>
            </Button>
          </li>
          <li>
            <Button
              variant={location === "/messages" ? "default" : "ghost"}
              className={`w-full justify-start px-5 py-3 ${
                location === "/messages" ? "bg-primary-light bg-opacity-10 text-primary" : "text-neutral-800"
              }`}
              onClick={() => navigate("/messages")}
            >
              <MessageSquare className="mr-3 h-5 w-5" />
              <span>Messages</span>
              <span className="ml-auto bg-destructive text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">3</span>
            </Button>
          </li>
          <li>
            <Button
              variant="ghost"
              className="w-full justify-start px-5 py-3 text-neutral-800 hover:bg-neutral-100"
              onClick={() => navigate("/recent")}
              disabled
            >
              <Clock className="mr-3 h-5 w-5" />
              <span>Recently Viewed</span>
            </Button>
          </li>
          {user?.type === "owner" && (
            <>
              <li>
                <Button
                  variant={location === "/my-horses" ? "default" : "ghost"}
                  className={`w-full justify-start px-5 py-3 ${
                    location === "/my-horses" ? "bg-primary-light bg-opacity-10 text-primary" : "text-neutral-800"
                  }`}
                  onClick={() => navigate("/my-horses")}
                >
                  <List className="mr-3 h-5 w-5" />
                  <span>My Horses</span>
                </Button>
              </li>
              <li>
                <Button
                  variant={location === "/add-horse" ? "default" : "ghost"}
                  className={`w-full justify-start px-5 py-3 ${
                    location === "/add-horse" ? "bg-primary-light bg-opacity-10 text-primary" : "text-neutral-800"
                  }`}
                  onClick={() => navigate("/add-horse")}
                >
                  <PlusCircle className="mr-3 h-5 w-5" />
                  <span>Add Horse</span>
                </Button>
              </li>
            </>
          )}
        </ul>
      </div>
      
      <div className="mt-auto p-5 border-t border-neutral-200">
        {user ? (
          <>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-neutral-200 flex items-center justify-center text-neutral-600">
                <span>{user.name ? user.name.charAt(0) : (user.business_name ? user.business_name.charAt(0) : "U")}</span>
              </div>
              <div>
                <p className="font-medium text-neutral-900">
                  {user.name || user.business_name || "User"}
                </p>
                <p className="text-sm text-neutral-500">
                  {user.type === "customer" ? "Searching Account" : "Selling Account"}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => navigate("/profile")}
              >
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Button>
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </>
        ) : (
          <Button 
            className="w-full" 
            onClick={() => navigate("/auth")}
          >
            <User className="mr-2 h-4 w-4" />
            Sign In
          </Button>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
