import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Smartphone, Monitor, Bell, Share2, Home, Download, CheckCircle, Info, AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";

export default function HelpPage() {
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop'>('desktop');
  const [isStandalone, setIsStandalone] = useState(false);
  const [isPWAInstallable, setIsPWAInstallable] = useState(false);

  useEffect(() => {
    // Detect platform
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);
    
    if (isIOS) {
      setPlatform('ios');
    } else if (isAndroid) {
      setPlatform('android');
    } else {
      setPlatform('desktop');
    }

    // Check if already running as PWA
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(standalone);

    // Check if PWA is installable (Android/Desktop)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setIsPWAInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-[#8B7355] to-[#6B5344] text-white py-16 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="font-serif text-5xl md:text-6xl font-semibold mb-4">
            Installation Guide
          </h1>
          <p className="text-xl text-neutral-100 mb-8 max-w-3xl mx-auto">
            Get the best ProHorseMatch experience by installing our app on your device and enabling push notifications
          </p>
          
          {/* Quick navigation */}
          <div className="flex flex-wrap gap-4 justify-center">
            <Button 
              variant={platform === 'ios' ? 'default' : 'outline'}
              onClick={() => scrollToSection('ios-section')}
              className="bg-white/10 hover:bg-white/20 border-white/30"
            >
              <Smartphone className="w-4 h-4 mr-2" />
              iPhone / iPad
            </Button>
            <Button 
              variant={platform === 'android' ? 'default' : 'outline'}
              onClick={() => scrollToSection('android-section')}
              className="bg-white/10 hover:bg-white/20 border-white/30"
            >
              <Smartphone className="w-4 h-4 mr-2" />
              Android
            </Button>
            <Button 
              variant={platform === 'desktop' ? 'default' : 'outline'}
              onClick={() => scrollToSection('desktop-section')}
              className="bg-white/10 hover:bg-white/20 border-white/30"
            >
              <Monitor className="w-4 h-4 mr-2" />
              Desktop / Web
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 py-12 space-y-16">
        
        {/* Status Banner */}
        {isStandalone && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-green-900 mb-1">App Installed Successfully!</h3>
                  <p className="text-green-800">You're running ProHorseMatch as an installed app. Scroll down to enable push notifications.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* iOS Section */}
        <section id="ios-section" className="scroll-mt-8">
          <div className="flex items-center gap-3 mb-6">
            <Smartphone className="w-8 h-8 text-[#8B7355]" />
            <h2 className="font-serif text-4xl font-semibold text-neutral-900">iPhone & iPad</h2>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Step 1: Open Safari</CardTitle>
                <CardDescription>ProHorseMatch must be accessed through Safari on iOS</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-900">
                    <strong>Important:</strong> Installation only works in Safari. If you're using Chrome or another browser, switch to Safari first.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Step 2: Tap the Share Button</CardTitle>
                <CardDescription>Look for the share icon at the bottom of Safari</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-100 p-4 rounded-lg">
                    <Share2 className="w-8 h-8 text-blue-600" />
                  </div>
                  <p className="text-neutral-700">
                    Tap the <strong>Share button</strong> (square with arrow pointing up) located at the bottom center or top right of Safari.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Step 3: Add to Home Screen</CardTitle>
                <CardDescription>Select the installation option from the share menu</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="bg-green-100 p-4 rounded-lg">
                    <Home className="w-8 h-8 text-green-600" />
                  </div>
                  <p className="text-neutral-700">
                    Scroll down in the share menu and tap <strong>"Add to Home Screen"</strong>
                  </p>
                </div>
                <ol className="list-decimal list-inside space-y-2 text-neutral-700 ml-4">
                  <li>You'll see "ProHorseMatch" as the app name</li>
                  <li>Tap <strong>"Add"</strong> in the top right corner</li>
                  <li>The app icon will appear on your home screen</li>
                </ol>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Step 4: Open the App</CardTitle>
                <CardDescription>Launch ProHorseMatch from your home screen</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="space-y-2">
                    <p className="text-sm text-blue-900">
                      <strong>Success!</strong> Tap the ProHorseMatch icon on your home screen to open the app.
                    </p>
                    <p className="text-sm text-blue-800">
                      The app will open in full-screen mode without Safari's browser controls.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Step 5: Enable Push Notifications</CardTitle>
                <CardDescription>Get notified about new matches and messages</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="bg-purple-100 p-4 rounded-lg">
                    <Bell className="w-8 h-8 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-neutral-700 mb-2">
                      Once installed, go to your <strong>Profile → Account Settings → Notifications</strong>
                    </p>
                    <p className="text-sm text-neutral-600">
                      Tap "Enable Notifications" and allow when prompted by iOS
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-900">
                    <strong>iOS Requirement:</strong> Push notifications only work after installing the app to your home screen. They won't work in regular Safari.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Android Section */}
        <section id="android-section" className="scroll-mt-8">
          <div className="flex items-center gap-3 mb-6">
            <Smartphone className="w-8 h-8 text-[#8B7355]" />
            <h2 className="font-serif text-4xl font-semibold text-neutral-900">Android Devices</h2>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Step 1: Open in Chrome</CardTitle>
                <CardDescription>Use Chrome browser for the best installation experience</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-neutral-700">
                  Visit ProHorseMatch in <strong>Google Chrome</strong> on your Android device. Other browsers like Firefox and Edge also support installation.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Step 2: Install the App</CardTitle>
                <CardDescription>Look for the install prompt or menu option</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <div className="bg-blue-100 p-4 rounded-lg">
                      <Download className="w-8 h-8 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold mb-1">Option A: Install Banner</p>
                      <p className="text-sm text-neutral-700">
                        If you see a banner at the bottom saying "Install ProHorseMatch", tap <strong>"Install"</strong>
                      </p>
                    </div>
                  </div>

                  <div className="pl-20 border-l-2 border-neutral-200">
                    <p className="font-semibold mb-1">Option B: Menu Installation</p>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-neutral-700">
                      <li>Tap the three-dot menu (⋮) in Chrome</li>
                      <li>Select "Install app" or "Add to Home screen"</li>
                      <li>Tap "Install" when prompted</li>
                    </ol>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-green-900">
                    The ProHorseMatch icon will be added to your home screen and app drawer
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Step 3: Enable Push Notifications</CardTitle>
                <CardDescription>Stay updated with instant notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="bg-purple-100 p-4 rounded-lg">
                    <Bell className="w-8 h-8 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-neutral-700 mb-2">
                      Go to <strong>Profile → Account Settings → Notifications</strong>
                    </p>
                    <p className="text-sm text-neutral-600">
                      Tap "Enable Notifications" and allow when Chrome asks for permission
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-900">
                    <strong>Good news:</strong> On Android, push notifications work both in the installed app and in Chrome browser!
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Desktop Section */}
        <section id="desktop-section" className="scroll-mt-8">
          <div className="flex items-center gap-3 mb-6">
            <Monitor className="w-8 h-8 text-[#8B7355]" />
            <h2 className="font-serif text-4xl font-semibold text-neutral-900">Desktop & Web Browsers</h2>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Installing on Desktop</CardTitle>
                <CardDescription>Available on Chrome, Edge, and other Chromium browsers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-100 p-4 rounded-lg">
                    <Download className="w-8 h-8 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold mb-2">Look for the install icon</p>
                    <p className="text-sm text-neutral-700">
                      In Chrome or Edge, you'll see an install icon (⊕ or 💻) in the address bar
                    </p>
                  </div>
                </div>

                <ol className="list-decimal list-inside space-y-2 text-neutral-700 ml-4">
                  <li>Click the install icon in the address bar, or</li>
                  <li>Click the three-dot menu → "Install ProHorseMatch"</li>
                  <li>Click "Install" in the confirmation dialog</li>
                  <li>The app will open in its own window</li>
                </ol>

                <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-900">
                    ProHorseMatch will appear in your taskbar, Start menu, and can be pinned for quick access
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Enable Browser Notifications</CardTitle>
                <CardDescription>Get desktop notifications for matches and messages</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="bg-purple-100 p-4 rounded-lg">
                    <Bell className="w-8 h-8 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-neutral-700 mb-2">
                      Navigate to <strong>Profile → Account Settings → Notifications</strong>
                    </p>
                    <p className="text-sm text-neutral-600">
                      Click "Enable Notifications" and allow when your browser asks for permission
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-900">
                    <strong>Note:</strong> Safari on macOS doesn't support web push notifications. Use Chrome or Edge instead.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq-section" className="scroll-mt-8">
          <h2 className="font-serif text-4xl font-semibold text-neutral-900 mb-6">
            Frequently Asked Questions
          </h2>

          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem value="q1" className="border rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold">
                Why should I install the app instead of using the website?
              </AccordionTrigger>
              <AccordionContent className="text-neutral-700 space-y-2">
                <p>Installing ProHorseMatch offers several benefits:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li><strong>Faster access:</strong> Launch directly from your home screen without typing URLs</li>
                  <li><strong>Push notifications:</strong> Get instant alerts for new matches, messages, and updates</li>
                  <li><strong>Full-screen experience:</strong> More screen space without browser controls</li>
                  <li><strong>Works offline:</strong> Access previously viewed content even without internet</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="q2" className="border rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold">
                What notifications will I receive?
              </AccordionTrigger>
              <AccordionContent className="text-neutral-700 space-y-2">
                <p>You can customize which notifications you receive in your Account Settings:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li><strong>New Matches:</strong> When a horse matches your saved search criteria</li>
                  <li><strong>Messages:</strong> When you receive a new message from buyers or sellers</li>
                  <li><strong>Listing Updates:</strong> When horses you've favorited have price or detail changes</li>
                </ul>
                <p className="mt-2">You have full control and can enable/disable any notification type at any time.</p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="q3" className="border rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold">
                Do I need to reinstall after updates?
              </AccordionTrigger>
              <AccordionContent className="text-neutral-700">
                No! The app updates automatically in the background. When you open ProHorseMatch, you'll always have the latest version with new features and improvements.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="q4" className="border rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold">
                Push notifications aren't working on my iPhone
              </AccordionTrigger>
              <AccordionContent className="text-neutral-700 space-y-3">
                <p>Make sure you've completed all these steps:</p>
                <ol className="list-decimal list-inside ml-4 space-y-1">
                  <li>Installed the app to your home screen via Safari's "Add to Home Screen"</li>
                  <li>Opened the app from the home screen icon (not Safari)</li>
                  <li>Enabled notifications in Profile → Account Settings → Notifications</li>
                  <li>Allowed notifications when iOS prompts you</li>
                </ol>
                <div className="mt-3 p-3 bg-amber-50 rounded border border-amber-200">
                  <p className="text-sm text-amber-900">
                    <strong>Still not working?</strong> Delete the app, clear Safari's cache (Settings → Safari → Clear History and Website Data), wait 30 seconds, then reinstall fresh.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="q5" className="border rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold">
                How do I uninstall the app?
              </AccordionTrigger>
              <AccordionContent className="text-neutral-700">
                <ul className="space-y-2">
                  <li><strong>iOS:</strong> Long-press the app icon → "Remove App" → "Delete App"</li>
                  <li><strong>Android:</strong> Long-press the icon → "Uninstall", or drag to uninstall area</li>
                  <li><strong>Desktop:</strong> Right-click the app icon → "Uninstall ProHorseMatch"</li>
                </ul>
                <p className="mt-2 text-sm">Your account and data remain safe - you can still access ProHorseMatch through your web browser.</p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="q6" className="border rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold">
                Does the app use my storage space?
              </AccordionTrigger>
              <AccordionContent className="text-neutral-700">
                The app uses minimal storage (typically 5-15 MB) to cache recently viewed content for faster loading and offline access. This is much smaller than traditional native apps which can be 50-200 MB.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        {/* Support Section */}
        <section className="bg-gradient-to-br from-[#8B7355] to-[#6B5344] rounded-lg p-8 text-white">
          <h3 className="font-serif text-3xl font-semibold mb-4">Need More Help?</h3>
          <p className="text-neutral-100 mb-6 max-w-2xl">
            If you're still experiencing issues with installation or notifications, our support team is here to help.
          </p>
          <div className="flex flex-wrap gap-4">
            <Button 
              variant="outline" 
              className="bg-white/10 hover:bg-white/20 border-white/30 text-white"
              onClick={() => window.location.href = 'mailto:info@australianjumping.com.au'}
            >
              Email Support
            </Button>
            <Button 
              variant="outline" 
              className="bg-white/10 hover:bg-white/20 border-white/30 text-white"
              onClick={() => window.location.href = '/'}
            >
              Back to Home
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
