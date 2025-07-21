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
          <DialogTitle className="text-xl font-bold">Terms of Service</DialogTitle>
          <DialogDescription>
            Effective Date: 21 July 2025
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[500px] mt-4 pr-4">
          <div className="text-sm space-y-4">
            <h3 className="text-lg font-bold">Disclaimer of Liability and User Responsibility</h3>
            
            <div>
              <h4 className="font-semibold">1. Content Accuracy and Listings</h4>
              <p>ProHorseMatch is a platform that facilitates connections between buyers and sellers of performance horses. All listings, including descriptions, images, health records, training history, and other horse-related content, are provided by the users (sellers). ProHorseMatch does not create, verify, or endorse the accuracy, completeness, legality, or authenticity of any listing content. Users of the platform acknowledge and agree that the responsibility for all content posted lies solely with the user who posted it.</p>
            </div>
            
            <div>
              <h4 className="font-semibold">2. Buyer and Seller Due Diligence</h4>
              <p>ProHorseMatch strongly recommends that both buyers and sellers conduct their own due diligence before entering into any transaction. This includes, but is not limited to, verifying the identity and reputation of the other party, independently assessing the suitability, training level, and health of the horse, and seeking professional advice or veterinary assessments where appropriate.</p>
            </div>
            
            <div>
              <h4 className="font-semibold">3. No Warranties or Guarantees</h4>
              <p>ProHorseMatch makes no representations or warranties of any kind, express or implied, regarding the fitness, performance, soundness, temperament, or suitability of any horse listed on the platform for any specific purpose. All horses are sold "as-is" and "as-available" directly by the seller, and any representations made about a horse are solely the responsibility of the seller.</p>
            </div>
            
            <div>
              <h4 className="font-semibold">4. Limitation of Liability</h4>
              <p>To the maximum extent permitted by applicable law, ProHorseMatch disclaims all liability for any direct, indirect, incidental, special, consequential or punitive damages, including but not limited to loss of profits, loss of opportunity, personal injury, or property damage arising out of or in connection with:</p>
              <ul className="list-disc pl-5 mt-2">
                <li>any inaccuracies or omissions in listing content;</li>
                <li>the condition, health, or behaviour of any horse;</li>
                <li>any transaction entered into between users of the platform.</li>
              </ul>
              <p className="mt-2">By using ProHorseMatch, you agree that any legal responsibility for the quality, health, condition, or fitness for purpose of any horse lies solely between the buyer and seller, and not with ProHorseMatch.</p>
            </div>
            
            <h3 className="text-lg font-bold">5. Subscription Terms</h3>
            
            <div>
              <h4 className="font-semibold">5.1 Billing and Payments</h4>
              <p>ProHorseMatch offers subscription-based services for sellers and search-only access for buyers. All subscriptions are billed on a monthly basis in advance and are non-refundable. The applicable subscription fees and tier options are clearly stated at the time of sign-up and may vary depending on the user's selected plan.</p>
            </div>
            
            <div>
              <h4 className="font-semibold">5.2 Auto-Renewal</h4>
              <p>All subscriptions automatically renew at the end of each billing cycle (monthly) unless the user cancels their subscription before the next billing date. By subscribing, you authorise ProHorseMatch (or its payment processor) to charge your selected payment method on a recurring monthly basis.</p>
            </div>
            
            <div>
              <h4 className="font-semibold">5.3 Cancellations</h4>
              <p>You may cancel your subscription at any time via your account settings within the app or website. Cancellations must be made prior to the renewal date to avoid being charged for the next month. If you cancel after a charge has already been processed, access to your subscription benefits will continue until the end of the paid billing period, after which your subscription will not renew.</p>
            </div>
            
            <div>
              <h4 className="font-semibold">5.4 Changes to Pricing or Subscription Terms</h4>
              <p>ProHorseMatch reserves the right to modify subscription pricing, plans, or terms at any time. Any changes will be communicated in advance via email or app notification. Continued use of the platform after the effective date of any change constitutes acceptance of the new terms.</p>
            </div>
            
            <div>
              <h4 className="font-semibold">5.5 Free Trials and Beta Subscriptions</h4>
              <p>From time to time, ProHorseMatch may offer free trial or beta access subscriptions. These will also auto-renew into paid subscriptions unless cancelled before the trial or beta period ends. You will be notified via email in advance before any billing begins.</p>
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