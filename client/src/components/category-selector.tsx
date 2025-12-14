import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FieldDefinition, FieldType } from '@shared/ticket-schema';
import { FIELD_DEFINITIONS } from '@shared/field-definitions';
import { getCategoryIcon } from '@/lib/category-icons';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

interface CategorySelectorProps {
  onCategorySelect: (
    categoryId: string,
    subCategoryId: string,
    fields: FieldDefinition[],
    meta?: { categoryName?: string; subCategoryName?: string }
  ) => void;
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
  const lastAutoSelectedRef = useRef<string>('');

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
    // Categories can change when admins/import scripts seed new templates.
    // Override global infinite caching so users can see updates without a hard refresh.
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const globalCategoryId = useMemo(() => {
    const global = categories.find(c => (c.name ?? '').toLowerCase() === 'global');
    return global?.id ?? null;
  }, [categories]);

  const { data: globalSubCategories = [] } = useQuery<ApiSubcategory[]>({
    queryKey: globalCategoryId ? ['/api/categories', globalCategoryId, 'subcategories'] : ['_global_subcategories_disabled'],
    enabled: !!globalCategoryId,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const { data: subCategories = [], isLoading: subCategoriesLoading } = useQuery<ApiSubcategory[]>({
    queryKey: category ? ['/api/categories', category, 'subcategories'] : ['_subcategories_disabled'],
    enabled: !!category,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const selectedCategoryData = useMemo(() => categories.find(c => c.id === category) ?? null, [categories, category]);

  const getCategoryColor = (cat: ApiCategory | null | undefined): string => {
    return String((cat as any)?.color_code ?? cat?.color ?? '').trim() || '#6b7280';
  };

  const toRgba = (color: string, alpha: number): string => {
    const c = (color || '').trim();
    // Supports #RRGGBB / #RGB
    const hex = c.startsWith('#') ? c.slice(1) : c;
    if (/^[0-9a-fA-F]{3}$/.test(hex)) {
      const r = parseInt(hex[0] + hex[0], 16);
      const g = parseInt(hex[1] + hex[1], 16);
      const b = parseInt(hex[2] + hex[2], 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    if (/^[0-9a-fA-F]{6}$/.test(hex)) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    // Fall back to opaque CSS color (best-effort)
    return c;
  };

  const availableSubCategories = useMemo(() => {
    // Some datasets/joins can yield duplicate-looking values; choose the “best” row per name.
    const bestByName = new Map<string, ApiSubcategory>();
    for (const sc of subCategories) {
      const nameKey = String(sc.name ?? '').trim().toLowerCase();
      if (!nameKey) continue;
      const current = bestByName.get(nameKey);
      if (!current) {
        bestByName.set(nameKey, sc);
        continue;
      }

      const currentFieldsLen = extractEmbeddedFields(current).length;
      const candidateFieldsLen = extractEmbeddedFields(sc).length;
      // Prefer the entry with richer form schema; otherwise keep the first.
      if (candidateFieldsLen > currentFieldsLen) bestByName.set(nameKey, sc);
    }

    return Array.from(bestByName.values()).sort((a, b) =>
      String(a.name ?? '').localeCompare(String(b.name ?? ''), undefined, { sensitivity: 'base' })
    );
  }, [subCategories]);

  useEffect(() => {
    if (!subCategory) return;
    // When deep-linking from Templates, allow the preselected subcategory to
    // remain while the subcategory list is still loading.
    if (subCategoriesLoading) return;

    if (subCategory && !availableSubCategories.some(sc => sc.id === subCategory)) {
      setSubCategory('');
    }
  }, [subCategory, availableSubCategories, subCategoriesLoading]);

  // Ensure we have a stable, id-deduped list — some backends may return logically
  // duplicate rows with different metadata; prefer the first seen per id.
  const uniqueSubCategories = useMemo(() => {
    const map = new Map<string, ApiSubcategory>();
    for (const sc of availableSubCategories) {
      if (!map.has(sc.id)) map.set(sc.id, sc);
    }
    return Array.from(map.values());
  }, [availableSubCategories]);

  useEffect(() => {
    if (!subCategory) return;
    if (subCategoriesLoading) return;

    if (subCategory && !uniqueSubCategories.some(sc => sc.id === subCategory)) {
      setSubCategory('');
    }
  }, [subCategory, uniqueSubCategories, subCategoriesLoading]);

  // Keep internal state in sync when parent provides preselected values.
  useEffect(() => {
    if (selectedCategory !== undefined && selectedCategory !== category) {
      setCategory(selectedCategory || '');
      setSubCategory('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory]);

  useEffect(() => {
    if (selectedSubCategory !== undefined && selectedSubCategory !== subCategory) {
      setSubCategory(selectedSubCategory || '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSubCategory]);

  const selectedSubCategoryData = useMemo(
    () => uniqueSubCategories.find(sc => sc.id === subCategory) ?? null,
    [uniqueSubCategories, subCategory]
  );

  // Auto-run selection when both category + subcategory are provided.
  // This enables "Use Template" deep-links to prefill category/subcategory and open the form.
  useEffect(() => {
    const desiredCategory = (selectedCategory || '').trim();
    const desiredSubCategory = (selectedSubCategory || '').trim();

    if (!desiredCategory || !desiredSubCategory) return;
    if (category !== desiredCategory) return;
    if (subCategory !== desiredSubCategory) return;

    const token = `${desiredCategory}::${desiredSubCategory}`;
    if (lastAutoSelectedRef.current === token) return;

    const categoryExists = categories.some((c) => c.id === desiredCategory);
    const subCategoryExists = uniqueSubCategories.some((sc) => sc.id === desiredSubCategory);
    if (!categoryExists || !subCategoryExists || !selectedCategoryData) return;

    lastAutoSelectedRef.current = token;
    handleSubCategoryChange(desiredSubCategory);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, selectedSubCategory, category, subCategory, categories, uniqueSubCategories, selectedCategoryData]);

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
    if (t === 'Auto-generated' || t === 'DateTime' || t === 'Date' || t === 'Dropdown' || t === 'Text' || t === 'Email' || t === 'Phone' || t === 'Long Text' || t === 'Checkbox' || t === 'File Upload' || t === 'Number') {
      return t;
    }

    const lower = t.toLowerCase();
    if (lower === 'dropdown' || lower === 'select' || lower === 'radio') return 'Dropdown';
    if (lower === 'textarea' || lower === 'longtext' || lower === 'long text') return 'Long Text';
    if (lower === 'date') return 'Date';
    if (lower === 'datetime' || lower === 'time') return 'DateTime';
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

    const sc = uniqueSubCategories.find(s => s.id === subCategoryId);
    if (!sc || !selectedCategoryData) return;

    const globalSc = globalSubCategories.find(s => (s.name ?? '').toLowerCase() === 'global') ?? null;
    const embeddedGlobalFields = extractEmbeddedFields(globalSc).map(f => toFieldDefinition(f, 'Global', 'Global'));
    const staticGlobalFields = FIELD_DEFINITIONS.filter((f) => (f.category ?? '').toLowerCase() === 'global');
    const globalFields = embeddedGlobalFields.length > 0 ? embeddedGlobalFields : staticGlobalFields;

    const subFields = extractEmbeddedFields(sc).map(f => toFieldDefinition(f, selectedCategoryData.name, sc.name));

    const all = [...globalFields, ...subFields];
    const deduped = Array.from(new Map(all.map(f => [f.id, f])).values());
    const visibleFields = deduped.filter(f => !f.isHidden);

    onCategorySelect(category, subCategoryId, visibleFields, {
      categoryName: selectedCategoryData.name,
      subCategoryName: sc.name,
    });
  };

  return (
    <div className="w-full mx-auto mb-6">
      <div className="space-y-8">
        {/* Step 1: Category Selection */}
        <AnimatePresence mode="wait">
          {!category && (
            <motion.div
              key="category-selection"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <motion.div
                  className="inline-flex items-center justify-center w-12 h-12 rounded-2xl font-bold text-base bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg mb-3"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  1
                </motion.div>
                <h2 className="text-2xl font-bold text-foreground">Select Ticket Category</h2>
                <p className="text-sm text-muted-foreground mt-2">Choose the main category for your support ticket</p>
              </div>

              <motion.div 
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {categories
                  .filter(cat => (cat.name ?? '').toLowerCase() !== 'global')
                  .map((cat, idx) => {
                    const color = getCategoryColor(cat);
                    const Icon = getCategoryIcon(cat.icon);

                    return (
                      <motion.div
                        key={cat.id}
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.3, delay: idx * 0.08 }}
                        whileHover={{ y: -6, scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => handleCategoryChange(cat.id)}
                        className="group relative cursor-pointer transition-all"
                      >
                        {/* Glassmorphic background */}
                        <div className="absolute inset-0 rounded-lg bg-white/40 backdrop-blur-md border border-white/60 group-hover:bg-white/50 transition-all duration-300" />

                        {/* Thick left colored border */}
                        <div
                          className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-lg transition-all duration-300"
                          style={{ backgroundColor: color }}
                        />

                        {/* Content container */}
                        <div className="relative p-4 flex items-center gap-3 h-24">
                          {/* Icon with animation */}
                          <motion.div
                            className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-lg transition-all"
                            style={{
                              background: `linear-gradient(135deg, ${toRgba(color, 0.2)} 0%, ${toRgba(color, 0.08)} 100%)`,
                            }}
                            whileHover={{ scale: 1.1, rotate: 8 }}
                          >
                            <Icon className="w-6 h-6" style={{ color }} />
                          </motion.div>

                          {/* Text content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-sm text-foreground">{cat.name}</h3>
                            </div>
                            {cat.description && (
                              <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{cat.description}</p>
                            )}
                          </div>

                          {/* Analytics on hover */}
                          <motion.div
                            className="flex-shrink-0 flex flex-col items-end gap-1"
                            initial={{ opacity: 0, x: 10 }}
                            whileHover={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <div className="text-xs font-semibold text-foreground">12 tickets</div>
                            <div className="text-xs text-muted-foreground">Avg: 2.4h</div>
                          </motion.div>
                        </div>
                      </motion.div>
                    );
                  })}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step 2: Subcategory Selection */}
        <AnimatePresence mode="wait">
          {category && (
            <motion.div
              key="subcategories"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="text-center mb-8 relative">
                <motion.div
                  className={`inline-flex items-center justify-center w-12 h-12 rounded-2xl font-bold text-base ${subCategory ? 'bg-gradient-to-br from-green-500 to-green-600' : 'bg-gradient-to-br from-blue-500 to-indigo-600'} text-white shadow-lg mb-3`}
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {subCategory ? <CheckCircle2 className="w-7 h-7" /> : '2'}
                </motion.div>
                <h2 className="text-2xl font-bold text-foreground">Select Subcategory</h2>
                <p className="text-sm text-muted-foreground mt-2">Choose the specific issue type within <span className="font-semibold text-foreground">{selectedCategoryData?.name}</span></p>
                <motion.button
                  onClick={() => {
                    setCategory('');
                    setSubCategory('');
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="absolute right-0 top-0 px-4 py-2 rounded-lg text-sm font-medium bg-muted hover:bg-muted/80 border border-border text-foreground transition-all shadow-sm backdrop-blur-sm"
                >
                  ← Change Category
                </motion.button>
              </div>

              {subCategoriesLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="h-28 rounded-2xl bg-muted animate-pulse"
                    />
                  ))}
                </div>
              ) : (
                <motion.div
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {uniqueSubCategories.map((subCat, idx) => {
                    const isSubSelected = subCat.id === subCategory;
                    const fieldCount = extractEmbeddedFields(subCat).length;
                    const catColor = getCategoryColor(selectedCategoryData);

                    return (
                      <motion.div
                        key={subCat.id}
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.3, delay: idx * 0.08 }}
                        whileHover={{ y: -6, scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => handleSubCategoryChange(subCat.id)}
                        className="group relative cursor-pointer transition-all"
                      >
                        {/* Glassmorphic background - highlighted on selection */}
                        <div className={`absolute inset-0 rounded-lg transition-all duration-300 ${
                          isSubSelected 
                            ? 'bg-white/60 border border-white/80' 
                            : 'bg-white/40 border border-white/60 group-hover:bg-white/50'
                        }`} />

                        {/* Thick left colored border */}
                        <div
                          className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-lg transition-all duration-300 ${isSubSelected ? 'w-2' : ''}`}
                          style={{ backgroundColor: catColor }}
                        />

                        {/* Content container */}
                        <div className="relative p-4 flex items-center gap-3 h-24">
                          {/* Icon with animation */}
                          <motion.div
                            className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-lg transition-all"
                            style={{
                              background: `linear-gradient(135deg, ${toRgba(catColor, 0.2)} 0%, ${toRgba(catColor, 0.08)} 100%)`,
                            }}
                            animate={{ rotate: isSubSelected ? 360 : 0 }}
                            transition={{ duration: 0.6 }}
                            whileHover={{ scale: 1.1, rotate: 8 }}
                          >
                            {getCategoryIcon(selectedCategoryData?.icon) && 
                              React.createElement(getCategoryIcon(selectedCategoryData?.icon), {
                                className: 'w-6 h-6',
                                style: { color: catColor },
                              })
                            }
                          </motion.div>

                          {/* Text content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-sm text-foreground">{subCat.name}</h3>
                              {isSubSelected && (
                                <motion.div
                                  initial={{ scale: 0, rotate: -180 }}
                                  animate={{ scale: 1, rotate: 0 }}
                                  transition={{ type: 'spring', stiffness: 200 }}
                                >
                                  <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                                </motion.div>
                              )}
                            </div>
                            {subCat.description && (
                              <p className="text-xs text-muted-foreground line-clamp-1 mt-1">{subCat.description}</p>
                            )}
                          </div>

                          {/* Analytics on hover */}
                          <motion.div
                            className="flex-shrink-0 flex flex-col items-end gap-1"
                            initial={{ opacity: 0, x: 10 }}
                            whileHover={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <div className="text-xs font-semibold text-foreground">{fieldCount} fields</div>
                            <div className="text-xs text-muted-foreground">Avg: 8 min</div>
                          </motion.div>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}

              {/* Field Preview */}
              {selectedSubCategoryData && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.15 }}
                  className="mt-8 p-6 rounded-2xl bg-muted/50 backdrop-blur-md border border-border transition-all"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <h4 className="text-base font-bold text-foreground">Available Fields</h4>
                    <Badge variant="secondary" className="text-xs">
                      {(() => {
                        const globalSc = globalSubCategories.find(s => (s.name ?? '').toLowerCase() === 'global') ?? null;
                        const globalFields = extractEmbeddedFields(globalSc).map(f => toFieldDefinition(f, 'Global', 'Global'));
                        const subFields = extractEmbeddedFields(selectedSubCategoryData).map(f => toFieldDefinition(f, selectedCategoryData?.name ?? '', selectedSubCategoryData.name));
                        const all = [...globalFields, ...subFields];
                        const deduped = Array.from(new Map(all.map(f => [f.id, f])).values());
                        return deduped.filter(f => !f.isHidden).length;
                      })()} fields
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(() => {
                      const globalSc = globalSubCategories.find(s => (s.name ?? '').toLowerCase() === 'global') ?? null;
                      const globalFields = extractEmbeddedFields(globalSc).map(f => toFieldDefinition(f, 'Global', 'Global'));
                      const subFields = extractEmbeddedFields(selectedSubCategoryData).map(f => toFieldDefinition(f, selectedCategoryData?.name ?? '', selectedSubCategoryData.name));
                      const all = [...globalFields, ...subFields];
                      const deduped = Array.from(new Map(all.map(f => [f.id, f])).values());
                      return deduped.filter(f => !f.isHidden);
                    })().map((field, idx) => (
                      <motion.div
                        key={field.id}
                        initial={{ opacity: 0, scale: 0.8, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: idx * 0.04 }}
                      >
                        <Badge 
                          variant={field.isRequired ? "default" : "outline"}
                          className="text-xs font-semibold px-2.5 py-1"
                        >
                          {field.label}
                          {field.isRequired && <span className="ml-1.5 font-bold">*</span>}
                        </Badge>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};