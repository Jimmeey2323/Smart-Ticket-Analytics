import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowLeft, Sparkles } from "lucide-react";
import { CategorySelector } from "@/components/category-selector";
import { DynamicForm } from "@/components/dynamic-form";
import { FieldDefinition, TicketFormData } from "@shared/ticket-schema";
import type { Ticket } from "@shared/schema";

export default function CreateTicket() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('');
  const [formFields, setFormFields] = useState<FieldDefinition[]>([]);
  const [showForm, setShowForm] = useState(false);

  const createTicketMutation = useMutation({
    mutationFn: async (ticketData: any) => {
      const res = await apiRequest('POST', '/api/tickets', ticketData);
      return (await res.json()) as Ticket;
    },
    onSuccess: (data) => {
      toast({
        title: "Ticket Created Successfully! ✨",
        description: `Ticket #${data.id} has been created and assigned.`,
      });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      navigate('/tickets');
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Create Ticket",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    },
  });

  const handleCategorySelect = (categoryId: string, subCategoryId: string, fields: FieldDefinition[]) => {
    setSelectedCategory(categoryId);
    setSelectedSubCategory(subCategoryId);
    setFormFields(fields);
    setShowForm(true);
  };

  const handleFormSubmit = (formData: TicketFormData) => {
    // Transform the form data into the ticket format
    const ticketData = {
      ...formData,
      categoryId: selectedCategory,
      subcategoryId: selectedSubCategory,
      // Map common fields
      title: formData['GLB-012'] || 'New Ticket', // Issue Description as title
      description: formData['GLB-012'] || '',
      clientName: formData['GLB-006'] || '',
      clientEmail: formData['GLB-007'] || '',
      clientPhone: formData['GLB-008'] || '',
      priority: mapPriorityValue(formData['GLB-010']) || 'medium',
      location: formData['GLB-004'] || '',
      department: formData['GLB-011'] || '',
      followUpRequired: formData['GLB-015'] || false,
      formData: formData // Store all form data for reference
    };

    createTicketMutation.mutate(ticketData);
  };

  const mapPriorityValue = (priorityOption: string): string => {
    if (!priorityOption) return 'medium';
    
    if (priorityOption.includes('Low')) return 'low';
    if (priorityOption.includes('Medium')) return 'medium';
    if (priorityOption.includes('High')) return 'high';
    if (priorityOption.includes('Critical')) return 'critical';
    
    return 'medium';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50">
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/tickets')}
              className="hover:bg-white/80 backdrop-blur-sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Tickets
            </Button>
            <div className="flex items-center space-x-2">
              <Sparkles className="w-6 h-6 text-violet-600" />
              <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                Create New Ticket
              </h1>
            </div>
          </div>
        </div>

        {!showForm ? (
          <CategorySelector
            onCategorySelect={handleCategorySelect}
            selectedCategory={selectedCategory}
            selectedSubCategory={selectedSubCategory}
          />
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowForm(false)}
                className="hover:bg-white/80 backdrop-blur-sm"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Change Category
              </Button>
              <div className="text-sm text-gray-600">
                Category: <span className="font-medium">{selectedCategory}</span> → 
                <span className="font-medium"> {selectedSubCategory}</span>
              </div>
            </div>

            <DynamicForm
              fields={formFields}
              onSubmit={handleFormSubmit}
              isLoading={createTicketMutation.isPending}
              title="Create Ticket"
              description="Fill in the details below to create your ticket. Required fields are marked with an asterisk."
            />
          </div>
        )}
      </div>
    </div>
  );
}