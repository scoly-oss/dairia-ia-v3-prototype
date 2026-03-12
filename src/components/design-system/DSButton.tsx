import React from 'react';
import { Button, ButtonProps, CircularProgress, styled, alpha } from '@mui/material';

export type DSButtonVariant = 'primary' | 'secondary' | 'ghost';

export interface DSButtonProps extends Omit<ButtonProps, 'variant'> {
    variant?: DSButtonVariant;
    isLoading?: boolean;
}

const StyledButton = styled(Button, {
    shouldForwardProp: (prop) => prop !== 'dsVariant' && prop !== 'isLoading',
})<{ dsVariant?: DSButtonVariant; isLoading?: boolean }>(({ theme, dsVariant }) => {
    const styles = {
        root: {
            borderRadius: 8,
            textTransform: 'none' as const,
            fontWeight: 600,
            padding: '10px 24px',
            transition: 'all 0.2s ease-in-out',
            position: 'relative' as const,
        },
        primary: {
            background: theme.custom.gradients.primary,
            color: '#ffffff',
            boxShadow: theme.custom.shadows.primary,
            '&:hover': {
                background: theme.custom.gradients.primaryHover,
                boxShadow: '0 6px 20px rgba(232, 132, 44, 0.3)',
                transform: 'translateY(-1px)',
            },
            '&.Mui-disabled': {
                background: 'rgba(0, 0, 0, 0.12)',
                color: 'rgba(0, 0, 0, 0.26)',
                boxShadow: 'none',
            },
        },
        secondary: {
            background: '#ffffff',
            color: theme.palette.text.primary,
            border: `1px solid ${theme.custom.border}`,
            '&:hover': {
                background: alpha(theme.palette.primary.main, 0.05),
                borderColor: theme.palette.primary.main,
                transform: 'translateY(-1px)',
            },
        },
        ghost: {
            background: 'transparent',
            color: theme.palette.text.secondary,
            '&:hover': {
                background: 'rgba(0, 0, 0, 0.04)',
                color: theme.palette.text.primary,
            },
        },
    };

    return {
        ...styles.root,
        ...(dsVariant === 'primary' && styles.primary),
        ...(dsVariant === 'secondary' && styles.secondary),
        ...(dsVariant === 'ghost' && styles.ghost),
    };
});

export const DSButton: React.FC<DSButtonProps> = ({
    children,
    variant = 'primary',
    isLoading,
    disabled,
    ...props
}) => {
    return (
        <StyledButton
            dsVariant={variant}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading ? (
                <CircularProgress
                    size={24}
                    color="inherit"
                    sx={{ position: 'absolute', color: variant === 'primary' ? 'white' : undefined }}
                />
            ) : children}
        </StyledButton>
    );
};
