import { useLocation } from "wouter";
import { Home, Heart, Filter, MessageSquare, User, PlusCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

const MobileNavbar = () => {
  const [location, navigate] = useLocation();
  
  // Fetch user data to determine if user is an owner
  const { data: user } = useQuery({
    queryKey: ['/api/auth/me'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        if (res.status === 401) return null;
        return await res.json();
      } catch (error) {
        return null;
      }
    }
  });

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
