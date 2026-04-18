import React from 'react';
import { cn } from '../../lib/utils/utils';

const Skeleton = ({ className, ...props }) => {
    return (
        <div
            className={cn('animate-pulse rounded-md bg-slate-200/60', className)}
            {...props}
        />
    );
};

export { Skeleton };
