import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import logoImage from "../assets/logo.jpg";

const Landing = () => {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center" style={{ backgroundColor: "#2b2b2b" }}>
      <div className="max-w-4xl mx-auto text-center px-4">
        <div className="bg-white p-10 rounded-lg shadow-md mb-8">
          <div className="mb-8 flex justify-center">
            <img src={logoImage} alt="Pro Horse Match" className="h-20 object-contain" />
          </div>
          
          <h1 className="font-accent text-4xl font-bold mb-6 text-gray-800">
            Connect with Your Perfect Equine Partner
          </h1>
          
          <p className="text-lg text-gray-600 mb-8">
            Pro Horse Match brings buyers and sellers together with intelligent matching 
            technology designed specifically for the equestrian community.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              className="px-8 py-6 text-lg font-semibold bg-primary hover:bg-primary/90"
              onClick={() => navigate("/auth")}
            >
              Sign In
            </Button>
            <Button 
              className="px-8 py-6 text-lg font-semibold"
              variant="outline"
              onClick={() => navigate("/browse")}
            >
              Browse Horses
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;