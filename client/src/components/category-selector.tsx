import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { FieldDefinition, FieldType } from '@shared/ticket-schema';

interface CategorySelectorProps {
  onCategorySelect: (categoryId: string, subCategoryId: string, fields: FieldDefinition[]) => void;
  selectedCategory?: string;
  selectedSubCategory?: string;
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  onCategorySelect,
  selectedCategory,
  selectedSubCategory
}) => {
  const [category, setCategory] = useState<string>(selectedCategory || '');
  const [subCategory, setSubCategory] = useState<string>(selectedSubCategory || '');

  type ApiCategory = {
    id: string;
    name: string;
    description?: string | null;
    icon?: string | null;
    color?: string | null;
    color_code?: string | null;
  };

  type ApiSubcategory = {
    id: string;
    categoryId?: string;
    category_id?: string;
    name: string;
    description?: string | null;
    formFields?: any;
    form_fields?: any;
  };

  const { data: categories = [], isLoading: categoriesLoading } = useQuery<ApiCategory[]>({
    queryKey: ['/api/categories'],
  });

  const globalCategoryId = useMemo(() => {
    const global = categories.find(c => (c.name ?? '').toLowerCase() === 'global');
    return global?.id ?? null;
  }, [categories]);

  const { data: globalSubCategories = [] } = useQuery<ApiSubcategory[]>({
    queryKey: globalCategoryId ? ['/api/categories', globalCategoryId, 'subcategories'] : ['_global_subcategories_disabled'],
    enabled: !!globalCategoryId,
  });

  const { data: subCategories = [], isLoading: subCategoriesLoading } = useQuery<ApiSubcategory[]>({
    queryKey: category ? ['/api/categories', category, 'subcategories'] : ['_subcategories_disabled'],
    enabled: !!category,
  });

  const selectedCategoryData = useMemo(() => categories.find(c => c.id === category) ?? null, [categories, category]);
  const selectedSubCategoryData = useMemo(() => subCategories.find(sc => sc.id === subCategory) ?? null, [subCategories, subCategory]);

  function extractEmbeddedFields(sc: ApiSubcategory | null | undefined): any[] {
    if (!sc) return [];
    const raw = (sc as any).formFields ?? (sc as any).form_fields;
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(raw.fields)) return raw.fields;
    return [];
  }

  function mapEmbeddedTypeToFieldType(raw: string): FieldType {
    const t = (raw || '').trim();
    // Already a supported FieldType
    if (t === 'Auto-generated' || t === 'DateTime' || t === 'Dropdown' || t === 'Text' || t === 'Email' || t === 'Phone' || t === 'Long Text' || t === 'Checkbox' || t === 'File Upload' || t === 'Number') {
      return t;
    }

    const lower = t.toLowerCase();
    if (lower === 'dropdown' || lower === 'select' || lower === 'radio') return 'Dropdown';
    if (lower === 'textarea' || lower === 'longtext' || lower === 'long text') return 'Long Text';
    if (lower === 'datetime' || lower === 'date' || lower === 'time') return 'DateTime';
    if (lower === 'email') return 'Email';
    if (lower === 'tel' || lower === 'phone') return 'Phone';
    if (lower === 'number') return 'Number';
    if (lower === 'checkbox') return 'Checkbox';
    if (lower === 'file' || lower === 'file upload') return 'File Upload';
    return 'Text';
  }

  function toFieldDefinition(embedded: any, categoryName: string, subCategoryName: string): FieldDefinition {
    const id = String(embedded?.id ?? embedded?.uniqueId ?? '').trim();
    const label = String(embedded?.label ?? '').trim() || id;
    const fieldType = mapEmbeddedTypeToFieldType(String(embedded?.fieldType ?? embedded?.type ?? 'Text'));
    const options = Array.isArray(embedded?.options) ? embedded.options.map((o: any) => String(o)) : undefined;
    return {
      id,
      label,
      fieldType,
      options,
      subCategory: subCategoryName,
      category: categoryName,
      uniqueId: id,
      description: String(embedded?.description ?? ''),
      isRequired: Boolean(embedded?.isRequired ?? embedded?.required ?? false),
      isHidden: Boolean(embedded?.isHidden ?? embedded?.hidden ?? false),
      validation: Array.isArray(embedded?.validation) ? embedded.validation : undefined,
    };
  }

  const handleCategoryChange = (categoryId: string) => {
    setCategory(categoryId);
    setSubCategory(''); // Reset subcategory when category changes
  };

  const handleSubCategoryChange = (subCategoryId: string) => {
    setSubCategory(subCategoryId);

    const sc = subCategories.find(s => s.id === subCategoryId);
    if (!sc || !selectedCategoryData) return;

    const globalSc = globalSubCategories.find(s => (s.name ?? '').toLowerCase() === 'global') ?? null;
    const globalFields = extractEmbeddedFields(globalSc).map(f => toFieldDefinition(f, 'Global', 'Global'));

    const subFields = extractEmbeddedFields(sc).map(f => toFieldDefinition(f, selectedCategoryData.name, sc.name));

    const all = [...globalFields, ...subFields];
    const deduped = Array.from(new Map(all.map(f => [f.id, f])).values());
    const visibleFields = deduped.filter(f => !f.isHidden);

    onCategorySelect(category, subCategoryId, visibleFields);
  };

  const availableSubCategories = subCategories;

  return (
    <Card className="w-full max-w-4xl mx-auto mb-6">
      <CardHeader>
        <CardTitle>Select Ticket Category</CardTitle>
        <CardDescription>
          Choose the main category and specific subcategory for your ticket. This will determine which fields are available.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Category Selection */}
          <div className="space-y-3">
            <Label htmlFor="category-select" className="text-sm font-medium">
              Main Category
            </Label>
            <Select value={category} onValueChange={handleCategoryChange}>
              <SelectTrigger id="category-select">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories
                  .filter(cat => (cat.name ?? '').toLowerCase() !== 'global')
                  .map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: (cat as any).color_code ?? cat.color ?? '#6b7280' }}
                      />
                      <span>{cat.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {selectedCategoryData && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: (selectedCategoryData as any).color_code ?? selectedCategoryData.color ?? '#6b7280' }}
                  />
                  <span className="font-medium">{selectedCategoryData.name}</span>
                </div>
                {selectedCategoryData.description && (
                  <p className="text-sm text-gray-600">{selectedCategoryData.description}</p>
                )}
              </div>
            )}
          </div>

          {/* Subcategory Selection */}
          <div className="space-y-3">
            <Label htmlFor="subcategory-select" className="text-sm font-medium">
              Subcategory
            </Label>
            <Select 
              value={subCategory} 
              onValueChange={handleSubCategoryChange}
              disabled={!category || subCategoriesLoading}
            >
              <SelectTrigger id="subcategory-select">
                <SelectValue placeholder="Select a subcategory" />
              </SelectTrigger>
              <SelectContent>
                {availableSubCategories.map((subCat) => (
                  <SelectItem key={subCat.id} value={subCat.id}>
                    {subCat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedSubCategoryData && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{selectedSubCategoryData.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {extractEmbeddedFields(selectedSubCategoryData).length} fields
                  </Badge>
                </div>
                {selectedSubCategoryData.description && (
                  <p className="text-sm text-gray-600">{selectedSubCategoryData.description}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Field Preview */}
        {selectedSubCategoryData && (
          <div className="border-t pt-6">
            <h4 className="text-sm font-medium mb-3">Available Fields Preview</h4>
            <div className="flex flex-wrap gap-2">
              {(() => {
                const globalSc = globalSubCategories.find(s => (s.name ?? '').toLowerCase() === 'global') ?? null;
                const globalFields = extractEmbeddedFields(globalSc).map(f => toFieldDefinition(f, 'Global', 'Global'));
                const subFields = extractEmbeddedFields(selectedSubCategoryData).map(f => toFieldDefinition(f, selectedCategoryData?.name ?? '', selectedSubCategoryData.name));
                const all = [...globalFields, ...subFields];
                const deduped = Array.from(new Map(all.map(f => [f.id, f])).values());
                return deduped.filter(f => !f.isHidden);
              })().map((field) => (
                  <Badge 
                    key={field.id} 
                    variant={field.isRequired ? "default" : "outline"}
                    className="text-xs"
                  >
                    {field.label}
                    {field.isRequired && <span className="ml-1 text-red-400">*</span>}
                  </Badge>
                ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              <span className="font-medium">*</span> Required fields are shown with an asterisk
            </p>
          </div>
        )}

        {/* Quick Category Overview */}
        {!category && (
          <div className="border-t pt-6">
            <h4 className="text-sm font-medium mb-3">Available Categories</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {categories
                .filter(cat => (cat.name ?? '').toLowerCase() !== 'global')
                .map((cat) => (
                <div 
                  key={cat.id}
                  className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleCategoryChange(cat.id)}
                >
                  <div className="flex items-center space-x-2 mb-1">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: (cat as any).color_code ?? cat.color ?? '#6b7280' }}
                    />
                    <span className="font-medium text-sm">{cat.name}</span>
                  </div>
                  <p className="text-xs text-gray-600">{cat.description}</p>
                  <Badge variant="outline" className="text-xs mt-2">
                    {/* count not available without fetching subcats per card */}
                    View subcategories
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};