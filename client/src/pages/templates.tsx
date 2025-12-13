import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { LayoutTemplate } from "lucide-react";

import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

type Category = {
  id: string;
  name: string;
  description?: string | null;
};

type Subcategory = {
  id: string;
  name: string;
  description?: string | null;
};

function isTemplateCategory(category: Category) {
  const name = category.name?.toLowerCase() ?? "";
  const description = category.description?.toLowerCase() ?? "";

  // Primary signal: seeded description.
  if (description.includes("templates")) return true;

  // Fallback: the two top-level template buckets.
  return (
    name === "class & instruction".toLowerCase() ||
    name === "facilities & equipment".toLowerCase()
  );
}

export default function TemplatesPage() {
  const categoriesQuery = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/categories");
      return (await res.json()) as Category[];
    },
    staleTime: 0,
    refetchOnMount: "always",
  });

  const templateCategories = useMemo(() => {
    const categories = categoriesQuery.data ?? [];
    return categories.filter(isTemplateCategory);
  }, [categoriesQuery.data]);

  const templateCategoryIds = useMemo(
    () => templateCategories.map((c) => c.id),
    [templateCategories]
  );

  const subcategoriesQuery = useQuery<Record<string, Subcategory[]>>({
    queryKey: ["/api/templates/subcategories", templateCategoryIds],
    enabled: templateCategoryIds.length > 0,
    queryFn: async () => {
      const entries = await Promise.all(
        templateCategories.map(async (category) => {
          const res = await apiRequest(
            "GET",
            `/api/categories/${category.id}/subcategories`
          );
          const subcats = (await res.json()) as Subcategory[];
          return [category.id, subcats] as const;
        })
      );

      return Object.fromEntries(entries);
    },
    staleTime: 0,
    refetchOnMount: "always",
  });

  const isLoading = categoriesQuery.isLoading || subcategoriesQuery.isLoading;

  const templates = useMemo(() => {
    const result: Array<{ category: Category; subcategory: Subcategory }> = [];
    for (const category of templateCategories) {
      const subcats = subcategoriesQuery.data?.[category.id] ?? [];
      for (const sc of subcats) result.push({ category, subcategory: sc });
    }

    return result.sort((a, b) => {
      const c = a.category.name.localeCompare(b.category.name, undefined, { sensitivity: "base" });
      if (c !== 0) return c;
      return a.subcategory.name.localeCompare(b.subcategory.name, undefined, { sensitivity: "base" });
    });
  }, [templateCategories, subcategoriesQuery.data]);

  if (categoriesQuery.isError) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold">Templates</h1>
        <p className="mt-2 text-muted-foreground">
          Failed to load templates. Please refresh and try again.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
          <LayoutTemplate className="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold">Templates</h1>
          <p className="text-sm text-muted-foreground">
            Pick a template name, then create a ticket.
          </p>
        </div>
      </div>

      {isLoading && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-4 w-72" />
              <Skeleton className="h-4 w-64" />
              <Skeleton className="h-4 w-56" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-4 w-72" />
              <Skeleton className="h-4 w-64" />
              <Skeleton className="h-4 w-56" />
            </CardContent>
          </Card>
        </div>
      )}

      {!isLoading && templateCategories.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>No templates found</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Templates are stored as categories/subcategories in the database.
            </p>
            <p className="text-sm text-muted-foreground">
              If you just ran the seeder, make sure youre connected to the same
              server instance and refresh this page.
            </p>
          </CardContent>
        </Card>
      )}

      {!isLoading && templateCategories.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {templates.map(({ category, subcategory }) => (
            <Card key={subcategory.id}>
              <CardHeader className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="text-base">{subcategory.name}</CardTitle>
                  <Badge variant="secondary" className="shrink-0">
                    {category.name}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {subcategory.description ? (
                  <p className="text-sm text-muted-foreground">
                    {subcategory.description}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">Template</p>
                )}

                <Button asChild className="w-full">
                  <Link
                    href={`/tickets/new?categoryId=${encodeURIComponent(category.id)}&subcategoryId=${encodeURIComponent(subcategory.id)}`}
                  >
                    Use Template
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
