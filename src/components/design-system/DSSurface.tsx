import React from 'react';
import { Box, BoxProps, styled } from '@mui/material';

export interface DSSurfaceProps extends BoxProps {
    variant?: 'default' | 'glass' | 'plain';
}

const StyledSurface = styled(Box, {
    shouldForwardProp: (prop) => prop !== 'variant',
})<{ variant?: 'default' | 'glass' | 'plain' }>(({ theme, variant = 'default' }) => {
    const styles = {
        default: {
            background: '#ffffff',
            border: 'none',
        },
        glass: {
            background: 'rgba(255, 255, 255, 0.95)',
            border: `1px solid ${theme.custom.border}`,
        },
        plain: {
            background: theme.palette.background.paper,
            border: `1px solid ${theme.custom.border}`,
        },
    };

    return {
        position: 'relative',
        ...styles[variant],
    };
});

export const DSSurface: React.FC<DSSurfaceProps> = ({ children, variant = 'default', ...props }) => {
    return <StyledSurface variant={variant} {...props}>{children}</StyledSurface>;
};
