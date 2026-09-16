import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import logoImage from "../assets/logo-auth.png";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Eye, EyeOff, Mail, CheckCircle } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(1, { message: "Password is required" })
});

const customerRegisterSchema = z.object({
  // role field removed during beta — everyone gets both searching + selling access.
  // TODO: re-add role: z.enum(['searching','selling','both']) when subscriptions launch.
  username: z.string().min(3, { message: "Username must be at least 3 characters" }).max(20, { message: "Username must be at most 20 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
  confirmPassword: z.string(),
  acceptedTerms: z.boolean().refine(val => val === true, { message: "You must accept the Terms and Conditions to register" })
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});


const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" })
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, { message: "Reset token is required" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

export default function Auth() {
  const { toast } = useToast();
  
  // Removed page load toast test - testing in registration instead
  const { login, register } = useAuth();
  const [location, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<string>("login");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [showResetPassword, setShowResetPassword] = useState<boolean>(false);
  const [showResetConfirmPassword, setShowResetConfirmPassword] = useState<boolean>(false);
  const [showForgotPassword, setShowForgotPassword] = useState<boolean>(false);
  const [showTermsDialog, setShowTermsDialog] = useState<boolean>(false);
  const [resetToken, setResetToken] = useState<string>("");
  const [showEmailVerificationDialog, setShowEmailVerificationDialog] = useState<boolean>(false);
  const [registeredEmail, setRegisteredEmail] = useState<string>("");
  
  // Check URL query params for tab selection and reset token
  useEffect(() => {
    const url = new URL(window.location.href);
    const tabParam = url.searchParams.get('tab');
    const tokenParam = url.searchParams.get('token');
    
    if (tabParam === 'register') {
      setActiveTab('register');
    }
    
    if (tokenParam) {
      setResetToken(tokenParam);
      // Don't change tab to reset-password since it doesn't exist in tabs
      // The reset form will show conditionally below
    }
  }, [location]);

  // Login form
  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: ""
    }
  });

  // Customer register form
  const customerRegisterForm = useForm<z.infer<typeof customerRegisterSchema>>({
    resolver: zodResolver(customerRegisterSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      acceptedTerms: false
    }
  });

  // Forgot password form
  const forgotPasswordForm = useForm<z.infer<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: ""
    }
  });

  // Reset password form
  const resetPasswordForm = useForm<z.infer<typeof resetPasswordSchema>>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token: "",
      password: "",
      confirmPassword: ""
    }
  });

  // Update form when resetToken changes
  useEffect(() => {
    if (resetToken) {
      resetPasswordForm.setValue('token', resetToken);
    }
  }, [resetToken, resetPasswordForm]);

  const onLoginSubmit = async (data: z.infer<typeof loginSchema>) => {
    try {
      console.log("Submitting login form with data:", data);
      
      // Use the proper login function that handles token storage
      const userData = await login(data.email, data.password);
      
      if (userData && (userData.subscription_status === 'active' || userData.subscription_tier === 'beta_free')) {
        console.log("User has active subscription or beta access, continuing through the landing screen");
        window.location.href = "/";
      } else {
        console.log("User has no active subscription, redirecting to subscription page");
        window.location.href = "/subscription";
      }
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Please check your credentials",
        variant: "destructive",
      });
    }
  };

  const onCustomerRegisterSubmit = async (data: z.infer<typeof customerRegisterSchema>) => {
    try {
      const { confirmPassword, acceptedTerms, ...registerData } = data;
      // Beta: everyone gets both roles. TODO: pass is_searching/is_selling from role selector when subscriptions launch.
      const userData = await register({ ...registerData, is_searching: true, is_selling: true, accepted_terms: true }, 'customer');
      
      // Show prominent email verification dialog
      setRegisteredEmail(data.email);
      setShowEmailVerificationDialog(true);
      
      // Don't redirect - user needs to verify email first
      return;
    } catch (error: any) {
      toast({
        title: "Registration failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    }
  };

  const onForgotPasswordSubmit = async (data: z.infer<typeof forgotPasswordSchema>) => {
    try {
      await apiRequest('POST', '/api/auth/forgot-password', data);

      toast({
        title: "Reset email sent",
        description: "Check your email for password reset instructions",
      });

      setShowForgotPassword(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send reset email",
        variant: "destructive",
      });
    }
  };

  const onResetPasswordSubmit = async (data: z.infer<typeof resetPasswordSchema>) => {
    try {
      const { confirmPassword, ...resetData } = data;
      
      await apiRequest('POST', '/api/auth/reset-password', resetData);

      toast({
        title: "Password reset successful",
        description: "You can now log in with your new password",
      });

      setActiveTab('login');
      setResetToken('');
    } catch (error: any) {
      toast({
        title: "Reset failed",
        description: error.message || "Failed to reset password",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-100 px-4 py-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-6">
          <div className="flex justify-center">
            <img src={logoImage} alt="Pro Horse Match" className="h-40 object-contain" />
          </div>
        </div>

        {/* Hide tabs when showing reset password form */}
        {!resetToken && (
          <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-2 mb-6">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>Welcome Back</CardTitle>
                <CardDescription>
                  Sign in to your account to continue
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">


                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="you@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input 
                                type={showPassword ? "text" : "password"} 
                                placeholder="Enter your password" 
                                {...field} 
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowPassword(!showPassword)}
                              >
                                {showPassword ? (
                                  <EyeOff className="h-4 w-4 text-gray-400" />
                                ) : (
                                  <Eye className="h-4 w-4 text-gray-400" />
                                )}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button 
                      type="submit" 
                      className="w-full text-white"
                      style={{ backgroundColor: "#cdac6e", borderColor: "#cdac6e" }}
                    >
                      Sign In
                    </Button>
                  </form>
                </Form>
              </CardContent>
              <CardFooter className="flex flex-col space-y-2">
                <Button
                  variant="link"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm text-gray-600"
                >
                  Forgot your password?
                </Button>
                <Button
                  variant="link"
                  onClick={() => setActiveTab("register")}
                >
                  Don't have an account? Register
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="register">
            <Card>
              <CardHeader>
                <CardTitle>Create a Free Account</CardTitle>
                <CardDescription>
                  Browse horses for sale or list a horse. No payment details required while we are getting started!
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...customerRegisterForm}>
                  <form onSubmit={customerRegisterForm.handleSubmit(onCustomerRegisterSubmit)} className="space-y-4">
                    <FormField
                      control={customerRegisterForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="johndoe123" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={customerRegisterForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="you@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={customerRegisterForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input 
                                type={showRegisterPassword ? "text" : "password"} 
                                placeholder="Create a password" 
                                {...field} 
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                              >
                                {showRegisterPassword ? (
                                  <EyeOff className="h-4 w-4 text-gray-400" />
                                ) : (
                                  <Eye className="h-4 w-4 text-gray-400" />
                                )}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={customerRegisterForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input 
                                type={showConfirmPassword ? "text" : "password"} 
                                placeholder="Confirm your password" 
                                {...field} 
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              >
                                {showConfirmPassword ? (
                                  <EyeOff className="h-4 w-4 text-gray-400" />
                                ) : (
                                  <Eye className="h-4 w-4 text-gray-400" />
                                )}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={customerRegisterForm.control}
                      name="acceptedTerms"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="font-medium cursor-pointer">
                              I agree to the{" "}
                              <button
                                type="button"
                                className="text-primary underline font-medium"
                                onClick={() => setShowTermsDialog(true)}
                              >
                                Terms and Conditions
                              </button>
                            </FormLabel>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />

                    <Button type="submit" className="w-full">
                      Create Account
                    </Button>
                  </form>
                </Form>
              </CardContent>
              <CardFooter className="flex justify-center">
                <Button
                  variant="link"
                  onClick={() => setActiveTab("login")}
                >
                  Already have an account? Login
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

        {/* Terms and Conditions Dialog */}
        <Dialog open={showTermsDialog} onOpenChange={setShowTermsDialog}>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh]">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">ProHorseMatch Terms and Conditions</DialogTitle>
              <DialogDescription>Effective Date: January 2025</DialogDescription>
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
                    <li>"Sellers" are Users who create horse listings for sale or lease.</li>
                    <li>"Searchers" are Users seeking to purchase horses through contact made with Sellers using our Services.</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-2">3. Eligibility</h3>
                  <p>You must be at least 18 years old, or the legal age of majority in your jurisdiction, to use our Services.</p>
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-2">4. Account Registration</h3>
                  <p>To access certain features, you may need to create an account. You agree to provide accurate, current, and complete information, and to update it as necessary. You are responsible for safeguarding your login details and for all activities under your account.</p>
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-2">5. Horse Listings</h3>
                  <p>Sellers are solely responsible for the accuracy and completeness of their listings. ProHorseMatch does not verify or guarantee the accuracy of listings.</p>
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-2">6. Transactions Between Users</h3>
                  <p>Our Services facilitate introductions between Sellers and Buyers. We are not a party to any transaction, agreement, or dispute between Users.</p>
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-2">7. Disclaimer of Liability</h3>
                  <p>ProHorseMatch makes no representations or warranties regarding the fitness, performance, soundness, or suitability of any horse listed on the platform. All horses are sold directly by the seller.</p>
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-2">8. Subscription Services</h3>
                  <p>We may offer subscription plans with enhanced features. During the beta period, access is free. After the beta period, subscriptions may be subject to fees and auto-renewal unless cancelled in advance.</p>
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-2">9. Prohibited Conduct</h3>
                  <p>You agree not to post false or misleading content, infringe intellectual property rights, or attempt to interfere with the Services. We reserve the right to remove content or suspend accounts that violate these Terms.</p>
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-2">10. Limitation of Liability</h3>
                  <p>To the maximum extent permitted by law, ProHorseMatch shall not be liable for any indirect, incidental, special, or consequential damages arising out of your use of the Services.</p>
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-2">11. Governing Law</h3>
                  <p>These Terms are governed by the laws of Australia. Any disputes will be resolved exclusively in the courts of Australia.</p>
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-2">12. Changes to Terms</h3>
                  <p>We reserve the right to modify these Terms at any time. Continued use of the Services after updates constitutes acceptance of the revised Terms.</p>
                </div>
              </div>
            </ScrollArea>
            <DialogClose asChild>
              <Button className="mt-4">I Understand</Button>
            </DialogClose>
          </DialogContent>
        </Dialog>

        {/* Forgot Password Dialog */}
        <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Reset Password</DialogTitle>
              <DialogDescription>
                Enter your email address and we'll send you a password reset link.
              </DialogDescription>
            </DialogHeader>
            <Form {...forgotPasswordForm}>
              <form onSubmit={forgotPasswordForm.handleSubmit(onForgotPasswordSubmit)} className="space-y-4">
                <FormField
                  control={forgotPasswordForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="you@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setShowForgotPassword(false)}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    style={{ backgroundColor: "#cdac6e", borderColor: "#cdac6e" }}
                    className="text-white"
                  >
                    Send Reset Link
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

          </Tabs>
        )}

        {/* Reset Password Form - Show when token present */}
        {resetToken && (
          <Card>
            <CardHeader>
              <CardTitle>Reset Your Password</CardTitle>
              <CardDescription>
                Enter your new password below
              </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...resetPasswordForm}>
                  <form onSubmit={resetPasswordForm.handleSubmit(onResetPasswordSubmit)} className="space-y-4">
                    <FormField
                      control={resetPasswordForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input 
                                type={showResetPassword ? "text" : "password"} 
                                placeholder="Create a new password" 
                                {...field} 
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowResetPassword(!showResetPassword)}
                              >
                                {showResetPassword ? (
                                  <EyeOff className="h-4 w-4 text-gray-400" />
                                ) : (
                                  <Eye className="h-4 w-4 text-gray-400" />
                                )}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={resetPasswordForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input 
                                type={showResetConfirmPassword ? "text" : "password"} 
                                placeholder="Confirm your new password" 
                                {...field} 
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowResetConfirmPassword(!showResetConfirmPassword)}
                              >
                                {showResetConfirmPassword ? (
                                  <EyeOff className="h-4 w-4 text-gray-400" />
                                ) : (
                                  <Eye className="h-4 w-4 text-gray-400" />
                                )}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button 
                      type="submit" 
                      className="w-full text-white"
                      style={{ backgroundColor: "#cdac6e", borderColor: "#cdac6e" }}
                    >
                      Reset Password
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
        )}

        {/* Email Verification Success Dialog */}
        <Dialog open={showEmailVerificationDialog} onOpenChange={setShowEmailVerificationDialog}>
          <DialogContent className="sm:max-w-md bg-white dark:bg-gray-900">
            <DialogHeader className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full flex items-center justify-center">
                <Mail className="h-8 w-8 text-white" />
              </div>
              <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                Check Your Email!
              </DialogTitle>
              <DialogDescription className="text-base text-gray-600 dark:text-gray-300 space-y-3">
                <div className="flex items-start gap-3 text-left bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                  <CheckCircle className="h-5 w-5 text-amber-600 dark:text-amber-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white mb-1">
                      Registration Successful!
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      We've sent a verification email to <span className="font-medium text-amber-700 dark:text-amber-400">{registeredEmail}</span>
                    </p>
                  </div>
                </div>
                
                <div className="text-left space-y-2 pt-2">
                  <p className="font-medium text-gray-900 dark:text-white">Next steps:</p>
                  <ol className="list-decimal list-inside space-y-1.5 text-sm text-gray-600 dark:text-gray-400">
                    <li>Check your inbox (and spam folder)</li>
                    <li>Click the verification link in the email</li>
                    <li>Return here to log in</li>
                  </ol>
                </div>

                <p className="text-sm text-gray-500 dark:text-gray-400 italic pt-2">
                  The verification link expires in 48 hours
                </p>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="sm:justify-center">
              <Button
                onClick={() => {
                  setShowEmailVerificationDialog(false);
                  setActiveTab('login');
                }}
                className="w-full sm:w-auto bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white"
                data-testid="button-email-verification-ok"
              >
                Got it, I'll check my email
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
}
