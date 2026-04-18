import React from 'react';
import { cn } from '../../lib/utils/utils';

const Spinner = ({ className, ...props }) => (
    <div
        className={cn(
            'animate-spin rounded-full border-t-2 border-b-2 border-blue-500',
            className
        )}
        {...props}
    />
);

export { Spinner };
