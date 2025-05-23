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

// 1. Define Zod schema with required dropdowns
const formSchema = z.object({
  breed: z.string({
    required_error: "Please select a breed.",
  }).min(1, "Breed is required"),
  
  discipline: z.string({
    required_error: "Please select a discipline.",
  }).min(1, "Discipline is required"),
  
  experienceLevel: z.string({
    required_error: "Please select an experience level.",
  }).min(1, "Experience level is required"),
});

type FormValues = z.infer<typeof formSchema>;

const breeds = ["Thoroughbred", "Warmblood", "Quarter Horse", "Arabian"];
const disciplines = ["Jumping", "Dressage", "Eventing", "Hunter"];
const experienceLevels = ["Beginner", "Intermediate", "Advanced", "Professional"];

export function SimpleDropdownForm() {
  // 2. Setup form with zodResolver
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      breed: "",
      discipline: "",
      experienceLevel: "",
    },
  });

  function onSubmit(values: FormValues) {
    console.log("Form submitted:", values);
    alert(`Success! Breed: ${values.breed}, Discipline: ${values.discipline}, Level: ${values.experienceLevel}`);
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h3 className="text-lg font-semibold mb-4">Horse Information</h3>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          
          {/* 3. Breed Dropdown with validation */}
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
                {/* 4. Error message displays automatically */}
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

          <Button type="submit" className="w-full">
            Submit
          </Button>
        </form>
      </Form>
    </div>
  );
}