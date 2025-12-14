import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowLeft } from "lucide-react";
import { CategorySelector } from "@/components/category-selector";
import { DynamicForm } from "@/components/dynamic-form";
import { FieldDefinition, TicketFormData } from "@shared/ticket-schema";
import type { Ticket } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { FIELD_DEFINITIONS } from "@shared/field-definitions";
import { AnimatePresence, motion } from "framer-motion";

export default function CreateTicket() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('');
  const [selectedCategoryName, setSelectedCategoryName] = useState<string>('');
  const [selectedSubCategoryName, setSelectedSubCategoryName] = useState<string>('');
  const [formFields, setFormFields] = useState<FieldDefinition[]>([]);
    const mergedFormFields: FieldDefinition[] = useMemo(() => {
      const essentialGlobalIds = new Set([
        'GLB-001',
        'GLB-002',
        'GLB-003',
        'GLB-004',
        'GLB-005',
        'GLB-006',
        'GLB-007',
        'GLB-008',
        'GLB-009',
        'GLB-010',
        'GLB-011',
        'GLB-012',
        'GLB-013',
        'GLB-014',
        'GLB-015',
        'GLB-016',
      ]);

      const globals = FIELD_DEFINITIONS.filter((f) => essentialGlobalIds.has(f.id));
      const systemFields: FieldDefinition[] = [
        {
          id: 'Assigned To',
          label: 'Assigned To',
          fieldType: 'Dropdown' as any,
          options: [],
          isRequired: false,
          isHidden: false,
          category: 'Global' as any,
          subCategory: 'Global' as any,
        } as any,
        {
          id: 'Status',
          label: 'Status',
          fieldType: 'Dropdown' as any,
          options: ['Open', 'In Progress', 'Pending', 'Resolved', 'Closed', 'Escalated'],
          isRequired: false,
          isHidden: false,
          category: 'Global' as any,
          subCategory: 'Global' as any,
        } as any,
      ];

      const all = [...globals, ...systemFields, ...formFields];
      return Array.from(new Map(all.map((f) => [f.id, f])).values());
    }, [formFields]);

  const [showForm, setShowForm] = useState(false);
  const [isAutoSelectingTemplate, setIsAutoSelectingTemplate] = useState(false);
  const [reportedAtIso, setReportedAtIso] = useState<string>('');

  // Allow deep-links (e.g. from Templates page) to preselect category/subcategory.
  useEffect(() => {
    if (showForm) return;

    const queryIndex = location.indexOf('?');
    if (queryIndex === -1) return;

    const search = location.slice(queryIndex + 1);
    const params = new URLSearchParams(search);

    const categoryId = (params.get('categoryId') || params.get('category') || '').trim();
    const subcategoryId = (params.get('subcategoryId') || params.get('subCategoryId') || params.get('subCategory') || '').trim();

    if (categoryId && !selectedCategory) setSelectedCategory(categoryId);
    if (subcategoryId && !selectedSubCategory) setSelectedSubCategory(subcategoryId);

    // If both values are present, treat it as a template deep-link and avoid
    // showing the category-selection UI.
    setIsAutoSelectingTemplate(Boolean(categoryId && subcategoryId));
  }, [location, selectedCategory, selectedSubCategory, showForm]);

  useEffect(() => {
    if (showForm && isAutoSelectingTemplate) setIsAutoSelectingTemplate(false);
  }, [showForm, isAutoSelectingTemplate]);

  const { data: locations = [] } = useQuery<any[]>({
    queryKey: ['/api/locations'],
    enabled: showForm,
  });

  const { data: nextTicketNumber } = useQuery<{ ticketNumber: string }>({
    queryKey: ['/api/tickets/next-number'],
    enabled: showForm,
  });

  const { data: fieldGroups = [] } = useQuery<any[]>({
    queryKey: ['/api/field-groups', selectedCategory, selectedSubCategory],
    enabled: showForm && !!selectedCategory,
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/field-groups?categoryId=${encodeURIComponent(selectedCategory)}&subcategoryId=${encodeURIComponent(selectedSubCategory)}`);
      return res.json();
    },
  });

  useEffect(() => {
    if (showForm && !reportedAtIso) {
      setReportedAtIso(new Date().toISOString());
    }
    if (!showForm && reportedAtIso) {
      setReportedAtIso('');
    }
  }, [showForm, reportedAtIso]);

  const createTicketMutation = useMutation({
    mutationFn: async (ticketData: any) => {
      const res = await apiRequest('POST', '/api/tickets', ticketData);
      return (await res.json()) as Ticket;
    },
    onSuccess: (data) => {
      toast({
        title: "Ticket Created Successfully! ✨",
        description: `Ticket ${data.ticketNumber ?? `#${data.id}`} has been created and assigned.`,
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

  const handleCategorySelect = (
    categoryId: string,
    subCategoryId: string,
    fields: FieldDefinition[],
    meta?: { categoryName?: string; subCategoryName?: string }
  ) => {
    setSelectedCategory(categoryId);
    setSelectedSubCategory(subCategoryId);
    setSelectedCategoryName(meta?.categoryName ?? categoryId);
    setSelectedSubCategoryName(meta?.subCategoryName ?? subCategoryId);
    setFormFields(fields);
    setShowForm(true);
  };

  const handleFormSubmit = (formData: TicketFormData) => {
    const mapDepartmentValue = (departmentOption: string): string | null => {
      const s = String(departmentOption || '').trim().toLowerCase();
      if (!s) return null;
      if (s.includes('operations')) return 'operations';
      if (s.includes('facilities')) return 'facilities';
      if (s.includes('training')) return 'training';
      if (s.includes('sales')) return 'sales';
      if (s.includes('client success')) return 'client_success';
      if (s.includes('marketing')) return 'marketing';
      if (s.includes('finance')) return 'finance';
      if (s.includes('management')) return 'management';
      return null;
    };

    const locationName = String(formData['GLB-004'] || '').trim();
    const locationId = locations.find((l) => String(l?.name || '').trim() === locationName)?.id ?? null;

    const mapStatusValue = (statusOption: string): string | undefined => {
      const s = String(statusOption || '').trim().toLowerCase();
      if (!s) return undefined;
      if (s === 'open') return 'open';
      if (s === 'in progress' || s === 'in_progress') return 'in_progress';
      if (s === 'pending') return 'pending';
      if (s === 'resolved') return 'resolved';
      if (s === 'closed') return 'closed';
      if (s === 'escalated') return 'escalated';
      return undefined;
    };

    const assignedValue = String((formData as any)['Assigned To'] ?? '').trim();
    const assigneeId = !assignedValue || assignedValue === '__UNASSIGNED__' ? null : assignedValue;
    const status = mapStatusValue(String((formData as any)['Status'] ?? ''));

    const followUps = Array.isArray((formData as any).__followUps) ? (formData as any).__followUps : [];
    const firstFollowUpDate = followUps.find((fu: any) => String(fu?.date ?? '').trim())?.date;

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
      clientStatus: formData['GLB-009'] || '',
      clientMood: formData['GLB-014'] || '',
      priority: mapPriorityValue(formData['GLB-010']) || 'medium',
      department: mapDepartmentValue(formData['GLB-011']) || undefined,
      locationId,
      incidentDateTime: formData['GLB-003'] ? new Date(String(formData['GLB-003'])).toISOString() : undefined,
      actionTakenImmediately: formData['GLB-013'] || '',
      followUpRequired: Boolean((formData as any)['GLB-015'] === true || (formData as any)['GLB-015'] === 'true'),
      followUpDate: firstFollowUpDate ? new Date(String(firstFollowUpDate)).toISOString() : undefined,
      assigneeId,
      reportedById: user?.id,
      status,
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

  const initialFormData: TicketFormData = useMemo(() => {
    const first = String((user as any)?.firstName ?? '').trim();
    const last = String((user as any)?.lastName ?? '').trim();
    const displayName = `${first} ${last}`.trim() || String((user as any)?.email ?? '').trim() || '';
    return {
      // Preview Ticket ID (server-generated)
      'GLB-001': nextTicketNumber?.ticketNumber ?? '',
      // Auto-populated
      'GLB-002': reportedAtIso || new Date().toISOString(),
      'GLB-005': displayName,
      // Defaults
      'GLB-010': 'Medium (48hrs)',
      'Assigned To': '__UNASSIGNED__' as any,
      'Status': 'Open' as any,
    };
  }, [user, nextTicketNumber?.ticketNumber, reportedAtIso]);

  // Auto-hide sidebar on mount and implement hover functionality
  useEffect(() => {
    const sidebarTrigger = document.querySelector('[data-sidebar="trigger"]') as HTMLElement;
    const sidebar = document.querySelector('[data-sidebar="sidebar"]') as HTMLElement;
    
    // Auto-hide on mount
    if (sidebarTrigger) {
      sidebarTrigger.click();
    }

    // Implement hover behavior
    let hideTimeout: NodeJS.Timeout;
    
    const handleMouseEnter = () => {
      clearTimeout(hideTimeout);
      // Show sidebar if hidden
      const isHidden = sidebar?.getAttribute('data-state') === 'collapsed';
      if (isHidden && sidebarTrigger) {
        sidebarTrigger.click();
      }
    };

    const handleMouseLeave = () => {
      // Auto-hide after 2 seconds of mouse leaving
      hideTimeout = setTimeout(() => {
        const isVisible = sidebar?.getAttribute('data-state') === 'expanded';
        const isPinned = sidebar?.hasAttribute('data-pinned');
        if (isVisible && !isPinned && sidebarTrigger) {
          sidebarTrigger.click();
        }
      }, 2000);
    };

    if (sidebar) {
      sidebar.addEventListener('mouseenter', handleMouseEnter);
      sidebar.addEventListener('mouseleave', handleMouseLeave);
    }

    return () => {
      clearTimeout(hideTimeout);
      if (sidebar) {
        sidebar.removeEventListener('mouseenter', handleMouseEnter);
        sidebar.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/tickets')}
              className="text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Tickets
            </Button>
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Create New Ticket
            </h1>
            <p className="text-muted-foreground">Select a category and fill in the details to submit your ticket</p>
          </div>
        </div>

        <AnimatePresence mode="wait" initial={false}>
          {!showForm ? (
            <motion.div
              key="category-selector"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="bg-card rounded-xl border border-card-border shadow-lg p-6"
            >
              {isAutoSelectingTemplate ? (
                <div className="space-y-4">
                  {/* Mount CategorySelector offscreen to compute fields & trigger auto-selection */}
                  <div className="hidden">
                    <CategorySelector
                      onCategorySelect={handleCategorySelect}
                      selectedCategory={selectedCategory}
                      selectedSubCategory={selectedSubCategory}
                    />
                  </div>

                  <Card className="max-w-3xl mx-auto">
                    <CardHeader>
                      <CardTitle>Loading template…</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Skeleton className="h-5 w-64" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-5/6" />
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <CategorySelector
                  onCategorySelect={handleCategorySelect}
                  selectedCategory={selectedCategory}
                  selectedSubCategory={selectedSubCategory}
                />
              )}
            </motion.div>
          ) : (
            <motion.div
              key="ticket-form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowForm(false)}
                  className="text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Change Category
                </Button>
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{selectedCategoryName || selectedCategory}</span>
                  <span className="px-1">→</span>
                  <span className="font-medium text-foreground">{selectedSubCategoryName || selectedSubCategory}</span>
                </div>
              </div>

              <DynamicForm
                fields={mergedFormFields}
                onSubmit={handleFormSubmit}
                initialData={initialFormData}
                isLoading={createTicketMutation.isPending}
                title="Create Ticket"
                description="Fill in the details below to create your ticket. Required fields are marked with an asterisk."
                mode="create"
                fieldGroups={fieldGroups}
                context={{ 
                  categoryName: selectedCategoryName, 
                  subCategoryName: selectedSubCategoryName,
                  showForm,
                  onBackToCategory: () => setShowForm(false)
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}