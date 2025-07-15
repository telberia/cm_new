
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import Header from "../components/Header";
import { useLanguage } from "../contexts/LanguageContext";
import { useEffect } from "react";

const formSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  company: z.string().optional(),
  address: z.string().min(5, "Address must be at least 5 characters"),
  city: z.string().min(2, "City must be at least 2 characters"),
  country: z.string().min(2, "Country must be at least 2 characters"),
  postalCode: z.string().min(4, "Postal code must be at least 4 characters"),
});

const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const plugin = location.state?.plugin;
  const { t } = useLanguage();

  useEffect(() => {
    document.title = "WordPress Entwicklung Graz - Kasse";
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      company: "",
      address: "",
      city: "",
      country: "",
      postalCode: "",
    },
  });

  if (!plugin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <h1 className="text-2xl font-bold mb-4">{t('checkout.noPlugin')}</h1>
          <Button onClick={() => navigate("/")}>{t('checkout.returnToPlugins')}</Button>
        </div>
      </div>
    );
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      // Here you would typically integrate with a payment processor
      // For now, we'll just show a success message
      toast.success("Order submitted successfully!", {
        description: "We'll process your order and contact you shortly.",
      });
      navigate("/");
    } catch (error) {
      toast.error("Failed to process order", {
        description: "Please try again later.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10">
      <Header />
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">{t('checkout.title')}</h1>
          
          <div className="bg-white/95 rounded-lg shadow-xl p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">{t('checkout.orderSummary')}</h2>
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">{plugin.name}</p>
                <p className="text-sm text-gray-600">{t('checkout.premiumVersion')}</p>
              </div>
              <p className="font-semibold">${plugin.price || "49.99"}</p>
            </div>
          </div>

          <div className="bg-white/95 rounded-lg shadow-xl p-6">
            <h2 className="text-xl font-semibold mb-6">{t('checkout.billingInfo')}</h2>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('checkout.firstName')}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('checkout.lastName')}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('checkout.email')}</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('checkout.company')}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('checkout.address')}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('checkout.city')}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('checkout.country')}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="postalCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('checkout.postalCode')}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? t('checkout.processing') : t('checkout.completePurchase')}
                </Button>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
