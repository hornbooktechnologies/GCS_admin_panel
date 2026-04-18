import React from 'react';
import { cn } from '../../lib/utils/utils';

const FieldGroup = ({ className, ...props }) => (
    <div className={cn('space-y-4', className)} {...props} />
);

const FieldSet = ({ className, ...props }) => (
    <fieldset className={cn('space-y-4', className)} {...props} />
);

const Field = ({ className, ...props }) => (
    <div className={cn('flex flex-col items-start space-y-2', className)} {...props} />
);

const FieldLabel = React.forwardRef(({ className, ...props }, ref) => (
    <label
        ref={ref}
        className={cn(
            'block w-full text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-left',
            className
        )}
        {...props}
    />
));
FieldLabel.displayName = 'FieldLabel';

const FieldError = ({ className, children, ...props }) => {
    if (!children) return null;

    return (
        <p
            className={cn('text-sm font-medium text-red-500', className)}
            {...props}
        >
            {children}
        </p>
    );
};

export { FieldGroup, FieldSet, Field, FieldLabel, FieldError };
