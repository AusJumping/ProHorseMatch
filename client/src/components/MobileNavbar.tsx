import { useLocation } from "wouter";
import { Home, Heart, Filter, MessageSquare, User, PlusCircle } from "lucide-react";
import { useAuth } from "@/lib/auth";

const MobileNavbar = () => {
  const [location, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();
  
  // Log for debugging
  console.log("MobileNavbar - Auth state:", { isAuthenticated, userType: user?.type });
  
  const isOwner = user?.type === "owner";

  return (
    <nav className="bg-white border-t border-neutral-200 py-2 px-4">
      <div className="flex justify-around items-center">
        <button 
          className={`flex flex-col items-center ${
            location === "/" ? "text-primary" : "text-neutral-500"
          }`}
          onClick={() => navigate("/")}
        >
          <Home className="h-5 w-5" />
          <span className="text-xs mt-1 font-medium">Discover</span>
        </button>
        
        {isOwner ? (
          <button 
            className={`flex flex-col items-center ${
              location === "/add-horse" ? "text-primary" : "text-neutral-500"
            }`}
            onClick={() => navigate("/add-horse")}
          >
            <PlusCircle className="h-5 w-5" />
            <span className="text-xs mt-1">Add Horse</span>
          </button>
        ) : (
          <button 
            className={`flex flex-col items-center ${
              location === "/favorites" ? "text-primary" : "text-neutral-500"
            }`}
            onClick={() => navigate("/favorites")}
          >
            <Heart className="h-5 w-5" />
            <span className="text-xs mt-1">Favorites</span>
          </button>
        )}
        
        <button 
          className={`flex flex-col items-center ${
            location === "/messages" ? "text-primary" : "text-neutral-500"
          }`}
          onClick={() => navigate("/messages")}
        >
          <MessageSquare className="h-5 w-5" />
          <span className="text-xs mt-1">Messages</span>
        </button>
        
        <button 
          className={`flex flex-col items-center ${
            location === "/filter" ? "text-primary" : "text-neutral-500"
          }`}
          onClick={() => navigate("/filter")}
        >
          <Filter className="h-5 w-5" />
          <span className="text-xs mt-1">Filter</span>
        </button>
        
        <button 
          className={`flex flex-col items-center ${
            location === "/profile" ? "text-primary" : "text-neutral-500"
          }`}
          onClick={() => navigate("/profile")}
        >
          <User className="h-5 w-5" />
          <span className="text-xs mt-1">Profile</span>
        </button>
      </div>
    </nav>
  );
};

export default MobileNavbar;
