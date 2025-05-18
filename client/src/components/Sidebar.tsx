import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Home, Heart, MessageSquare, Clock, User, LogOut, Settings, List, PlusCircle, ShieldAlert } from "lucide-react";
import { useAuth } from "@/lib/auth";
import logoImage from "../assets/logo.jpg";

const Sidebar = () => {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const { user, isAuthenticated, logout } = useAuth();
  
  // Debug log with more details
  console.log("Sidebar - Auth state:", { isAuthenticated, user });

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
            className="h-[2.625rem] w-auto object-contain max-w-[184px]"
          />
        </div>
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
                navigate("/");
              }}
            >
              <Home className="mr-3 h-5 w-5" />
              <span>Home</span>
            </Button>
          </li>
          <li>
            <Button
              variant={location === "/favorites" ? "default" : "ghost"}
              className={`w-full justify-start px-5 py-3 ${
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
              className={`w-full justify-start px-5 py-3 ${
                location === "/messages" ? "bg-primary-light bg-opacity-10 text-primary" : "text-neutral-800"
              }`}
              onClick={(e) => {
                e.preventDefault();
                navigate("/messages");
              }}
            >
              <MessageSquare className="mr-3 h-5 w-5" />
              <span>Messages</span>
            </Button>
          </li>
          <li>
            <Button
              variant="ghost"
              className="w-full justify-start px-5 py-3 text-neutral-800 hover:bg-neutral-100"
              onClick={(e) => {
                e.preventDefault(); 
                navigate("/recent");
              }}
              disabled
            >
              <Clock className="mr-3 h-5 w-5" />
              <span>Recently Viewed</span>
            </Button>
          </li>
          {user?.is_selling && (
            <>
              <li>
                <Button
                  variant={location === "/my-horses" ? "default" : "ghost"}
                  className={`w-full justify-start px-5 py-3 ${
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
                  className={`w-full justify-start px-5 py-3 ${
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
              <li>
                <Button
                  variant={location === "/admin" ? "default" : "ghost"}
                  className={`w-full justify-start px-5 py-3 ${
                    location === "/admin" ? "bg-primary-light bg-opacity-10 text-primary" : "text-neutral-800"
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate("/admin");
                  }}
                >
                  <ShieldAlert className="mr-3 h-5 w-5" />
                  <span>Admin Panel</span>
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
              className="w-full justify-start px-5 py-3"
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
              className="w-full justify-start px-5 py-3"
              onClick={(e) => {
                e.preventDefault();
                navigate("/account-settings");
              }}
            >
              <Settings className="mr-3 h-5 w-5" />
              Account
            </Button>
          </li>
          <li>
            <Button 
              variant="outline"
              className="w-full justify-start px-5 py-3"
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
