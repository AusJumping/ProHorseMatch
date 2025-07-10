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
import { ExternalLink } from "lucide-react";

const TermsDialog: React.FC = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="link" className="p-0 h-auto text-blue-600 hover:text-blue-800 underline font-medium">
          Terms of Service <ExternalLink className="h-3 w-3 ml-1 inline" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Pro Horse Match - Terms of Service</DialogTitle>
          <DialogDescription>
            Last Updated: May 20, 2025
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[500px] mt-4 pr-4">
          <div className="text-sm space-y-4">
            <h3 className="text-lg font-bold">1. Introduction</h3>
            <p>Welcome to Pro Horse Match ("we," "our," or "us"). By accessing or using our website, mobile application, and services (collectively, the "Services"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our Services.</p>
            
            <h3 className="text-lg font-bold">2. Definitions</h3>
            <p>"User" refers to any individual who accesses or uses our Services, including horse owners, prospective buyers, and browsers.</p>
            <p>"Content" refers to all information, text, images, videos, and other material provided by Users for listing horses or interacting on our platform.</p>
            
            <h3 className="text-lg font-bold">3. Account Registration</h3>
            <p>To access certain features of our Services, you may need to register for an account. You agree to provide accurate, current, and complete information during the registration process and to update such information to keep it accurate, current, and complete.</p>
            <p>You are responsible for safeguarding your password and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.</p>
            
            <h3 className="text-lg font-bold">4. Horse Listings</h3>
            <p>Users who list horses for sale or lease ("Sellers") are solely responsible for the accuracy and completeness of their listings, including but not limited to the horse's description, characteristics, health status, price, and images.</p>
            <p>Sellers must have the legal right to sell or lease the horse they list on our platform.</p>
            <p>We reserve the right to remove any listing that violates these Terms, appears fraudulent, or is otherwise inappropriate.</p>
            
            <h3 className="text-lg font-bold">4.1 Horse Listings and Buyer Responsibility</h3>
            <p>ProHorseMatch is a digital platform designed to connect prospective buyers with sellers of performance horses. We do not own, inspect, or verify any horses listed on the platform. All descriptions, images, videos, and claims made in a horse listing are the sole responsibility of the seller.</p>
            <p>ProHorseMatch does not guarantee the accuracy, health, condition, performance, temperament, or suitability of any horse listed. We do not conduct veterinary checks, training assessments, or behavioural evaluations, nor do we verify the claims made in any listing.</p>
            <p>Buyers are solely responsible for conducting their own due diligence before proceeding with any transaction. This includes, but is not limited to, arranging independent veterinary examinations, obtaining professional advice, and inspecting the horse in person where possible. Any decisions made based on listings on the platform are entirely at the buyer's own risk.</p>
            <p>By using ProHorseMatch, you acknowledge and agree that the platform bears no liability or responsibility for the condition, soundness, health, or suitability of any horse advertised. All negotiations, inspections, and purchases take place between the buyer and seller, and ProHorseMatch plays no role in the transaction process beyond facilitating initial contact.</p>
            
            <h3 className="text-lg font-bold">5. Transactions Between Users</h3>
            <p>Our Services facilitate connections between Sellers and prospective buyers. We are not a party to any transaction between Users.</p>
            <p>Users are responsible for negotiating the terms of any transaction, including payment methods, delivery arrangements, and contracts.</p>
            <p>We strongly recommend that prospective buyers thoroughly inspect any horse before purchase, including requesting a veterinary examination.</p>
            
            <h3 className="text-lg font-bold">6. Subscription Services</h3>
            <p>We offer various subscription plans that provide enhanced features and services. The specific features included in each plan are described on our website or app.</p>
            <p>By subscribing to a paid plan, you agree to pay all fees associated with your chosen subscription plan. Fees will be charged to your designated payment method on the billing date indicated.</p>
            <p>Subscriptions automatically renew unless canceled prior to the renewal date. You can cancel your subscription at any time through your account settings.</p>
            
            <h3 className="text-lg font-bold">7. Prohibited Content and Conduct</h3>
            <p>Users may not post Content or engage in conduct that:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Is false, misleading, or deceptive</li>
              <li>Infringes upon any copyright, trademark, or other intellectual property right</li>
              <li>Violates animal welfare laws or regulations</li>
              <li>Promotes illegal activities</li>
              <li>Contains offensive, abusive, or inappropriate language or images</li>
              <li>Harasses, threatens, or intimidates other Users</li>
            </ul>
            
            <h3 className="text-lg font-bold">8. Disclaimer of Warranties</h3>
            <p>Our Services are provided on an "as is" and "as available" basis. We make no warranties, express or implied, regarding the reliability, accuracy, or availability of our Services.</p>
            <p>We do not verify the accuracy of User-provided Content and make no representations or warranties regarding the quality, safety, or suitability of any horse listed on our platform.</p>
            
            <h3 className="text-lg font-bold">9. Limitation of Liability</h3>
            <p>To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or goodwill, resulting from your access to or use of our Services.</p>
            <p>In no event shall our total liability to you for all claims exceed the amount you have paid to us in the twelve (12) months preceding the event giving rise to the liability.</p>
            
            <h3 className="text-lg font-bold">10. Indemnification</h3>
            <p>You agree to indemnify, defend, and hold harmless our company, its officers, directors, employees, and agents from and against any claims, liabilities, damages, losses, costs, expenses, or fees (including reasonable attorneys' fees) arising from your violation of these Terms, your use of our Services, or your violation of any rights of another.</p>
            
            <h3 className="text-lg font-bold">11. Governing Law</h3>
            <p>These Terms shall be governed by and construed in accordance with the laws of Australia, without regard to its conflict of law provisions.</p>
            
            <h3 className="text-lg font-bold">12. Changes to Terms</h3>
            <p>We reserve the right to modify these Terms at any time. We will provide notice of significant changes by posting the new Terms on our website or app and updating the "Last Updated" date.</p>
            <p>Your continued use of our Services after any changes to the Terms constitutes your acceptance of the revised Terms.</p>
            
            <h3 className="text-lg font-bold">13. Contact Information</h3>
            <p>If you have any questions about these Terms, please contact us at support@prohorsematch.com.</p>
          </div>
        </ScrollArea>
        <DialogClose asChild>
          <Button className="mt-4">I Understand</Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
};

export default TermsDialog;