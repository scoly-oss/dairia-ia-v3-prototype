import React from 'react';
import { Card, CardProps, styled } from '@mui/material';

export interface DSCardProps extends CardProps {
    noHover?: boolean;
    glass?: boolean;
}

const StyledCard = styled(Card, {
    shouldForwardProp: (prop) => prop !== 'noHover' && prop !== 'glass',
})<{ noHover?: boolean; glass?: boolean }>(({ theme, noHover }) => ({
    borderRadius: 24,
    transition: 'all 0.3s ease-in-out',
    position: 'relative',
    overflow: 'hidden',
    background: '#ffffff',
    border: `1px solid ${theme.custom.border}`,
    boxShadow: theme.custom.shadows.md,

    ...(!noHover && {
        '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: `0 12px 24px -4px rgba(0, 0, 0, 0.1), 0 0 0 1px ${theme.palette.primary.main}`,
        },
    }),
}));

export const DSCard: React.FC<DSCardProps> = ({ children, ...props }) => {
    return <StyledCard {...props}>{children}</StyledCard>;
};
