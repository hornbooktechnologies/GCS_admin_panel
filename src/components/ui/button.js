import React from 'react';
import { cn } from '../../lib/utils/utils';

const normalizeThemeButtonClasses = (classes = '') => {
    if (typeof classes !== 'string') return classes;

    return classes
        .replace(
            /bg-gradient-to-r from-\[#3a5f9e\] via-\[#5283c5\] to-\[#6fa8dc\]/g,
            'bg-primary hover:bg-primary-hover'
        )
        .replace(/\bbg-blue-600\b/g, 'bg-primary')
        .replace(/\bhover:bg-blue-700\b/g, 'hover:bg-primary-hover')
        .replace(/\bfocus-visible:ring-blue-500\b/g, 'focus-visible:ring-primary');
};

const Button = React.forwardRef(
    ({ className, variant = 'default', size = 'default', ...props }, ref) => {
        const variants = {
            default: 'bg-primary text-white hover:bg-primary-hover',
            outline: 'border border-gray-300 bg-transparent hover:bg-gray-100',
            ghost: 'hover:bg-gray-100 hover:text-gray-900',
        };

        const sizes = {
            default: 'h-10 px-4 py-2',
            sm: 'h-9 px-3',
            lg: 'h-11 px-8',
        };

        return (
            <button
                className={cn(
                    'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50',
                    variants[variant],
                    sizes[size],
                    normalizeThemeButtonClasses(className)
                )}
                ref={ref}
                {...props}
            />
        );
    }
);
Button.displayName = 'Button';

export { Button };
