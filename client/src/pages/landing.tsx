import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import logoImage from "../assets/logo.jpg";

const Landing = () => {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center" style={{ backgroundColor: "#e4e2dd" }}>
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
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="font-accent text-xl font-semibold mb-2 text-primary">For Buyers</h3>
            <p className="text-gray-600">Find your ideal horse with advanced search and matching technology.</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="font-accent text-xl font-semibold mb-2 text-primary">For Sellers</h3>
            <p className="text-gray-600">Connect with serious buyers and showcase your horses to the right audience.</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="font-accent text-xl font-semibold mb-2 text-primary">Expert Support</h3>
            <p className="text-gray-600">Our equestrian specialists are available to assist with your journey.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;