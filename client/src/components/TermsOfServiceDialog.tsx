import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

const TermsOfServiceDialog: React.FC = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="link" className="p-0 h-auto text-blue-600 hover:text-blue-800 underline font-medium">
          Terms of Service
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">ProHorseMatch Terms and Conditions</DialogTitle>
          <DialogDescription>
            Effective Date: January 2025
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[500px] mt-4 pr-4">
          <div className="text-sm space-y-4">
            <div>
              <h3 className="text-lg font-bold mb-2">1. Introduction</h3>
              <p>Welcome to ProHorseMatch ("we," "our," or "us"). By accessing or using our website, mobile application, and related services (collectively, the "Services"), you agree to be bound by these Terms and Conditions ("Terms"). If you do not agree to these Terms, you may not use our Services.</p>
            </div>

            <div>
              <h3 className="text-lg font-bold mb-2">2. Definitions</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>"User" refers to any individual or entity who accesses or uses our Services, including horse owners, prospective buyers, or browsers.</li>
                <li>"Content" refers to all information, text, images, videos, and other materials provided by Users on the platform.</li>
                <li>"Sellers" are Users who create horse listings for sale or lease.</li>
                <li>"Searchers" are Users seeking to purchase horses through contact made with 'Sellers' using our Services.</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-bold mb-2">3. Eligibility</h3>
              <p>You must be at least 18 years old, or the legal age of majority in your jurisdiction, to use our Services. By using the Services, you represent and warrant that you meet these requirements.</p>
            </div>

            <div>
              <h3 className="text-lg font-bold mb-2">4. Account Registration</h3>
              <p>To access certain features, you may need to create an account. You agree to provide accurate, current, and complete information, and to update it as necessary. You are responsible for safeguarding your login details and for all activities under your account.</p>
            </div>

            <div>
              <h3 className="text-lg font-bold mb-2">5. Horse Listings</h3>
              <p>Sellers are solely responsible for the accuracy and completeness of their listings, including the horse's description, age, health, performance history, price, and images. ProHorseMatch does not verify or guarantee the accuracy of listings.</p>
            </div>

            <div>
              <h3 className="text-lg font-bold mb-2">6. Transactions Between Users</h3>
              <p>Our Services facilitate introductions between Sellers and Buyers. We are not a party to any transaction, agreement, or dispute between Users. All negotiations, contracts, and exchanges of funds take place directly between Users.</p>
            </div>

            <div>
              <h3 className="text-lg font-bold mb-2">7. Subscription Services</h3>
              <p>We may offer subscription plans with enhanced features. Details of these plans, including pricing and benefits, are provided in-app or on our website. Subscriptions are non-transferable and may be subject to auto-renewal unless cancelled in accordance with our cancellation policy.</p>
            </div>

            <div>
              <h3 className="text-lg font-bold mb-2">8. Payments and Refunds</h3>
              <p>All payments for subscription services are processed through third-party providers. By purchasing a subscription, you agree to abide by the payment terms provided at checkout. Refunds are granted only where required by law.</p>
            </div>

            <div>
              <h3 className="text-lg font-bold mb-2">9. Prohibited Content and Conduct</h3>
              <p className="mb-2">You agree not to:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Post false, misleading, or deceptive Content.</li>
                <li>Infringe on any intellectual property rights.</li>
                <li>Post Content that is unlawful, offensive, defamatory, obscene, or harmful.</li>
                <li>Attempt to interfere with or disrupt the Services.</li>
              </ul>
              <p className="mt-2">We reserve the right to remove Content or suspend accounts that violate these Terms.</p>
            </div>

            <div>
              <h3 className="text-lg font-bold mb-2">10. Communication with Users</h3>
              <p>By creating an account, you consent to receive communications from us electronically. We may contact you via email from time to time regarding issues, updates, or changes to our Services and offerings.</p>
            </div>

            <div>
              <h3 className="text-lg font-bold mb-2">11. Intellectual Property</h3>
              <p>All trademarks, logos, and proprietary materials used in connection with the Services are owned by us or our licensors. You may not use, copy, or distribute our intellectual property without prior written consent.</p>
            </div>

            <div>
              <h3 className="text-lg font-bold mb-2">12. Disclaimer of Warranties</h3>
              <p>The Services are provided "as is" and "as available." We make no warranties or representations about the accuracy, reliability, or availability of the Services or Content.</p>
            </div>

            <div>
              <h3 className="text-lg font-bold mb-2">13. Limitation of Liability</h3>
              <p>To the maximum extent permitted by law, ProHorseMatch shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or relating to your use of the Services.</p>
            </div>

            <div>
              <h3 className="text-lg font-bold mb-2">14. Indemnity</h3>
              <p>You agree to indemnify and hold harmless ProHorseMatch, its affiliates, and employees from any claims, damages, losses, or expenses (including legal fees) arising out of your use of the Services or violation of these Terms.</p>
            </div>

            <div>
              <h3 className="text-lg font-bold mb-2">15. Termination</h3>
              <p>We may suspend or terminate your account or access to the Services at any time if we reasonably believe you have violated these Terms or engaged in harmful conduct.</p>
            </div>

            <div>
              <h3 className="text-lg font-bold mb-2">16. Governing Law</h3>
              <p>These Terms are governed by the laws of Australia. Any disputes will be resolved exclusively in the courts of Australia.</p>
            </div>

            <div>
              <h3 className="text-lg font-bold mb-2">17. Changes to the Terms</h3>
              <p>We reserve the right to modify these Terms at any time. If changes are made, we will notify Users by posting the updated Terms on our website or app. Continued use of the Services after such updates constitutes acceptance of the revised Terms.</p>
            </div>
          </div>
        </ScrollArea>
        <DialogClose asChild>
          <Button className="mt-4">I Understand</Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
};

export default TermsOfServiceDialog;
