import React, { useState, useEffect } from 'react';
import { FieldDefinition, TicketFormData, FieldType } from '@shared/ticket-schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Upload } from 'lucide-react';
import { format } from 'date-fns';

interface DynamicFormProps {
  fields: FieldDefinition[];
  onSubmit: (formData: TicketFormData) => void;
  initialData?: TicketFormData;
  isLoading?: boolean;
  title?: string;
  description?: string;
}

export const DynamicForm: React.FC<DynamicFormProps> = ({
  fields,
  onSubmit,
  initialData = {},
  isLoading = false,
  title = "Create Ticket",
  description = "Fill in the details below to create a new ticket"
}) => {
  const [formData, setFormData] = useState<TicketFormData>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const visibleFields = fields.filter(field => !field.isHidden);

  const validateField = (field: FieldDefinition, value: any): string | null => {
    if (field.isRequired && (!value || value === '')) {
      return `${field.label} is required`;
    }

    const toNumber = (v: unknown): number | null => {
      if (v === null || v === undefined || v === '') return null;
      const n = typeof v === 'number' ? v : Number.parseFloat(String(v));
      return Number.isFinite(n) ? n : null;
    };

    if (field.validation) {
      for (const rule of field.validation) {
        switch (rule.type) {
          case 'minLength':
            if (value && value.length < rule.value) {
              return rule.message;
            }
            break;
          case 'maxLength':
            if (value && value.length > rule.value) {
              return rule.message;
            }
            break;
          case 'pattern':
            if (value && !new RegExp(rule.value as string).test(value)) {
              return rule.message;
            }
            break;
          case 'min':
            {
              const valueNum = toNumber(value);
              const ruleNum = toNumber(rule.value);
              if (valueNum !== null && ruleNum !== null && valueNum < ruleNum) {
              return rule.message;
            }
            }
            break;
          case 'max':
            {
              const valueNum = toNumber(value);
              const ruleNum = toNumber(rule.value);
              if (valueNum !== null && ruleNum !== null && valueNum > ruleNum) {
              return rule.message;
            }
            }
            break;
        }
      }
    }

    return null;
  };

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));

    // Clear error for this field
    if (errors[fieldId]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    for (const field of visibleFields) {
      const error = validateField(field, formData[field.id]);
      if (error) {
        newErrors[field.id] = error;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const renderField = (field: FieldDefinition) => {
    const value = formData[field.id] || '';
    const error = errors[field.id];

    const fieldProps = {
      id: field.id,
      value,
      onChange: (newValue: any) => handleFieldChange(field.id, newValue),
      error: error,
      required: field.isRequired,
      placeholder: field.description,
      'data-testid': `field-${field.id}`
    };

    switch (field.fieldType) {
      case 'Text':
      case 'Email':
      case 'Phone':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id} className="text-sm font-medium">
              {field.label}
              {field.isRequired && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              {...fieldProps}
              type={field.fieldType === 'Email' ? 'email' : field.fieldType === 'Phone' ? 'tel' : 'text'}
              className={error ? 'border-red-500' : ''}
            />
            {field.description && (
              <p className="text-xs text-gray-600">{field.description}</p>
            )}
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        );

      case 'Long Text':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id} className="text-sm font-medium">
              {field.label}
              {field.isRequired && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Textarea
              {...fieldProps}
              rows={4}
              className={error ? 'border-red-500' : ''}
            />
            {field.description && (
              <p className="text-xs text-gray-600">{field.description}</p>
            )}
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        );

      case 'Number':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id} className="text-sm font-medium">
              {field.label}
              {field.isRequired && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              {...fieldProps}
              type="number"
              className={error ? 'border-red-500' : ''}
            />
            {field.description && (
              <p className="text-xs text-gray-600">{field.description}</p>
            )}
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        );

      case 'Dropdown':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id} className="text-sm font-medium">
              {field.label}
              {field.isRequired && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Select
              value={value}
              onValueChange={(newValue) => handleFieldChange(field.id, newValue)}
            >
              <SelectTrigger className={error ? 'border-red-500' : ''}>
                <SelectValue placeholder={`Select ${field.label}`} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option, index) => (
                  <SelectItem key={index} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {field.description && (
              <p className="text-xs text-gray-600">{field.description}</p>
            )}
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        );

      case 'Checkbox':
        return (
          <div key={field.id} className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id={field.id}
                checked={value === true || value === 'true'}
                onCheckedChange={(checked) => handleFieldChange(field.id, checked)}
              />
              <Label htmlFor={field.id} className="text-sm font-medium">
                {field.label}
                {field.isRequired && <span className="text-red-500 ml-1">*</span>}
              </Label>
            </div>
            {field.description && (
              <p className="text-xs text-gray-600 ml-6">{field.description}</p>
            )}
            {error && <p className="text-xs text-red-500 ml-6">{error}</p>}
          </div>
        );

      case 'DateTime':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id} className="text-sm font-medium">
              {field.label}
              {field.isRequired && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={`w-full justify-start text-left font-normal ${error ? 'border-red-500' : ''}`}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {value ? format(new Date(value), 'PPP p') : 'Select date and time'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={value ? new Date(value) : undefined}
                  onSelect={(date) => {
                    if (date) {
                      handleFieldChange(field.id, date.toISOString());
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {field.description && (
              <p className="text-xs text-gray-600">{field.description}</p>
            )}
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        );

      case 'File Upload':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id} className="text-sm font-medium">
              {field.label}
              {field.isRequired && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-2">
                <Label htmlFor={field.id} className="cursor-pointer">
                  <span className="text-sm text-blue-600 hover:text-blue-500">Upload files</span>
                  <Input
                    id={field.id}
                    type="file"
                    multiple
                    accept={field.options?.join(',')}
                    className="hidden"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      handleFieldChange(field.id, files);
                    }}
                  />
                </Label>
              </div>
              <p className="text-xs text-gray-500 mt-1">{field.options?.join(', ')}</p>
            </div>
            {field.description && (
              <p className="text-xs text-gray-600">{field.description}</p>
            )}
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        );

      case 'Auto-generated':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id} className="text-sm font-medium text-gray-500">
              {field.label}
            </Label>
            <Input
              value="Auto-generated"
              disabled
              className="bg-gray-50 text-gray-500"
            />
            {field.description && (
              <p className="text-xs text-gray-600">{field.description}</p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {visibleFields.map(renderField)}
          </div>
          
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <Button type="button" variant="outline" onClick={() => setFormData({})}>
              Reset
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Submitting...' : 'Submit Ticket'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};