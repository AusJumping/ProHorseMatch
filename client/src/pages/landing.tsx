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
          Matching Performance Horses<br />
          with New Owners
        </h1>
        
        <p className="text-lg text-white mb-8">
          ProHorseMatch brings buyers and sellers together with intelligent matching technology.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            className="px-8 py-6 text-lg font-semibold text-white"
            style={{ backgroundColor: "#cdac6e", borderColor: "#cdac6e" }}
            onClick={() => navigate("/auth")}
          >
            Sign In
          </Button>
          <Button 
            className="px-8 py-6 text-lg font-semibold bg-white text-gray-800 hover:bg-gray-100"
            onClick={() => navigate("/browse")}
          >
            Browse Horses
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Landing;