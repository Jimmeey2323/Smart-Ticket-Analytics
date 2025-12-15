import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowLeft, ClipboardList, FileText, UserRound, Timer, MapPin, ShieldCheck, Paperclip } from "lucide-react";
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

  // Sidebar auto-hide removed to keep navigation persistent when creating tickets

  const { theme } = useTheme();
  const isDark = theme === 'dark' || (theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  return (
    <div className={`min-h-screen ${
      isDark ? 'bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-900' : 'bg-gradient-to-br from-white via-blue-50 to-slate-50'
    }`}>
      <div className="container mx-auto py-12 px-4 max-w-5xl">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/tickets')}
              className={`font-bold transition-all duration-300 ${
                isDark
                  ? 'text-blue-300 hover:text-blue-200 hover:bg-blue-500/20'
                  : 'text-blue-700 hover:text-blue-900 hover:bg-blue-100'
              }`}
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Tickets
            </Button>
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Logo" className="w-12 h-12 object-contain" />
            </div>
          </div>
          <div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4 accent-gradient-text">Create New Ticket</h1>
            <p className={`text-lg font-semibold ${
              isDark ? 'text-gray-300' : 'text-slate-700'
            }`}>Select a category and fill in the details to submit your ticket</p>
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
                <div>
                  <div className="mb-6">
                    <div className="bg-card rounded-xl border-2 border-card-border shadow-sm p-3 mb-6">
                      <div className="flex items-center justify-between gap-2">
                        {['category_selection','global','issue_details','reporter_client','timeline','location','operational','actions','attachments'].map((key, index) => {
                          const iconMap: Record<string, any> = {
                            category_selection: () => <img src="/logo.png" alt="Category" className="w-4 h-4 object-contain" />,
                            global: ClipboardList,
                            issue_details: FileText,
                            reporter_client: UserRound,
                            timeline: Timer,
                            location: MapPin,
                            operational: ShieldCheck,
                            actions: FileText,
                            attachments: Paperclip,
                          };
                          const IconComponent = iconMap[key] ?? FileText;
                          const isActive = index === 0;

                          return (
                            <React.Fragment key={key}>
                              <div className="group relative">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-150 ${
                                  isActive ? 'bg-black text-white ring-2 ring-black/10' : 'bg-muted text-muted-foreground'
                                }`}>
                                  {typeof IconComponent === 'function' ? (
                                    <IconComponent className="w-4 h-4" />
                                  ) : (
                                    <IconComponent className="w-4 h-4" />
                                  )}
                                </div>
                              </div>
                              {index < 8 && <div className="flex-1 h-1 rounded-full bg-muted" />}
                            </React.Fragment>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <CategorySelector
                    onCategorySelect={handleCategorySelect}
                    selectedCategory={selectedCategory}
                    selectedSubCategory={selectedSubCategory}
                  />
                </div>
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