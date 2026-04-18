import React from 'react';
import { cn } from '../../lib/utils/utils';

const Image = React.forwardRef(({ className, alt = '', ...props }, ref) => {
    return (
        <img
            ref={ref}
            alt={alt}
            className={cn('', className)}
            {...props}
        />
    );
});

Image.displayName = 'Image';

export default Image;
