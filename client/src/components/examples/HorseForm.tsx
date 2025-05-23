import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

// Define the Zod schema with required dropdown fields
const horseFormSchema = z.object({
  name: z.string().min(2, {
    message: "Horse name must be at least 2 characters.",
  }),
  breed: z.string({
    required_error: "Please select a breed.",
  }).min(1, "Please select a breed."),
  discipline: z.string({
    required_error: "Please select a discipline.",
  }).min(1, "Please select a discipline."),
  experienceLevel: z.string({
    required_error: "Please select an experience level.",
  }).min(1, "Please select an experience level."),
  sex: z.string({
    required_error: "Please select a sex.",
  }).min(1, "Please select a sex."),
  age: z.string().transform((val) => parseInt(val, 10)).pipe(
    z.number().min(1, "Age must be at least 1").max(30, "Age must be less than 30")
  ),
});

type HorseFormValues = z.infer<typeof horseFormSchema>;

// Sample data for dropdowns
const breeds = [
  "Thoroughbred",
  "Warmblood",
  "Quarter Horse",
  "Arabian",
  "Friesian",
  "Andalusian",
  "Irish Sport Horse",
  "Dutch Warmblood",
];

const disciplines = [
  "Jumping",
  "Dressage",
  "Eventing",
  "Hunter",
  "Western",
  "Trail",
];

const experienceLevels = [
  "Beginner",
  "Intermediate",
  "Advanced",
  "Professional",
];

const sexes = [
  "Mare",
  "Gelding",
  "Stallion",
];

export function HorseForm() {
  const { toast } = useToast();
  
  // Initialize form with zodResolver
  const form = useForm<HorseFormValues>({
    resolver: zodResolver(horseFormSchema),
    defaultValues: {
      name: "",
      breed: "",
      discipline: "",
      experienceLevel: "",
      sex: "",
      age: "",
    },
  });

  function onSubmit(values: HorseFormValues) {
    console.log("Form submitted with values:", values);
    toast({
      title: "Success!",
      description: "Horse form submitted successfully.",
    });
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Add New Horse</h2>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Horse Name Field */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Horse Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter horse name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Breed Dropdown */}
          <FormField
            control={form.control}
            name="breed"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Breed *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a breed" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {breeds.map((breed) => (
                      <SelectItem key={breed} value={breed}>
                        {breed}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Discipline Dropdown */}
          <FormField
            control={form.control}
            name="discipline"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Discipline *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a discipline" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {disciplines.map((discipline) => (
                      <SelectItem key={discipline} value={discipline}>
                        {discipline}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Experience Level Dropdown */}
          <FormField
            control={form.control}
            name="experienceLevel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Experience Level *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select experience level" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {experienceLevels.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Sex Dropdown */}
          <FormField
            control={form.control}
            name="sex"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sex *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select sex" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {sexes.map((sex) => (
                      <SelectItem key={sex} value={sex}>
                        {sex}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Age Field */}
          <FormField
            control={form.control}
            name="age"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Age</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="Enter age" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Submit Button */}
          <Button type="submit" className="w-full">
            Add Horse
          </Button>

          {/* Debug: Show form errors (remove in production) */}
          {Object.keys(form.formState.errors).length > 0 && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <h4 className="text-sm font-medium text-red-800 mb-2">Form Errors:</h4>
              <pre className="text-xs text-red-600">
                {JSON.stringify(form.formState.errors, null, 2)}
              </pre>
            </div>
          )}
        </form>
      </Form>
    </div>
  );
}