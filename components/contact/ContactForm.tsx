"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { toast } from "sonner";

const formSchema = z.object({
  fullName: z.string().min(2, {
    message: "Full Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  company: z.string().optional(),
  inquiryType: z.string().min(1, {
    message: "Please select an inquiry type.",
  }),
  message: z.string().min(10, {
    message: "Message must be at least 10 characters.",
  }),
});

export function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      email: "",
      company: "",
      inquiryType: "",
      message: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      console.log(values);
      setIsSubmitting(false);
      toast.success("Message sent successfully!");
      form.reset();
    }, 1000);
  }

  return (
    <div className="rounded-2xl bg-[#0F1419] border border-[#252B3B] shadow-lg w-full h-full flex flex-col">
      <div className="border border-[#252B3B] rounded-[12px] p-6">
      <h2 className="text-3xl font-bold text-white mb-8 tracking-tight">
        Send us a message
      </h2>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6 flex flex-col flex-1"
        >
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-300">
                    Full Name <span className="text-[#00E676]">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="John Doe"
                      className="bg-[#1A1F2E] border-[#2A2E39] text-gray-200 placeholder:text-gray-500 focus-visible:ring-[#00E676] focus-visible:border-[#00E676]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-300">
                    Email Address <span className="text-[#00E676]">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="john@example.com"
                      type="email"
                      className="bg-[#1A1F2E] border-[#2A2E39] text-gray-200 placeholder:text-gray-500 focus-visible:ring-[#00E676] focus-visible:border-[#00E676]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="company"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-300">
                    Company / Organization
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Optional"
                      className="bg-[#1A1F2E] border-[#2A2E39] text-gray-200 placeholder:text-gray-500 focus-visible:ring-[#00E676] focus-visible:border-[#00E676]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="inquiryType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-300">
                    Inquiry Type <span className="text-[#00E676]">*</span>
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-[#1A1F2E] border-[#2A2E39] text-gray-200 focus:ring-[#00E676] focus:border-[#00E676] data-[placeholder]:text-gray-500">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-[#1C1F26] border-[#2A2E39] text-gray-200">
                      <SelectItem
                        value="technical"
                        className="focus:bg-[#2A2E39] focus:text-white cursor-pointer py-2"
                      >
                        Technical Support
                      </SelectItem>
                      <SelectItem
                        value="security"
                        className="focus:bg-[#2A2E39] focus:text-white cursor-pointer py-2"
                      >
                        Security & Compliance
                      </SelectItem>
                      <SelectItem
                        value="partnerships"
                        className="focus:bg-[#2A2E39] focus:text-white cursor-pointer py-2"
                      >
                        Partnerships
                      </SelectItem>
                      <SelectItem
                        value="general"
                        className="focus:bg-[#2A2E39] focus:text-white cursor-pointer py-2"
                      >
                        General Inquiry
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="message"
            render={({ field }) => (
              <FormItem className="flex-1 flex flex-col">
                <FormLabel className="text-sm font-medium text-gray-300">
                  Message <span className="text-[#00E676]">*</span>
                </FormLabel>
                <FormControl className="flex-1">
                  <Textarea
                    placeholder="Tell us how we can help you..."
                    className="resize-none min-h-[160px] h-full bg-[#1A1F2E] border-[#2A2E39] text-gray-200 placeholder:text-gray-500 focus-visible:ring-[#00E676] focus-visible:border-[#00E676]"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-red-400" />
              </FormItem>
            )}
          />
          <div className="pt-2 mt-auto">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#00D98B] hover:bg-[#00C853] text-black font-semibold px-6 py-6 h-auto text-base rounded-xl transition-colors shrink-0"
            >
              <Send className="mr-2 h-5 w-5" />
              {isSubmitting ? "Sending..." : "Send Message"}
            </Button>
          </div>
          </div>
        </form>
      </Form>
      </div>
    </div>
  );
}
