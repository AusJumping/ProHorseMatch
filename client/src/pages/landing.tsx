import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import logoImage from "../assets/logo.jpg";

const Landing = () => {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center" style={{ backgroundColor: "#2b2b2b" }}>
      <div className="max-w-4xl mx-auto text-center px-4">
        <div className="mb-8 flex justify-center">
          <img src={logoImage} alt="Pro Horse Match" className="h-28 object-contain" />
        </div>
        
        <h1 className="font-accent text-4xl font-bold mb-6 text-white">
          Connecting Performance Horses<br />
          with New Owners using Smart Matching Technology
        </h1>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            className="px-8 py-6 text-lg font-semibold text-white"
            style={{ backgroundColor: "#cdac6e", borderColor: "#cdac6e" }}
            onClick={() => navigate("/auth")}
          >
            Sign In
          </Button>
          <Button 
            className="px-8 py-6 text-lg font-semibold hover:opacity-90"
            style={{ backgroundColor: "#e4e3dd", color: "#2b2b2b", borderColor: "#e4e3dd" }}
            onClick={() => navigate("/browse")}
          >
            Register
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Landing;