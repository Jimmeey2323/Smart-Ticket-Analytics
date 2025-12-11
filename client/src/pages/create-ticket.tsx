import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  categories,
  getSubcategoryById,
  getAllFormFieldsForSubcategory,
  locations,
  departments,
  type FormField as FormFieldType,
} from "@/lib/categories";
import { ArrowLeft, Loader2, Sparkles, ChevronRight } from "lucide-react";
import type { Ticket } from "@shared/schema";

const baseTicketSchema = z.object({
  categoryId: z.string().min(1, "Please select a category"),
  subcategoryId: z.string().optional(),
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(50, "Description must be at least 50 characters"),
  clientName: z.string().min(2, "Client name is required"),
  clientEmail: z.string().email().optional().or(z.literal("")),
  clientPhone: z.string().optional(),
  clientStatus: z.string().min(1, "Please select client status"),
  clientMood: z.string().optional(),
  locationId: z.string().min(1, "Please select a location"),
  priority: z.enum(["low", "medium", "high", "critical"]),
  department: z.string().min(1, "Please select a department"),
  incidentDateTime: z.string().optional(),
  actionTakenImmediately: z.string().optional(),
  followUpRequired: z.boolean().default(false),
});

type TicketFormData = z.infer<typeof baseTicketSchema> & {
  formData?: Record<string, unknown>;
};

function DynamicFormField({ 
  field, 
  value, 
  onChange 
}: { 
  field: FormFieldType; 
  value: unknown; 
  onChange: (value: unknown) => void;
}) {
  switch (field.fieldType) {
    case "text":
    case "email":
    case "phone":
      return (
        <Input
          type={field.fieldType === "email" ? "email" : field.fieldType === "phone" ? "tel" : "text"}
          placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
          value={(value as string) || ""}
          onChange={(e) => onChange(e.target.value)}
          data-testid={`input-${field.id}`}
        />
      );
    case "number":
      return (
        <Input
          type="number"
          placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
          value={(value as number) || ""}
          onChange={(e) => onChange(e.target.valueAsNumber || "")}
          data-testid={`input-${field.id}`}
        />
      );
    case "textarea":
      return (
        <Textarea
          placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
          value={(value as string) || ""}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          data-testid={`textarea-${field.id}`}
        />
      );
    case "dropdown":
      return (
        <Select value={(value as string) || ""} onValueChange={onChange}>
          <SelectTrigger data-testid={`select-${field.id}`}>
            <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
          </SelectTrigger>
          <SelectContent>
            {field.options?.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    case "multi-select":
      const selectedValues = (value as string[]) || [];
      return (
        <div className="space-y-2">
          {field.options?.map((opt) => (
            <div key={opt} className="flex items-center gap-2">
              <Checkbox
                checked={selectedValues.includes(opt)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    onChange([...selectedValues, opt]);
                  } else {
                    onChange(selectedValues.filter((v) => v !== opt));
                  }
                }}
                data-testid={`checkbox-${field.id}-${opt.toLowerCase().replace(/\s+/g, '-')}`}
              />
              <span className="text-sm">{opt}</span>
            </div>
          ))}
        </div>
      );
    case "checkbox":
      return (
        <Checkbox
          checked={(value as boolean) || false}
          onCheckedChange={onChange}
          data-testid={`checkbox-${field.id}`}
        />
      );
    case "datetime":
      return (
        <Input
          type="datetime-local"
          value={(value as string) || ""}
          onChange={(e) => onChange(e.target.value)}
          data-testid={`datetime-${field.id}`}
        />
      );
    case "date":
      return (
        <Input
          type="date"
          value={(value as string) || ""}
          onChange={(e) => onChange(e.target.value)}
          data-testid={`date-${field.id}`}
        />
      );
    default:
      return (
        <Input
          placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
          value={(value as string) || ""}
          onChange={(e) => onChange(e.target.value)}
        />
      );
  }
}

export default function CreateTicket() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("");
  const [dynamicFormData, setDynamicFormData] = useState<Record<string, unknown>>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const form = useForm<TicketFormData>({
    resolver: zodResolver(baseTicketSchema),
    defaultValues: {
      categoryId: "",
      subcategoryId: "",
      title: "",
      description: "",
      clientName: "",
      clientEmail: "",
      clientPhone: "",
      clientStatus: "",
      clientMood: "",
      locationId: "",
      priority: "medium",
      department: "",
      incidentDateTime: "",
      actionTakenImmediately: "",
      followUpRequired: false,
    },
  });

  const createTicketMutation = useMutation({
    mutationFn: async (data: TicketFormData) => {
      const response = await apiRequest("POST", "/api/tickets", {
        ...data,
        formData: dynamicFormData,
      });
      return response.json();
    },
    onSuccess: (ticket: Ticket) => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Ticket Created",
        description: `Ticket ${ticket.ticketNumber} has been created successfully.`,
      });
      setLocation(`/tickets/${ticket.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create ticket",
        variant: "destructive",
      });
    },
  });

  const analyzeWithAI = async () => {
    const description = form.getValues("description");
    if (!description || description.length < 50) {
      toast({
        title: "Need More Information",
        description: "Please provide at least 50 characters in the description for AI analysis.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await apiRequest("POST", "/api/ai/analyze", { text: description });
      const analysis = await response.json();
      
      if (analysis.suggestedCategory) {
        form.setValue("categoryId", analysis.suggestedCategory);
        setSelectedCategory(analysis.suggestedCategory);
      }
      if (analysis.suggestedPriority) {
        form.setValue("priority", analysis.suggestedPriority);
      }
      if (analysis.suggestedDepartment) {
        form.setValue("department", analysis.suggestedDepartment);
      }
      if (analysis.suggestedTitle) {
        form.setValue("title", analysis.suggestedTitle);
      }

      toast({
        title: "AI Analysis Complete",
        description: `Sentiment: ${analysis.sentiment || 'Neutral'}. Category and priority have been suggested.`,
      });
    } catch (error) {
      toast({
        title: "AI Analysis Failed",
        description: "Could not analyze the description. Please fill in the fields manually.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const category = categories.find((c) => c.id === selectedCategory);
  const subcategory = selectedCategory && selectedSubcategory
    ? getSubcategoryById(selectedCategory, selectedSubcategory)
    : null;
  const subcategoryFields = subcategory?.formFields || [];

  useEffect(() => {
    if (category) {
      form.setValue("department", category.defaultDepartment);
    }
  }, [category, form]);

  const onSubmit = (data: TicketFormData) => {
    createTicketMutation.mutate(data);
  };

  const priorityOptions = [
    { value: "low", label: "Low (Log Only)", description: "No immediate action needed" },
    { value: "medium", label: "Medium (48 hrs)", description: "Standard response time" },
    { value: "high", label: "High (24 hrs)", description: "Requires prompt attention" },
    { value: "critical", label: "Critical (Immediate)", description: "Requires immediate action" },
  ];

  const clientStatusOptions = [
    "Existing Active",
    "Existing Inactive",
    "New Prospect",
    "Trial Client",
    "Guest (Hosted Class)",
  ];

  const clientMoodOptions = [
    "Calm",
    "Frustrated",
    "Angry",
    "Disappointed",
    "Understanding",
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/tickets")}
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create Ticket</h1>
          <p className="text-muted-foreground">
            Record new customer feedback or issue
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm">
        <Badge variant={step >= 1 ? "default" : "secondary"}>1. Category</Badge>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
        <Badge variant={step >= 2 ? "default" : "secondary"}>2. Details</Badge>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
        <Badge variant={step >= 3 ? "default" : "secondary"}>3. Review</Badge>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Select Category</CardTitle>
                <CardDescription>
                  Choose the category that best describes the feedback or issue
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category *</FormLabel>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {categories.map((cat) => (
                          <div
                            key={cat.id}
                            className={`p-3 rounded-md border cursor-pointer transition-smooth hover-elevate ${
                              field.value === cat.id
                                ? "border-primary bg-primary/5"
                                : "border-border"
                            }`}
                            onClick={() => {
                              field.onChange(cat.id);
                              setSelectedCategory(cat.id);
                              setSelectedSubcategory("");
                              form.setValue("subcategoryId", "");
                            }}
                            data-testid={`category-${cat.id}`}
                          >
                            <div
                              className="w-8 h-8 rounded-md mb-2 flex items-center justify-center text-white text-xs font-bold"
                              style={{ backgroundColor: cat.color }}
                            >
                              {cat.name.charAt(0)}
                            </div>
                            <p className="font-medium text-sm">{cat.name}</p>
                          </div>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {category && (
                  <FormField
                    control={form.control}
                    name="subcategoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subcategory</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={(value) => {
                            field.onChange(value);
                            setSelectedSubcategory(value);
                            setDynamicFormData({});
                          }}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-subcategory">
                              <SelectValue placeholder="Select a subcategory (optional)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {category.subcategories.map((sub) => (
                              <SelectItem key={sub.id} value={sub.id}>
                                {sub.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {subcategory?.description && (
                          <FormDescription>{subcategory.description}</FormDescription>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <div className="flex justify-end">
                  <Button
                    type="button"
                    onClick={() => setStep(2)}
                    disabled={!selectedCategory}
                    data-testid="button-next-step"
                  >
                    Next: Enter Details
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 2 && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Client Information</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="clientName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client Name *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter client name" data-testid="input-client-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="clientEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client Email</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" placeholder="client@example.com" data-testid="input-client-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="clientPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client Phone</FormLabel>
                        <FormControl>
                          <Input {...field} type="tel" placeholder="+91 XXXXX XXXXX" data-testid="input-client-phone" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="clientStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client Status *</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger data-testid="select-client-status">
                              <SelectValue placeholder="Select client status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {clientStatusOptions.map((opt) => (
                              <SelectItem key={opt} value={opt}>
                                {opt}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="clientMood"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client Mood</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger data-testid="select-client-mood">
                              <SelectValue placeholder="Select mood (optional)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {clientMoodOptions.map((opt) => (
                              <SelectItem key={opt} value={opt}>
                                {opt}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="locationId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location *</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger data-testid="select-location">
                              <SelectValue placeholder="Select location" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {locations.map((loc) => (
                              <SelectItem key={loc.id} value={loc.id}>
                                {loc.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Issue Details</CardTitle>
                  <CardDescription>
                    Describe the issue in detail. Use AI to auto-analyze and suggest categorization.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description *</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Describe the issue in detail (minimum 50 characters)..."
                            rows={6}
                            data-testid="textarea-description"
                          />
                        </FormControl>
                        <div className="flex items-center justify-between">
                          <FormDescription>
                            {field.value.length}/50 minimum characters
                          </FormDescription>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={analyzeWithAI}
                            disabled={isAnalyzing || field.value.length < 50}
                            data-testid="button-ai-analyze"
                          >
                            {isAnalyzing ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Sparkles className="mr-2 h-4 w-4" />
                            )}
                            Analyze with AI
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Brief summary of the issue" data-testid="input-title" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="incidentDateTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Incident Date & Time</FormLabel>
                          <FormControl>
                            <Input {...field} type="datetime-local" data-testid="input-incident-datetime" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Priority *</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger data-testid="select-priority">
                                <SelectValue placeholder="Select priority" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {priorityOptions.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  <div>
                                    <span className="font-medium">{opt.label}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="department"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Department *</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger data-testid="select-department">
                                <SelectValue placeholder="Select department" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {departments.map((dept) => (
                                <SelectItem key={dept.id} value={dept.id}>
                                  {dept.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="actionTakenImmediately"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Action Taken Immediately</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="What was done on the spot to address the issue?"
                            rows={3}
                            data-testid="textarea-action-taken"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="followUpRequired"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="checkbox-followup"
                          />
                        </FormControl>
                        <FormLabel className="!mt-0">Follow-up Required</FormLabel>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {subcategoryFields.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Additional Details</CardTitle>
                    <CardDescription>
                      Specific fields for {subcategory?.name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-2">
                    {subcategoryFields.map((field) => (
                      <div key={field.id} className={field.fieldType === 'textarea' ? 'md:col-span-2' : ''}>
                        <Label className="mb-2 block">
                          {field.label}
                          {field.isRequired && ' *'}
                        </Label>
                        <DynamicFormField
                          field={field}
                          value={dynamicFormData[field.id]}
                          onChange={(value) =>
                            setDynamicFormData((prev) => ({ ...prev, [field.id]: value }))
                          }
                        />
                        {field.description && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {field.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  data-testid="button-prev-step"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button
                  type="button"
                  onClick={() => setStep(3)}
                  data-testid="button-review"
                >
                  Review Ticket
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </>
          )}

          {step === 3 && (
            <Card>
              <CardHeader>
                <CardTitle>Review & Submit</CardTitle>
                <CardDescription>
                  Please review the ticket details before submitting
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label className="text-muted-foreground text-xs">Category</Label>
                    <p className="font-medium">{category?.name || "-"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Subcategory</Label>
                    <p className="font-medium">{subcategory?.name || "-"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Client Name</Label>
                    <p className="font-medium">{form.getValues("clientName") || "-"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Location</Label>
                    <p className="font-medium">
                      {locations.find(l => l.id === form.getValues("locationId"))?.name || "-"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Priority</Label>
                    <Badge
                      variant="secondary"
                      className={`
                        ${form.getValues("priority") === "critical" ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" : ""}
                        ${form.getValues("priority") === "high" ? "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300" : ""}
                        ${form.getValues("priority") === "medium" ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300" : ""}
                        ${form.getValues("priority") === "low" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" : ""}
                      `}
                    >
                      {form.getValues("priority")}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Department</Label>
                    <p className="font-medium">
                      {departments.find(d => d.id === form.getValues("department"))?.name || "-"}
                    </p>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Title</Label>
                  <p className="font-medium">{form.getValues("title") || "-"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Description</Label>
                  <p className="text-sm whitespace-pre-wrap">{form.getValues("description") || "-"}</p>
                </div>
                {form.getValues("actionTakenImmediately") && (
                  <div>
                    <Label className="text-muted-foreground text-xs">Action Taken</Label>
                    <p className="text-sm">{form.getValues("actionTakenImmediately")}</p>
                  </div>
                )}
                <div className="flex justify-between pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(2)}
                    data-testid="button-back-to-details"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Edit Details
                  </Button>
                  <Button
                    type="submit"
                    disabled={createTicketMutation.isPending}
                    data-testid="button-submit-ticket"
                  >
                    {createTicketMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Create Ticket
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </form>
      </Form>
    </div>
  );
}
