import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Layout from "@/components/Layout";
import { useLocation } from "wouter";
import { Plus, Search, ArrowRight } from "lucide-react";

export default function ChooseAction() {
  const [, navigate] = useLocation();

  const handleListHorse = () => {
    navigate('/add-horse');
  };

  const handleSearchHorses = () => {
    navigate('/welcome');
  };

  return (
    <Layout pageTitle="Choose Your Next Step">
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Welcome to ProHorseMatch! 🎉
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Your Beta subscription is now active. What would you like to do first?
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* List a Horse Card */}
            <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer border-2 hover:border-[#cdac6e]" onClick={handleListHorse}>
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 w-16 h-16 bg-[#cdac6e] rounded-full flex items-center justify-center">
                  <Plus className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-gray-900">
                  List a Horse
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Add your horse to our marketplace and connect with potential buyers
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <ul className="text-sm text-gray-600 space-y-2 mb-6">
                  <li>• Create detailed horse profiles</li>
                  <li>• Upload photos and videos</li>
                  <li>• Set your asking price</li>
                  <li>• Receive inquiries from buyers</li>
                </ul>
                <Button 
                  onClick={handleListHorse}
                  className="w-full bg-[#cdac6e] hover:bg-[#b8965d] text-white"
                >
                  Start Listing
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            {/* Search for Horses Card */}
            <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer border-2 hover:border-[#cdac6e]" onClick={handleSearchHorses}>
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 w-16 h-16 bg-[#cdac6e] rounded-full flex items-center justify-center">
                  <Search className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-gray-900">
                  Search for Horses
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Browse our curated selection of performance horses
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <ul className="text-sm text-gray-600 space-y-2 mb-6">
                  <li>• Advanced filtering options</li>
                  <li>• View detailed horse profiles</li>
                  <li>• Contact sellers directly</li>
                  <li>• Save favorites for later</li>
                </ul>
                <Button 
                  onClick={handleSearchHorses}
                  className="w-full bg-[#cdac6e] hover:bg-[#b8965d] text-white"
                >
                  Start Searching
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-8">
            <p className="text-sm text-gray-500">
              You can always switch between listing and searching at any time from your dashboard.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}