import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Settings as SettingsIcon, Wrench, LayoutGrid, Route, Users as UsersIcon, FilePenLine, FolderPlus } from "lucide-react";

const FIELD_TYPES = [
  "Auto-generated",
  "DateTime",
  "Dropdown",
  "Text",
  "Email",
  "Phone",
  "Long Text",
  "Checkbox",
  "File Upload",
  "Number",
] as const;

type FormFieldRow = {
  id: string;
  label: string;
  fieldType: string;
  options?: any;
  description?: string | null;
  isRequired: boolean;
  isHidden: boolean;
  orderIndex?: number;
};

type FieldGroupRow = {
  id: string;
  name: string;
  categoryId?: string | null;
  subCategoryId?: string | null;
  fieldIds?: any;
  orderIndex?: number;
};

type AssignmentRuleRow = {
  id: string;
  name: string;
  categoryId?: string | null;
  subcategoryId?: string | null;
  department?: string | null;
  priority?: string | null;
  assignToUserId?: string | null;
  isActive?: boolean;
};

type AdminUserRow = {
  id: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  role?: string | null;
  department?: string | null;
  isActive?: boolean | null;
};

const USER_ROLES = ["admin", "manager", "team_member", "support_staff"] as const;
const DEPARTMENTS = [
  "operations",
  "facilities",
  "training",
  "sales",
  "client_success",
  "marketing",
  "finance",
  "management",
] as const;

type AdminCategoryRow = {
  id: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  color?: string | null;
  defaultDepartment?: string | null;
  isActive?: boolean | null;
};

type AdminSubcategoryRow = {
  id: string;
  categoryId: string;
  name: string;
  description?: string | null;
  defaultDepartment?: string | null;
  isActive?: boolean | null;
  formFields?: any;
  form_fields?: any;
};

function compact(s: any): string {
  return String(s ?? "").replace(/\s+/g, " ").trim();
}

function parseEmbeddedFields(raw: any): any[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw.fields)) return raw.fields;
  return [];
}

function withEmbeddedFields(raw: any, fields: any[]): any {
  if (!raw) return { fields };
  if (Array.isArray(raw)) return fields;
  return { ...(raw as any), fields };
}

function normalizeOptions(raw: any): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map((x) => String(x));
  if (Array.isArray(raw?.fields)) return raw.fields.map((x: any) => String(x));
  return [];
}

export default function SettingsPage() {
  const { toast } = useToast();

  const { data: categories = [] } = useQuery<any[]>({ queryKey: ["/api/categories"] });
  const { data: users = [] } = useQuery<any[]>({ queryKey: ["/api/users"] });

  const { data: adminUsers = [], error: adminUsersError } = useQuery<AdminUserRow[]>({
    queryKey: ["/api/admin/users"],
  });

  const createUserMutation = useMutation({
    mutationFn: async (payload: { email: string; password?: string; firstName?: string; lastName?: string; role?: string; department?: string | null }) => {
      const res = await apiRequest("POST", "/api/admin/users", payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "Created", description: "User created" });
    },
    onError: (e: any) => toast({ title: "Create failed", description: String(e?.message || e), variant: "destructive" }),
  });

  const updateUserMutation = useMutation({
    mutationFn: async (payload: Partial<AdminUserRow> & { id: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/users/${encodeURIComponent(payload.id)}`, payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "Saved", description: "User updated" });
    },
    onError: (e: any) => toast({ title: "Save failed", description: String(e?.message || e), variant: "destructive" }),
  });

  const updateSubcategoryFormMutation = useMutation({
    mutationFn: async (payload: { categoryId: string; subcategoryId: string; formFields: any }) => {
      const res = await apiRequest("PATCH", `/api/admin/subcategories/${encodeURIComponent(payload.subcategoryId)}`, {
        formFields: payload.formFields,
      });
      return res.json();
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/categories", vars.categoryId, "subcategories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/field-groups"] });
      toast({ title: "Saved", description: "Form updated" });
    },
    onError: (e: any) => toast({ title: "Save failed", description: String(e?.message || e), variant: "destructive" }),
  });

  const { data: formFields = [], isLoading: isLoadingFields, error: fieldsError } = useQuery<FormFieldRow[]>({
    queryKey: ["/api/admin/form-fields"],
  });

  const { data: fieldGroups = [], isLoading: isLoadingGroups, error: groupsError } = useQuery<FieldGroupRow[]>({
    queryKey: ["/api/admin/field-groups"],
  });

  const { data: assignmentRules = [], isLoading: isLoadingRules, error: rulesError } = useQuery<AssignmentRuleRow[]>({
    queryKey: ["/api/admin/assignment-rules"],
  });

  const upsertFieldMutation = useMutation({
    mutationFn: async (payload: Partial<FormFieldRow> & { id: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/form-fields/${encodeURIComponent(payload.id)}`, payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/form-fields"] });
      toast({ title: "Saved", description: "Field updated" });
    },
    onError: (e: any) => toast({ title: "Save failed", description: String(e?.message || e), variant: "destructive" }),
  });

  const createFieldMutation = useMutation({
    mutationFn: async (payload: Partial<FormFieldRow>) => {
      const res = await apiRequest("POST", "/api/admin/form-fields", payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/form-fields"] });
      toast({ title: "Created", description: "New field created" });
    },
    onError: (e: any) => toast({ title: "Create failed", description: String(e?.message || e), variant: "destructive" }),
  });

  const deleteFieldMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/form-fields/${encodeURIComponent(id)}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/form-fields"] });
      toast({ title: "Deleted", description: "Field deleted" });
    },
    onError: (e: any) => toast({ title: "Delete failed", description: String(e?.message || e), variant: "destructive" }),
  });

  const upsertGroupMutation = useMutation({
    mutationFn: async (payload: Partial<FieldGroupRow> & { id: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/field-groups/${encodeURIComponent(payload.id)}`, payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/field-groups"] });
      toast({ title: "Saved", description: "Group updated" });
    },
    onError: (e: any) => toast({ title: "Save failed", description: String(e?.message || e), variant: "destructive" }),
  });

  const createGroupMutation = useMutation({
    mutationFn: async (payload: Partial<FieldGroupRow>) => {
      const res = await apiRequest("POST", "/api/admin/field-groups", payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/field-groups"] });
      toast({ title: "Created", description: "New group created" });
    },
    onError: (e: any) => toast({ title: "Create failed", description: String(e?.message || e), variant: "destructive" }),
  });

  const deleteGroupMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/field-groups/${encodeURIComponent(id)}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/field-groups"] });
      toast({ title: "Deleted", description: "Group deleted" });
    },
    onError: (e: any) => toast({ title: "Delete failed", description: String(e?.message || e), variant: "destructive" }),
  });

  const upsertRuleMutation = useMutation({
    mutationFn: async (payload: Partial<AssignmentRuleRow> & { id: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/assignment-rules/${encodeURIComponent(payload.id)}`, payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/assignment-rules"] });
      toast({ title: "Saved", description: "Rule updated" });
    },
    onError: (e: any) => toast({ title: "Save failed", description: String(e?.message || e), variant: "destructive" }),
  });

  const createRuleMutation = useMutation({
    mutationFn: async (payload: Partial<AssignmentRuleRow>) => {
      const res = await apiRequest("POST", "/api/admin/assignment-rules", payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/assignment-rules"] });
      toast({ title: "Created", description: "New rule created" });
    },
    onError: (e: any) => toast({ title: "Create failed", description: String(e?.message || e), variant: "destructive" }),
  });

  const deleteRuleMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/assignment-rules/${encodeURIComponent(id)}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/assignment-rules"] });
      toast({ title: "Deleted", description: "Rule deleted" });
    },
    onError: (e: any) => toast({ title: "Delete failed", description: String(e?.message || e), variant: "destructive" }),
  });

  const [newFieldId, setNewFieldId] = useState("");
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [newFieldType, setNewFieldType] = useState<(typeof FIELD_TYPES)[number]>("Text");

  const [newGroupName, setNewGroupName] = useState("");

  const [newRuleName, setNewRuleName] = useState("");

  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserFirstName, setNewUserFirstName] = useState("");
  const [newUserLastName, setNewUserLastName] = useState("");
  const [newUserRole, setNewUserRole] = useState<(typeof USER_ROLES)[number]>("support_staff");
  const [newUserDepartment, setNewUserDepartment] = useState<string>("");

  const [catsCategoryId, setCatsCategoryId] = useState<string>("");
  const { data: catsSubcategories = [] } = useQuery<AdminSubcategoryRow[]>({
    queryKey: ["/api/categories", catsCategoryId, "subcategories"],
    enabled: Boolean(catsCategoryId),
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/categories/${encodeURIComponent(catsCategoryId)}/subcategories`);
      return res.json();
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (payload: Partial<AdminCategoryRow>) => {
      const res = await apiRequest("POST", "/api/admin/categories", payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({ title: "Created", description: "Category created" });
    },
    onError: (e: any) => toast({ title: "Create failed", description: String(e?.message || e), variant: "destructive" }),
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async (payload: Partial<AdminCategoryRow> & { id: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/categories/${encodeURIComponent(payload.id)}`, payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      if (catsCategoryId) {
        queryClient.invalidateQueries({ queryKey: ["/api/categories", catsCategoryId, "subcategories"] });
      }
      toast({ title: "Saved", description: "Category updated" });
    },
    onError: (e: any) => toast({ title: "Save failed", description: String(e?.message || e), variant: "destructive" }),
  });

  const createSubcategoryMutation = useMutation({
    mutationFn: async (payload: { categoryId: string } & Partial<AdminSubcategoryRow>) => {
      const res = await apiRequest(
        "POST",
        `/api/admin/categories/${encodeURIComponent(payload.categoryId)}/subcategories`,
        payload
      );
      return res.json();
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/categories", vars.categoryId, "subcategories"] });
      toast({ title: "Created", description: "Subcategory created" });
    },
    onError: (e: any) => toast({ title: "Create failed", description: String(e?.message || e), variant: "destructive" }),
  });

  const updateSubcategoryMetaMutation = useMutation({
    mutationFn: async (payload: Partial<AdminSubcategoryRow> & { id: string; categoryId: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/subcategories/${encodeURIComponent(payload.id)}/meta`, payload);
      return res.json();
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/categories", vars.categoryId, "subcategories"] });
      toast({ title: "Saved", description: "Subcategory updated" });
    },
    onError: (e: any) => toast({ title: "Save failed", description: String(e?.message || e), variant: "destructive" }),
  });

  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryDescription, setNewCategoryDescription] = useState("");
  const [newCategoryIcon, setNewCategoryIcon] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState("");
  const [newCategoryDepartment, setNewCategoryDepartment] = useState<string>("");
  const [newCategoryActive, setNewCategoryActive] = useState<string>("true");

  const [editCategoryId, setEditCategoryId] = useState<string>("");
  const [editCategoryName, setEditCategoryName] = useState("");
  const [editCategoryDescription, setEditCategoryDescription] = useState("");
  const [editCategoryIcon, setEditCategoryIcon] = useState("");
  const [editCategoryColor, setEditCategoryColor] = useState("");
  const [editCategoryDepartment, setEditCategoryDepartment] = useState<string>("");
  const [editCategoryActive, setEditCategoryActive] = useState<string>("true");

  const [newSubcategoryName, setNewSubcategoryName] = useState("");
  const [newSubcategoryDescription, setNewSubcategoryDescription] = useState("");
  const [newSubcategoryDepartment, setNewSubcategoryDepartment] = useState<string>("");
  const [newSubcategoryActive, setNewSubcategoryActive] = useState<string>("true");
  const [newSubcategoryCloneFromId, setNewSubcategoryCloneFromId] = useState<string>("");

  const [editSubcategoryId, setEditSubcategoryId] = useState<string>("");
  const [editSubcategoryName, setEditSubcategoryName] = useState("");
  const [editSubcategoryDescription, setEditSubcategoryDescription] = useState("");
  const [editSubcategoryDepartment, setEditSubcategoryDepartment] = useState<string>("");
  const [editSubcategoryActive, setEditSubcategoryActive] = useState<string>("true");

  const [formsCategoryId, setFormsCategoryId] = useState<string>("");
  const { data: formsSubcategories = [] } = useQuery<any[]>({
    queryKey: ["/api/categories", formsCategoryId, "subcategories"],
    enabled: Boolean(formsCategoryId),
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/categories/${encodeURIComponent(formsCategoryId)}/subcategories`);
      return res.json();
    },
  });

  const [formsSubcategoryId, setFormsSubcategoryId] = useState<string>("");
  const selectedSubcategory = useMemo(() => formsSubcategories.find((s) => s.id === formsSubcategoryId) ?? null, [formsSubcategories, formsSubcategoryId]);
  const [rawFormJson, setRawFormJson] = useState<string>("");

  const embeddedFields = useMemo(() => {
    const raw = (selectedSubcategory as any)?.formFields ?? (selectedSubcategory as any)?.form_fields;
    return parseEmbeddedFields(raw);
  }, [selectedSubcategory]);

  const [draftFields, setDraftFields] = useState<any[]>([]);
  const [addFieldId, setAddFieldId] = useState<string>("");

  useEffect(() => {
    setDraftFields(embeddedFields);
    const raw = (selectedSubcategory as any)?.formFields ?? (selectedSubcategory as any)?.form_fields;
    setRawFormJson(raw ? JSON.stringify(raw, null, 2) : JSON.stringify({ fields: [] }, null, 2));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formsSubcategoryId, embeddedFields]);

  const sortedFields = useMemo(() => {
    return [...formFields].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0) || a.id.localeCompare(b.id));
  }, [formFields]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <SettingsIcon className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold">Settings</h1>
          <p className="text-sm text-muted-foreground">Global form configuration (admin/manager only)</p>
        </div>
      </div>

      <Tabs defaultValue="fields" className="w-full">
        <TabsList>
          <TabsTrigger value="categories" className="gap-2">
            <FolderPlus className="h-4 w-4" />
            Categories
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <UsersIcon className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="fields" className="gap-2">
            <Wrench className="h-4 w-4" />
            Form Fields
          </TabsTrigger>
          <TabsTrigger value="forms" className="gap-2">
            <FilePenLine className="h-4 w-4" />
            Forms
          </TabsTrigger>
          <TabsTrigger value="groups" className="gap-2">
            <LayoutGrid className="h-4 w-4" />
            Section Groups
          </TabsTrigger>
          <TabsTrigger value="automation" className="gap-2">
            <Route className="h-4 w-4" />
            Automation
          </TabsTrigger>
        </TabsList>

        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle>Categories & Subcategories</CardTitle>
              <CardDescription>Manage the taxonomy that powers ticket templates and forms.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-3 sm:items-end sm:justify-between">
                <div className="space-y-2 w-full sm:max-w-[360px]">
                  <Label>Category</Label>
                  <Select value={catsCategoryId} onValueChange={setCatsCategoryId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c: any) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline">New Category</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                      <DialogHeader>
                        <DialogTitle>Create Category</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Name</Label>
                          <Input
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            placeholder="e.g. Retail & Merchandise"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Description</Label>
                          <Textarea
                            value={newCategoryDescription}
                            onChange={(e) => setNewCategoryDescription(e.target.value)}
                            placeholder="Optional"
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Icon</Label>
                            <Input
                              value={newCategoryIcon}
                              onChange={(e) => setNewCategoryIcon(e.target.value)}
                              placeholder="e.g. ShoppingBag"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Color</Label>
                            <Input
                              value={newCategoryColor}
                              onChange={(e) => setNewCategoryColor(e.target.value)}
                              placeholder="#3b82f6"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Default Department</Label>
                            <Select value={newCategoryDepartment} onValueChange={setNewCategoryDepartment}>
                              <SelectTrigger>
                                <SelectValue placeholder="None" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="">None</SelectItem>
                                {DEPARTMENTS.map((d) => (
                                  <SelectItem key={d} value={d}>
                                    {d}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Active</Label>
                            <Select value={newCategoryActive} onValueChange={setNewCategoryActive}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="true">Yes</SelectItem>
                                <SelectItem value="false">No</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          onClick={() =>
                            createCategoryMutation.mutate({
                              name: compact(newCategoryName),
                              description: compact(newCategoryDescription) || null,
                              icon: compact(newCategoryIcon) || null,
                              color: compact(newCategoryColor) || null,
                              defaultDepartment: newCategoryDepartment || null,
                              isActive: newCategoryActive === "true",
                            })
                          }
                          disabled={createCategoryMutation.isPending}
                        >
                          Create
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        disabled={!catsCategoryId}
                        onClick={() => {
                          const current = categories.find((c: any) => c.id === catsCategoryId);
                          if (!current) return;
                          setEditCategoryId(current.id);
                          setEditCategoryName(String(current.name ?? ""));
                          setEditCategoryDescription(String(current.description ?? ""));
                          setEditCategoryIcon(String(current.icon ?? ""));
                          setEditCategoryColor(String(current.color ?? ""));
                          setEditCategoryDepartment(String(current.defaultDepartment ?? ""));
                          setEditCategoryActive(String(Boolean(current.isActive)));
                        }}
                      >
                        Edit Category
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                      <DialogHeader>
                        <DialogTitle>Edit Category</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Name</Label>
                          <Input value={editCategoryName} onChange={(e) => setEditCategoryName(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label>Description</Label>
                          <Textarea value={editCategoryDescription} onChange={(e) => setEditCategoryDescription(e.target.value)} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Icon</Label>
                            <Input value={editCategoryIcon} onChange={(e) => setEditCategoryIcon(e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label>Color</Label>
                            <Input value={editCategoryColor} onChange={(e) => setEditCategoryColor(e.target.value)} />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Default Department</Label>
                            <Select value={editCategoryDepartment} onValueChange={setEditCategoryDepartment}>
                              <SelectTrigger>
                                <SelectValue placeholder="None" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="">None</SelectItem>
                                {DEPARTMENTS.map((d) => (
                                  <SelectItem key={d} value={d}>
                                    {d}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Active</Label>
                            <Select value={editCategoryActive} onValueChange={setEditCategoryActive}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="true">Yes</SelectItem>
                                <SelectItem value="false">No</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          onClick={() =>
                            updateCategoryMutation.mutate({
                              id: editCategoryId,
                              name: compact(editCategoryName),
                              description: compact(editCategoryDescription) || null,
                              icon: compact(editCategoryIcon) || null,
                              color: compact(editCategoryColor) || null,
                              defaultDepartment: editCategoryDepartment || null,
                              isActive: editCategoryActive === "true",
                            })
                          }
                          disabled={!editCategoryId || updateCategoryMutation.isPending}
                        >
                          Save
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              <div className="rounded-lg border">
                <div className="flex flex-col gap-2 border-b bg-muted/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-sm font-medium">Subcategories</div>
                    <div className="text-xs text-muted-foreground">Create, duplicate, and edit subcategories under the selected category.</div>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" disabled={!catsCategoryId}>
                        New Subcategory
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                      <DialogHeader>
                        <DialogTitle>Create Subcategory</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Duplicate From (optional)</Label>
                          <Select value={newSubcategoryCloneFromId} onValueChange={setNewSubcategoryCloneFromId}>
                            <SelectTrigger>
                              <SelectValue placeholder="Blank form" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">Blank form</SelectItem>
                              {catsSubcategories.map((s) => (
                                <SelectItem key={s.id} value={s.id}>
                                  {s.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Name</Label>
                          <Input
                            value={newSubcategoryName}
                            onChange={(e) => setNewSubcategoryName(e.target.value)}
                            placeholder="e.g. Product Issue"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Description</Label>
                          <Textarea
                            value={newSubcategoryDescription}
                            onChange={(e) => setNewSubcategoryDescription(e.target.value)}
                            placeholder="Optional"
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Default Department</Label>
                            <Select value={newSubcategoryDepartment} onValueChange={setNewSubcategoryDepartment}>
                              <SelectTrigger>
                                <SelectValue placeholder="None" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="">None</SelectItem>
                                {DEPARTMENTS.map((d) => (
                                  <SelectItem key={d} value={d}>
                                    {d}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Active</Label>
                            <Select value={newSubcategoryActive} onValueChange={setNewSubcategoryActive}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="true">Yes</SelectItem>
                                <SelectItem value="false">No</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          onClick={() =>
                            createSubcategoryMutation.mutate((() => {
                              const source = catsSubcategories.find((s) => s.id === newSubcategoryCloneFromId);
                              const sourceFormFields = (source as any)?.formFields ?? (source as any)?.form_fields;
                              return {
                                categoryId: catsCategoryId,
                                name: compact(newSubcategoryName),
                                description: compact(newSubcategoryDescription) || null,
                                defaultDepartment: newSubcategoryDepartment || null,
                                isActive: newSubcategoryActive === "true",
                                ...(sourceFormFields !== undefined ? { formFields: sourceFormFields } : {}),
                              };
                            })())
                          }
                          disabled={!catsCategoryId || createSubcategoryMutation.isPending}
                        >
                          Create
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[28%]">Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="w-[18%]">Department</TableHead>
                      <TableHead className="w-[10%]">Active</TableHead>
                      <TableHead className="w-[12%]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!catsCategoryId ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-sm text-muted-foreground">
                          Select a category to manage subcategories.
                        </TableCell>
                      </TableRow>
                    ) : catsSubcategories.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-sm text-muted-foreground">
                          No subcategories yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      catsSubcategories.map((s) => (
                        <TableRow key={s.id}>
                          <TableCell>
                            <div className="text-sm font-medium">{compact(s.name)}</div>
                            <div className="text-xs text-muted-foreground">{s.id}</div>
                          </TableCell>
                          <TableCell className="text-sm">{compact(s.description) || "—"}</TableCell>
                          <TableCell className="text-sm">{String(s.defaultDepartment ?? "") || "—"}</TableCell>
                          <TableCell className="text-sm">{Boolean(s.isActive) ? "Yes" : "No"}</TableCell>
                          <TableCell>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setEditSubcategoryId(s.id);
                                    setEditSubcategoryName(String(s.name ?? ""));
                                    setEditSubcategoryDescription(String(s.description ?? ""));
                                    setEditSubcategoryDepartment(String(s.defaultDepartment ?? ""));
                                    setEditSubcategoryActive(String(Boolean(s.isActive)));
                                  }}
                                >
                                  Edit
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-lg">
                                <DialogHeader>
                                  <DialogTitle>Edit Subcategory</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="space-y-2">
                                    <Label>Name</Label>
                                    <Input value={editSubcategoryName} onChange={(e) => setEditSubcategoryName(e.target.value)} />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Description</Label>
                                    <Textarea value={editSubcategoryDescription} onChange={(e) => setEditSubcategoryDescription(e.target.value)} />
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <Label>Default Department</Label>
                                      <Select value={editSubcategoryDepartment} onValueChange={setEditSubcategoryDepartment}>
                                        <SelectTrigger>
                                          <SelectValue placeholder="None" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="">None</SelectItem>
                                          {DEPARTMENTS.map((d) => (
                                            <SelectItem key={d} value={d}>
                                              {d}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Active</Label>
                                      <Select value={editSubcategoryActive} onValueChange={setEditSubcategoryActive}>
                                        <SelectTrigger>
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="true">Yes</SelectItem>
                                          <SelectItem value="false">No</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button
                                    onClick={() =>
                                      updateSubcategoryMetaMutation.mutate({
                                        id: editSubcategoryId,
                                        categoryId: catsCategoryId,
                                        name: compact(editSubcategoryName),
                                        description: compact(editSubcategoryDescription) || null,
                                        defaultDepartment: editSubcategoryDepartment || null,
                                        isActive: editSubcategoryActive === "true",
                                      })
                                    }
                                    disabled={!editSubcategoryId || updateSubcategoryMetaMutation.isPending}
                                  >
                                    Save
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {(adminUsersError as any) && (
                <div className="text-sm text-destructive">Failed to load admin users (admin role required).</div>
              )}

              <div className="flex items-center justify-between gap-3">
                <div className="text-sm text-muted-foreground">Create users, change roles/permissions, and deactivate accounts.</div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>Create User</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Create User</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} placeholder="name@company.com" />
                      </div>
                      <div className="space-y-2">
                        <Label>Temporary Password (optional)</Label>
                        <Input value={newUserPassword} onChange={(e) => setNewUserPassword(e.target.value)} placeholder="Leave blank to send invite" />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>First Name</Label>
                          <Input value={newUserFirstName} onChange={(e) => setNewUserFirstName(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label>Last Name</Label>
                          <Input value={newUserLastName} onChange={(e) => setNewUserLastName(e.target.value)} />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Role</Label>
                          <Select value={newUserRole} onValueChange={(v) => setNewUserRole(v as any)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                              {USER_ROLES.map((r) => (
                                <SelectItem key={r} value={r}>
                                  {r}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Department (optional)</Label>
                          <Select value={newUserDepartment} onValueChange={(v) => setNewUserDepartment(v)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">None</SelectItem>
                              {DEPARTMENTS.map((d) => (
                                <SelectItem key={d} value={d}>
                                  {d}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        onClick={() =>
                          createUserMutation.mutate({
                            email: compact(newUserEmail),
                            password: compact(newUserPassword) || undefined,
                            firstName: compact(newUserFirstName) || undefined,
                            lastName: compact(newUserLastName) || undefined,
                            role: newUserRole,
                            department: newUserDepartment || null,
                          })
                        }
                        disabled={createUserMutation.isPending}
                      >
                        Create
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="rounded-lg border">
                <div className="grid grid-cols-12 gap-2 border-b bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                  <div className="col-span-4">User</div>
                  <div className="col-span-3">Email</div>
                  <div className="col-span-2">Role</div>
                  <div className="col-span-2">Department</div>
                  <div className="col-span-1">Active</div>
                </div>
                <div className="divide-y">
                  {adminUsers.map((u) => (
                    <div key={u.id} className="grid grid-cols-12 gap-2 px-3 py-3 items-center">
                      <div className="col-span-4">
                        <div className="text-sm font-medium">{compact(u.fullName) || "(no name)"}</div>
                        <div className="text-xs text-muted-foreground">{u.id}</div>
                      </div>
                      <div className="col-span-3 text-sm truncate">{compact(u.email) || "—"}</div>
                      <div className="col-span-2">
                        <Select
                          value={String(u.role ?? "support_staff")}
                          onValueChange={(v) => updateUserMutation.mutate({ id: u.id, role: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {USER_ROLES.map((r) => (
                              <SelectItem key={r} value={r}>
                                {r}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2">
                        <Select
                          value={String(u.department ?? "")}
                          onValueChange={(v) => updateUserMutation.mutate({ id: u.id, department: v || null })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="None" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">None</SelectItem>
                            {DEPARTMENTS.map((d) => (
                              <SelectItem key={d} value={d}>
                                {d}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-1">
                        <Select
                          value={String(Boolean(u.isActive))}
                          onValueChange={(v) => updateUserMutation.mutate({ id: u.id, isActive: v === "true" })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="true">Yes</SelectItem>
                            <SelectItem value="false">No</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="forms">
          <Card>
            <CardHeader>
              <CardTitle>Form Editor</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-lg border p-4 bg-muted/20">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={formsCategoryId} onValueChange={(v) => {
                    setFormsCategoryId(v);
                    setFormsSubcategoryId("");
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c: any) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Subcategory</Label>
                  <Select value={formsSubcategoryId} onValueChange={(v) => setFormsSubcategoryId(v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select subcategory" />
                    </SelectTrigger>
                    <SelectContent>
                      {formsSubcategories.map((s: any) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {!formsSubcategoryId ? (
                <div className="text-sm text-muted-foreground">Select a category + subcategory to edit its form.</div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-end justify-between gap-3">
                    <div className="space-y-1">
                      <div className="text-sm font-medium">Fields</div>
                      <div className="text-xs text-muted-foreground">Toggle required/hidden, add/remove fields. Changes apply immediately.</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select value={addFieldId} onValueChange={(v) => setAddFieldId(v)}>
                        <SelectTrigger className="w-[260px]">
                          <SelectValue placeholder="Add field from library" />
                        </SelectTrigger>
                        <SelectContent>
                          {sortedFields.map((f) => (
                            <SelectItem key={f.id} value={f.id}>
                              {f.id} — {f.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="secondary"
                        disabled={!addFieldId}
                        onClick={() => {
                          const lib = sortedFields.find((f) => f.id === addFieldId);
                          if (!lib) return;
                          const nextFields = [...draftFields];
                          const exists = nextFields.some((x) => String(x?.id ?? '').trim() === lib.id);
                          if (exists) {
                            toast({ title: "Already added", description: "This field is already in the form." });
                            return;
                          }
                          nextFields.push({
                            id: lib.id,
                            label: lib.label,
                            type: lib.fieldType,
                            fieldType: lib.fieldType,
                            description: lib.description ?? "",
                            options: normalizeOptions(lib.options),
                            required: Boolean(lib.isRequired),
                            isRequired: Boolean(lib.isRequired),
                            hidden: Boolean(lib.isHidden),
                            isHidden: Boolean(lib.isHidden),
                          });
                          setDraftFields(nextFields);

                          const raw = (selectedSubcategory as any)?.formFields ?? (selectedSubcategory as any)?.form_fields;
                          const nextForm = withEmbeddedFields(raw, nextFields);
                          updateSubcategoryFormMutation.mutate({ categoryId: formsCategoryId, subcategoryId: formsSubcategoryId, formFields: nextForm });
                        }}
                      >
                        Add
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-lg border divide-y">
                    {draftFields.map((f, idx) => {
                      const id = String(f?.id ?? "").trim();
                      const label = String(f?.label ?? id).trim();
                      const type = String(f?.fieldType ?? f?.type ?? "Text").trim();
                      const isRequired = Boolean(f?.isRequired ?? f?.required ?? false);
                      const isHidden = Boolean(f?.isHidden ?? f?.hidden ?? false);
                      return (
                        <div key={`${id}-${idx}`} className="flex items-center justify-between gap-3 p-3">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium">{label}</div>
                            <div className="truncate text-xs text-muted-foreground">{id} • {type}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Select
                              value={String(isRequired)}
                              onValueChange={(v) => {
                                const next = [...draftFields];
                                next[idx] = { ...next[idx], required: v === "true", isRequired: v === "true" };
                                setDraftFields(next);
                                const raw = (selectedSubcategory as any)?.formFields ?? (selectedSubcategory as any)?.form_fields;
                                updateSubcategoryFormMutation.mutate({ categoryId: formsCategoryId, subcategoryId: formsSubcategoryId, formFields: withEmbeddedFields(raw, next) });
                              }}
                            >
                              <SelectTrigger className="w-[120px]">
                                <SelectValue placeholder="Required" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="true">Required</SelectItem>
                                <SelectItem value="false">Optional</SelectItem>
                              </SelectContent>
                            </Select>
                            <Select
                              value={String(isHidden)}
                              onValueChange={(v) => {
                                const next = [...draftFields];
                                next[idx] = { ...next[idx], hidden: v === "true", isHidden: v === "true" };
                                setDraftFields(next);
                                const raw = (selectedSubcategory as any)?.formFields ?? (selectedSubcategory as any)?.form_fields;
                                updateSubcategoryFormMutation.mutate({ categoryId: formsCategoryId, subcategoryId: formsSubcategoryId, formFields: withEmbeddedFields(raw, next) });
                              }}
                            >
                              <SelectTrigger className="w-[110px]">
                                <SelectValue placeholder="Hidden" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="false">Visible</SelectItem>
                                <SelectItem value="true">Hidden</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              variant="destructive"
                              onClick={() => {
                                const next = draftFields.filter((_, i) => i !== idx);
                                setDraftFields(next);
                                const raw = (selectedSubcategory as any)?.formFields ?? (selectedSubcategory as any)?.form_fields;
                                updateSubcategoryFormMutation.mutate({ categoryId: formsCategoryId, subcategoryId: formsSubcategoryId, formFields: withEmbeddedFields(raw, next) });
                              }}
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="rounded-lg border p-4 space-y-2">
                    <div className="text-sm font-medium">Manual Form JSON</div>
                    <Textarea value={rawFormJson} onChange={(e) => setRawFormJson(e.target.value)} className="min-h-[180px] font-mono text-xs" />
                    <div className="flex justify-end">
                      <Button
                        variant="secondary"
                        onClick={() => {
                          try {
                            const parsed = JSON.parse(rawFormJson);
                            updateSubcategoryFormMutation.mutate({ categoryId: formsCategoryId, subcategoryId: formsSubcategoryId, formFields: parsed });
                          } catch (e: any) {
                            toast({ title: "Invalid JSON", description: String(e?.message || e), variant: "destructive" });
                          }
                        }}
                      >
                        Apply JSON
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fields">
          <Card>
            <CardHeader>
              <CardTitle>Form Fields</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {(fieldsError as any) && (
                <div className="text-sm text-destructive">Failed to load fields (requires admin/manager role).</div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 rounded-lg border p-4 bg-muted/20">
                <div className="space-y-2">
                  <Label>New Field ID</Label>
                  <Input value={newFieldId} onChange={(e) => setNewFieldId(e.target.value)} placeholder="e.g. GLB-999" />
                </div>
                <div className="space-y-2">
                  <Label>Label</Label>
                  <Input value={newFieldLabel} onChange={(e) => setNewFieldLabel(e.target.value)} placeholder="e.g. Completed By" />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={newFieldType} onValueChange={(v) => setNewFieldType(v as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {FIELD_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-3 flex justify-end">
                  <Button
                    onClick={() =>
                      createFieldMutation.mutate({
                        id: newFieldId.trim(),
                        label: newFieldLabel.trim(),
                        fieldType: newFieldType,
                        options: newFieldType === "Dropdown" ? [] : null,
                        isRequired: false,
                        isHidden: false,
                        orderIndex: 0,
                        category: "Global",
                        subCategory: "Global",
                        uniqueId: newFieldId.trim(),
                        description: "",
                      } as any)
                    }
                    disabled={!newFieldId.trim() || !newFieldLabel.trim() || createFieldMutation.isPending}
                  >
                    Add Field
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Edit fields to change labels, options, required/hidden flags, and ordering.</div>
              </div>

              <div className="space-y-3">
                {isLoadingFields ? (
                  <div className="text-sm text-muted-foreground">Loading…</div>
                ) : (
                  sortedFields.map((f) => (
                    <FieldRow
                      key={f.id}
                      field={f}
                      onSave={(patch) => upsertFieldMutation.mutate({ id: f.id, ...patch } as any)}
                      onDelete={() => deleteFieldMutation.mutate(f.id)}
                      disabled={upsertFieldMutation.isPending || deleteFieldMutation.isPending}
                    />
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="groups">
          <Card>
            <CardHeader>
              <CardTitle>Section Groups</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {(groupsError as any) && (
                <div className="text-sm text-destructive">Failed to load groups (requires admin/manager role).</div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-lg border p-4 bg-muted/20">
                <div className="space-y-2">
                  <Label>New Group Name</Label>
                  <Input value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} placeholder="e.g. Global Ticket Information" />
                </div>
                <div className="flex items-end justify-end">
                  <Button
                    onClick={() =>
                      createGroupMutation.mutate({
                        name: newGroupName.trim(),
                        fieldIds: [],
                        orderIndex: 0,
                      } as any)
                    }
                    disabled={!newGroupName.trim() || createGroupMutation.isPending}
                  >
                    Add Group
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                {isLoadingGroups ? (
                  <div className="text-sm text-muted-foreground">Loading…</div>
                ) : (
                  fieldGroups
                    .slice()
                    .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0) || a.name.localeCompare(b.name))
                    .map((g) => (
                      <GroupRow
                        key={g.id}
                        group={g}
                        allFieldIds={sortedFields.map((x) => x.id)}
                        onSave={(patch) => upsertGroupMutation.mutate({ id: g.id, ...patch } as any)}
                        onDelete={() => deleteGroupMutation.mutate(g.id)}
                        disabled={upsertGroupMutation.isPending || deleteGroupMutation.isPending}
                      />
                    ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="automation">
          <Card>
            <CardHeader>
              <CardTitle>Auto-routing & Assignment Rules</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {(rulesError as any) && (
                <div className="text-sm text-destructive">Failed to load rules (requires admin/manager role).</div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-lg border p-4 bg-muted/20">
                <div className="space-y-2">
                  <Label>New Rule Name</Label>
                  <Input
                    value={newRuleName}
                    onChange={(e) => setNewRuleName(e.target.value)}
                    placeholder="e.g. Booking issues → Operations"
                  />
                </div>
                <div className="flex items-end justify-end">
                  <Button
                    onClick={() =>
                      createRuleMutation.mutate({
                        name: newRuleName.trim(),
                        isActive: true,
                      } as any)
                    }
                    disabled={!newRuleName.trim() || createRuleMutation.isPending}
                  >
                    Add Rule
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                {isLoadingRules ? (
                  <div className="text-sm text-muted-foreground">Loading…</div>
                ) : (
                  assignmentRules
                    .slice()
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((r) => (
                      <AssignmentRuleRowEditor
                        key={r.id}
                        rule={r}
                        categories={categories}
                        users={users}
                        onSave={(patch) => upsertRuleMutation.mutate({ id: r.id, ...patch } as any)}
                        onDelete={() => deleteRuleMutation.mutate(r.id)}
                        disabled={upsertRuleMutation.isPending || deleteRuleMutation.isPending}
                      />
                    ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AssignmentRuleRowEditor({
  rule,
  categories,
  users,
  onSave,
  onDelete,
  disabled,
}: {
  rule: AssignmentRuleRow;
  categories: any[];
  users: any[];
  onSave: (patch: Partial<AssignmentRuleRow>) => void;
  onDelete: () => void;
  disabled: boolean;
}) {
  const [name, setName] = useState(rule.name);
  const [categoryId, setCategoryId] = useState(rule.categoryId ?? "");
  const [subcategoryId, setSubcategoryId] = useState(rule.subcategoryId ?? "");
  const [department, setDepartment] = useState(rule.department ?? "");
  const [priority, setPriority] = useState(rule.priority ?? "");
  const [assignToUserId, setAssignToUserId] = useState(rule.assignToUserId ?? "");
  const [isActive, setIsActive] = useState(rule.isActive !== false);

  const userLabel = (u: any) => {
    const first = String(u?.firstName ?? "").trim();
    const last = String(u?.lastName ?? "").trim();
    return `${first} ${last}`.trim() || String(u?.email ?? "").trim() || String(u?.id ?? "").trim();
  };

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border p-3 bg-card/60">
      <div className="min-w-0">
        <div className="text-sm font-medium truncate">{rule.name}</div>
        <div className="text-xs text-muted-foreground truncate">
          {rule.department || "(no dept)"} · {rule.priority || "(no priority)"} · {rule.assignToUserId ? "assigned" : "unassigned"}
        </div>
      </div>

      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">Edit</Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Rule</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Category (optional)</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any</SelectItem>
                  {categories
                    .filter((c) => String(c?.name ?? "").toLowerCase() !== "global")
                    .map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Subcategory ID (optional)</Label>
              <Input
                value={subcategoryId}
                onChange={(e) => setSubcategoryId(e.target.value)}
                placeholder="Paste subcategory id"
              />
            </div>

            <div className="space-y-2">
              <Label>Department</Label>
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger><SelectValue placeholder="No change" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No change</SelectItem>
                  {["operations", "facilities", "training", "sales", "client_success", "marketing", "finance", "management"].map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger><SelectValue placeholder="No change" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No change</SelectItem>
                  {["low", "medium", "high", "critical"].map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Assign To (user)</Label>
              <Select value={assignToUserId} onValueChange={setAssignToUserId}>
                <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Unassigned</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>{userLabel(u)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Active</Label>
              <Select value={isActive ? "yes" : "no"} onValueChange={(v) => setIsActive(v === "yes")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() =>
                onSave({
                  name: name.trim(),
                  categoryId: categoryId || null,
                  subcategoryId: subcategoryId || null,
                  department: department || null,
                  priority: priority || null,
                  assignToUserId: assignToUserId || null,
                  isActive,
                })
              }
              disabled={disabled}
            >
              Save
            </Button>
            <Button variant="destructive" onClick={onDelete} disabled={disabled}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FieldRow({
  field,
  onSave,
  onDelete,
  disabled,
}: {
  field: FormFieldRow;
  onSave: (patch: Partial<FormFieldRow>) => void;
  onDelete: () => void;
  disabled: boolean;
}) {
  const options = normalizeOptions(field.options);
  const [label, setLabel] = useState(field.label);
  const [fieldType, setFieldType] = useState(field.fieldType);
  const [orderIndex, setOrderIndex] = useState(String(field.orderIndex ?? 0));
  const [isRequired, setIsRequired] = useState(Boolean(field.isRequired));
  const [isHidden, setIsHidden] = useState(Boolean(field.isHidden));
  const [optionsText, setOptionsText] = useState(options.join("\n"));

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border p-3 bg-card/60">
      <div className="min-w-0">
        <div className="text-sm font-medium truncate">{field.id} — {field.label}</div>
        <div className="text-xs text-muted-foreground">{field.fieldType} · order {field.orderIndex ?? 0}</div>
      </div>

      <div className="flex items-center gap-2">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">Edit</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Field: {field.id}</DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Label</Label>
                <Input value={label} onChange={(e) => setLabel(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={fieldType} onValueChange={setFieldType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {FIELD_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Order Index</Label>
                <Input type="number" value={orderIndex} onChange={(e) => setOrderIndex(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>Required</Label>
                <Select value={isRequired ? "yes" : "no"} onValueChange={(v) => setIsRequired(v === "yes")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Hidden</Label>
                <Select value={isHidden ? "yes" : "no"} onValueChange={(v) => setIsHidden(v === "yes")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {fieldType === "Dropdown" && (
                <div className="space-y-2 md:col-span-2">
                  <Label>Options (one per line)</Label>
                  <Textarea value={optionsText} onChange={(e) => setOptionsText(e.target.value)} rows={6} />
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                onClick={() =>
                  onSave({
                    label: label.trim(),
                    fieldType,
                    orderIndex: Number(orderIndex) || 0,
                    isRequired,
                    isHidden,
                    options: fieldType === "Dropdown" ? optionsText.split("\n").map((x) => x.trim()).filter(Boolean) : null,
                  })
                }
                disabled={disabled}
              >
                Save
              </Button>
              <Button variant="destructive" onClick={onDelete} disabled={disabled}>Delete</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

function GroupRow({
  group,
  allFieldIds,
  onSave,
  onDelete,
  disabled,
}: {
  group: FieldGroupRow;
  allFieldIds: string[];
  onSave: (patch: Partial<FieldGroupRow>) => void;
  onDelete: () => void;
  disabled: boolean;
}) {
  const currentIds = normalizeOptions(group.fieldIds);
  const [name, setName] = useState(group.name);
  const [orderIndex, setOrderIndex] = useState(String(group.orderIndex ?? 0));
  const [fieldIdsText, setFieldIdsText] = useState(currentIds.join("\n"));

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border p-3 bg-card/60">
      <div className="min-w-0">
        <div className="text-sm font-medium truncate">{group.name}</div>
        <div className="text-xs text-muted-foreground">{currentIds.length} fields · order {group.orderIndex ?? 0}</div>
      </div>

      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">Edit</Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Group</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Order Index</Label>
              <Input type="number" value={orderIndex} onChange={(e) => setOrderIndex(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Field IDs (one per line)</Label>
              <Textarea value={fieldIdsText} onChange={(e) => setFieldIdsText(e.target.value)} rows={10} />
              <div className="text-xs text-muted-foreground">Tip: paste IDs like GLB-001, GLB-002, …</div>
            </div>
            <div className="text-xs text-muted-foreground">
              Available field IDs: {allFieldIds.slice(0, 12).join(", ")}{allFieldIds.length > 12 ? " …" : ""}
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() =>
                onSave({
                  name: name.trim(),
                  orderIndex: Number(orderIndex) || 0,
                  fieldIds: fieldIdsText
                    .split("\n")
                    .map((x) => x.trim())
                    .filter(Boolean),
                })
              }
              disabled={disabled}
            >
              Save
            </Button>
            <Button variant="destructive" onClick={onDelete} disabled={disabled}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
