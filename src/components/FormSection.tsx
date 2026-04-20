import React, { ReactNode, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface FormSectionProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

export const FormSection = forwardRef<HTMLDivElement, FormSectionProps>(
  ({ title, description, icon, children, className }, ref) => {
    return (
      <div ref={ref} className={cn("form-section animate-fade-in", className)}>
        <div className="form-section-title">
          {icon && <span className="text-primary">{icon}</span>}
          {title}
        </div>
        {description && <p className="form-section-description">{description}</p>}
        <div className="space-y-4">{children}</div>
      </div>
    );
  }
);
FormSection.displayName = "FormSection";

interface FormFieldProps {
  label: React.ReactNode;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

export const FormField = forwardRef<HTMLDivElement, FormFieldProps>(
  ({ label, required, children, className }, ref) => {
    return (
      <div ref={ref} className={cn("space-y-2", className)}>
        <label className="text-sm font-medium text-foreground">
          {label}
          {required && <span className="ml-1 text-destructive">*</span>}
        </label>
        {children}
      </div>
    );
  }
);
FormField.displayName = "FormField";

interface FormRowProps {
  children: ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}

export const FormRow = forwardRef<HTMLDivElement, FormRowProps>(
  ({ children, columns = 2, className }, ref) => {
    const gridCols = {
      2: "grid-cols-1 md:grid-cols-2",
      3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
      4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
    };

    return (
      <div ref={ref} className={cn("grid gap-4", gridCols[columns], className)}>
        {children}
      </div>
    );
  }
);
FormRow.displayName = "FormRow";
