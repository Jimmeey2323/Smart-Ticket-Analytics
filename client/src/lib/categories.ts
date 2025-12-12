import { CATEGORIES, SUB_CATEGORIES, getSubCategoryById as sharedGetSubById } from '../../../shared/ticket-categories';
import { LOCATIONS, DEPARTMENTS } from '../../../shared/ticket-schema';

export type FormField = {
  id: string;
  label: string;
  fieldType: string;
  options?: string[];
  placeholder?: string;
  isRequired?: boolean;
  description?: string;
};

// Lightweight client-side exports adapted from shared data
export const categories = CATEGORIES.map((c) => ({
  ...c,
  // provide a sensible default department used in the UI
  defaultDepartment: 'Operations',
}));

export const locations = LOCATIONS;
export const departments = DEPARTMENTS;

export function getSubcategoryById(categoryId: string, subcategoryId: string) {
  const sub = SUB_CATEGORIES.find((s) => s.id === subcategoryId && s.categoryId === categoryId);
  if (!sub) return null;
  // Map fields (IDs) into minimal FormField objects for the client to render placeholders
  const formFields: FormField[] = (sub.fields || []).map((fid) => ({
    id: fid,
    label: fid,
    fieldType: 'text',
    isRequired: false,
  }));
  return {
    id: sub.id,
    name: sub.name,
    description: sub.description,
    formFields,
  };
}

export function getAllFormFieldsForSubcategory(subcategoryId: string): FormField[] {
  const sub = SUB_CATEGORIES.find((s) => s.id === subcategoryId);
  if (!sub) return [];
  return (sub.fields || []).map((fid) => ({
    id: fid,
    label: fid,
    fieldType: 'text',
  }));
}

export { FormField as typeFormField };

export default {};
