import { useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import logoImage from "../assets/logo.jpg";
import { useAuth } from "@/lib/auth";

const Landing = () => {
  const [, navigate] = useLocation();
  const { isAuthenticated, isLoading } = useAuth();

  // Returning users go directly to Find Horses instead of the dashboard.
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate("/filter", { replace: true });
    }
  }, [isLoading, isAuthenticated, navigate]);

  // Avoid flashing login buttons while checking a saved session.
  if (isLoading || isAuthenticated) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center"
        style={{ backgroundColor: "#2b2b2b" }}
      >
        <img src={logoImage} alt="Pro Horse Match" className="h-28 object-contain mb-8" />
        <div
          style={{
            width: 36,
            height: 36,
            border: "3px solid rgba(201,169,110,0.25)",
            borderTopColor: "#c9a96e",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

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
        </div>
      </div>
    </div>
  );
};

export default Landing;