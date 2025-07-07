import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import logoImage from "../assets/logo-auth.jpg";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronLeft, ArrowRight, Eye, EyeOff } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(1, { message: "Password is required" })
});

const customerRegisterSchema = z.object({
  username: z.string().min(3, { message: "Username must be at least 3 characters" }).max(20, { message: "Username must be at most 20 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

const ownerRegisterSchema = z.object({
  username: z.string().min(3, { message: "Username must be at least 3 characters" }).max(20, { message: "Username must be at most 20 characters" }),
  business_name: z.string().min(2, { message: "Business name must be at least 2 characters" }),
  contact_name: z.string().min(2, { message: "Contact name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
  confirmPassword: z.string()
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
  const [registerType, setRegisterType] = useState<string>("customer");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [showForgotPassword, setShowForgotPassword] = useState<boolean>(false);
  const [resetToken, setResetToken] = useState<string>("");
  
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
      setActiveTab('reset-password');
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
      confirmPassword: ""
    }
  });

  // Owner register form
  const ownerRegisterForm = useForm<z.infer<typeof ownerRegisterSchema>>({
    resolver: zodResolver(ownerRegisterSchema),
    defaultValues: {
      username: "",
      business_name: "",
      contact_name: "",
      email: "",
      password: "",
      confirmPassword: ""
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
      token: resetToken,
      password: "",
      confirmPassword: ""
    }
  });

  const onLoginSubmit = async (data: z.infer<typeof loginSchema>) => {
    try {
      console.log("Submitting login form with data:", data);
      
      // Use the proper login function that handles token storage
      const userData = await login(data.email, data.password);
      
      if (userData && userData.subscription_status === 'active') {
        console.log("User has active subscription, redirecting to welcome page");
        window.location.href = "/welcome";
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
      const { confirmPassword, ...registerData } = data;
      
      const userData = await register(registerData, 'customer');
      
      // Always show email verification message for new registrations
      // Since all new users need email verification
      toast({
        title: "Registration successful!",
        description: "Please check your email to verify your account before logging in.",
        duration: 6000,
      });
      
      // Don't redirect - user needs to verify email first
      return;
      
      if (userData && userData.subscription_status === 'active') {
        console.log("User has active subscription, redirecting to welcome page");
        window.location.href = "/welcome";
      } else {
        console.log("User has no active subscription, redirecting to subscription page");
        window.location.href = "/subscription";
      }
    } catch (error: any) {
      toast({
        title: "Registration failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    }
  };

  const onOwnerRegisterSubmit = async (data: z.infer<typeof ownerRegisterSchema>) => {
    try {
      const { confirmPassword, ...registerData } = data;
      console.log("Submitting owner registration form with data:", registerData);
      
      // Use the proper register function that handles token storage
      const userData = await register(registerData, 'owner');
      
      console.log("=== OWNER REGISTRATION RESULT DEBUG ===");
      console.log("userData:", userData);
      console.log("userData type:", typeof userData);
      console.log("requiresVerification:", (userData as any)?.requiresVerification);
      console.log("message:", (userData as any)?.message);
      
      // Always show email verification message for new registrations
      // Since all new users need email verification
      toast({
        title: "Registration successful!",
        description: "Please check your email to verify your account before logging in.",
        duration: 6000, // Show longer for important message
      });
      
      // Don't redirect - user needs to verify email first
      return;
      
      if (userData && userData.subscription_status === 'active') {
        console.log("User has active subscription, redirecting to welcome page");
        window.location.href = "/welcome";
      } else {
        console.log("User has no active subscription, redirecting to subscription page");
        window.location.href = "/subscription";
      }
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
            <img src={logoImage} alt="Pro Horse Match" className="h-20 object-contain" />
          </div>
        </div>

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
            {registerType === "selection" && (
              <Card>
                <CardHeader>
                  <CardTitle>Create an Account</CardTitle>
                  <CardDescription>
                    Choose your account type to get started
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    <Button
                      onClick={() => setRegisterType("customer")}
                      className="flex justify-between items-center"
                    >
                      <span>I'm looking for a horse</span>
                      <ArrowRight size={18} />
                    </Button>
                    <Button
                      onClick={() => setRegisterType("owner")}
                      className="flex justify-between items-center"
                    >
                      <span>I have horses for sale</span>
                      <ArrowRight size={18} />
                    </Button>
                  </div>
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
            )}

            {registerType === "customer" && (
              <Card>
                <CardHeader>
                  <div className="flex items-center">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="mr-2" 
                      onClick={() => setRegisterType("selection")}
                    >
                      <ChevronLeft size={18} />
                    </Button>
                    <div>
                      <CardTitle>Registration Details</CardTitle>
                      <CardDescription>
                        Create your account to find your perfect horse
                      </CardDescription>
                    </div>
                  </div>
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

                      <Button type="submit" className="w-full">
                        Create Account
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            )}

            {registerType === "owner" && (
              <Card>
                <CardHeader>
                  <div className="flex items-center">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="mr-2" 
                      onClick={() => setRegisterType("selection")}
                    >
                      <ChevronLeft size={18} />
                    </Button>
                    <div>
                      <CardTitle>Selling Registration</CardTitle>
                      <CardDescription>
                        Create your account to list your horses for sale
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Form {...ownerRegisterForm}>
                    <form onSubmit={ownerRegisterForm.handleSubmit(onOwnerRegisterSubmit)} className="space-y-4">
                      <FormField
                        control={ownerRegisterForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="elitesporthorses" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={ownerRegisterForm.control}
                        name="business_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Business Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Elite Sporthorses" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={ownerRegisterForm.control}
                        name="contact_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contact Name</FormLabel>
                            <FormControl>
                              <Input placeholder="John Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={ownerRegisterForm.control}
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
                        control={ownerRegisterForm.control}
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
                        control={ownerRegisterForm.control}
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

                      <Button type="submit" className="w-full">
                        Create Account
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

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

        {/* Reset Password Tab */}
        {resetToken && (
          <div className="mt-6">
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
                            <Input 
                              type="password" 
                              placeholder="••••••••" 
                              {...field} 
                            />
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
                            <Input 
                              type="password" 
                              placeholder="••••••••" 
                              {...field} 
                            />
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
          </div>
        )}

      </div>
    </div>
  );
}
