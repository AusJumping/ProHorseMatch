import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ChevronLeft, ArrowRight } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
  userType: z.enum(["customer", "owner"])
});

const customerRegisterSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

const ownerRegisterSchema = z.object({
  business_name: z.string().min(2, { message: "Business name must be at least 2 characters" }),
  contact_name: z.string().min(2, { message: "Contact name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

export default function Auth() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<string>("login");
  const [registerType, setRegisterType] = useState<string>("customer");

  // Login form
  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      userType: "customer"
    }
  });

  // Customer register form
  const customerRegisterForm = useForm<z.infer<typeof customerRegisterSchema>>({
    resolver: zodResolver(customerRegisterSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: ""
    }
  });

  // Owner register form
  const ownerRegisterForm = useForm<z.infer<typeof ownerRegisterSchema>>({
    resolver: zodResolver(ownerRegisterSchema),
    defaultValues: {
      business_name: "",
      contact_name: "",
      email: "",
      password: "",
      confirmPassword: ""
    }
  });

  const onLoginSubmit = async (data: z.infer<typeof loginSchema>) => {
    try {
      console.log("Submitting login form with data:", data);
      
      // Use the more direct fetch approach for login to ensure cookies are set properly
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }
      
      toast({
        title: "Login successful",
        description: "Welcome back to ProHorseMatch",
      });
      
      // Force full page reload to ensure auth state is picked up
      window.location.href = "/";
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
      
      const response = await fetch('/api/auth/register/customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerData),
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }
      
      toast({
        title: "Registration successful",
        description: "Welcome to ProHorseMatch",
      });
      
      // Force full page reload to ensure auth state is picked up
      window.location.href = "/";
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
      
      const response = await fetch('/api/auth/register/owner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerData),
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }
      
      toast({
        title: "Registration successful",
        description: "Welcome to ProHorseMatch",
      });
      
      // Force full page reload to ensure auth state is picked up
      window.location.href = "/add-horse";
    } catch (error: any) {
      toast({
        title: "Registration failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-100 px-4 py-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-6">
          <h1 className="font-display font-bold text-3xl text-primary">
            Pro<span className="text-accent">Horse</span>Match
          </h1>
          <p className="text-neutral-600 mt-2">Connect with your perfect equine partner</p>
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
                      name="userType"
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormLabel>Account Type</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="flex space-x-2"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="customer" id="customer" />
                                <Label htmlFor="customer">Rider</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="owner" id="owner" />
                                <Label htmlFor="owner">Horse Owner</Label>
                              </div>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

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
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" className="w-full">
                      Sign In
                    </Button>
                  </form>
                </Form>
              </CardContent>
              <CardFooter className="flex justify-center">
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
                      <CardTitle>Rider Registration</CardTitle>
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
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input placeholder="John Doe" {...field} />
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
                              <Input type="password" placeholder="••••••••" {...field} />
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
                              <Input type="password" placeholder="••••••••" {...field} />
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
                      <CardTitle>Horse Owner Registration</CardTitle>
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
                              <Input type="password" placeholder="••••••••" {...field} />
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
                              <Input type="password" placeholder="••••••••" {...field} />
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
      </div>
    </div>
  );
}
