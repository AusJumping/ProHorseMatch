import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import logoImage from "../assets/logo.jpg";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

const Landing = () => {
  const [, navigate] = useLocation();
  const { isAuthenticated, logout } = useAuth();
  const { toast } = useToast();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center" style={{ backgroundColor: "#2b2b2b" }}>
      <div className="max-w-4xl mx-auto text-center px-4">
        <div className="mb-8 flex justify-center">
          <img src={logoImage} alt="Pro Horse Match" className="h-40 object-contain" />
        </div>
        
        <h1 className="font-accent text-xl font-bold mb-6" style={{ color: "#e4e2dd" }}>
          Using Smart Technology to<br />
          Connect Performance Horses<br />
          with New Owners
        </h1>
        
        <div className="mb-8">
          <p className="text-2xl font-bold mb-2" style={{ color: "#cdac6e" }}>
            FREE Horse Listings
          </p>
          <p className="text-lg" style={{ color: "#e4e2dd" }}>
            (no payment details required)
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {isAuthenticated ? (
            <Button 
              className="px-8 sm:py-6 py-3 text-lg font-semibold text-white"
              style={{ backgroundColor: "#cdac6e", borderColor: "#cdac6e" }}
              onClick={async () => {
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
              }}
            >
              Log Out
            </Button>
          ) : (
            <>
              <Button 
                className="px-8 sm:py-6 py-3 text-lg font-semibold text-white"
                style={{ backgroundColor: "#cdac6e", borderColor: "#cdac6e" }}
                onClick={() => navigate("/auth")}
              >
                Sign In
              </Button>
              <Button 
                className="px-8 sm:py-6 py-3 text-lg font-semibold hover:opacity-90"
                style={{ backgroundColor: "#e4e3dd", color: "#2b2b2b", borderColor: "#e4e3dd" }}
                onClick={() => navigate("/auth?tab=register")}
              >
                Register
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Landing;