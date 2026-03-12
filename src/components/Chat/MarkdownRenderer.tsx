import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Typography, Link, Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';

interface MarkdownRendererProps {
    content: string;
    isUser?: boolean;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, isUser = false }) => {
    const theme = useTheme();

    return (
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
                // Headers
                h1: ({ children }) => (
                    <Typography variant="h4" component="h1" sx={{ mt: 2, mb: 1, fontWeight: 700, color: isUser ? 'inherit' : 'text.primary' }}>
                        {children}
                    </Typography>
                ),
                h2: ({ children }) => (
                    <Typography variant="h5" component="h2" sx={{ mt: 2, mb: 1, fontWeight: 600, color: isUser ? 'inherit' : 'text.primary' }}>
                        {children}
                    </Typography>
                ),
                h3: ({ children }) => (
                    <Typography variant="h6" component="h3" sx={{ mt: 1.5, mb: 0.5, fontWeight: 600, color: isUser ? 'inherit' : 'text.primary' }}>
                        {children}
                    </Typography>
                ),
                h4: ({ children }) => (
                    <Typography variant="subtitle1" component="h4" sx={{ mt: 1.5, mb: 0.5, fontWeight: 600, color: isUser ? 'inherit' : 'text.primary' }}>
                        {children}
                    </Typography>
                ),

                // Paragraphs
                p: ({ children }) => (
                    <Typography variant="body1" sx={{ mb: 1.5, lineHeight: 1.7, color: isUser ? 'inherit' : 'text.primary' }}>
                        {children}
                    </Typography>
                ),

                // Lists
                ul: ({ children }) => (
                    <Box component="ul" sx={{ pl: 2, mb: 1.5, color: isUser ? 'inherit' : 'text.primary' }}>
                        {children}
                    </Box>
                ),
                ol: ({ children }) => (
                    <Box component="ol" sx={{ pl: 2, mb: 1.5, color: isUser ? 'inherit' : 'text.primary' }}>
                        {children}
                    </Box>
                ),
                li: ({ children }) => (
                    <Typography component="li" variant="body1" sx={{ mb: 0.5, lineHeight: 1.6 }}>
                        {children}
                    </Typography>
                ),

                // Links
                a: ({ href, children }) => (
                    <Link href={href} target="_blank" rel="noopener noreferrer" sx={{ color: isUser ? 'inherit' : 'primary.main', textDecoration: 'underline' }}>
                        {children}
                    </Link>
                ),

                // Blockquotes (used for alerts/warnings)
                blockquote: ({ children }) => {
                    // Check if content starts with warning emoji or specific keywords to style differently
                    return (
                        <Box
                            sx={{
                                borderLeft: `4px solid ${theme.palette.primary.main}`,
                                pl: 2,
                                py: 0.5,
                                my: 2,
                                bgcolor: theme.palette.mode === 'dark' ? 'rgba(30, 52, 90, 0.2)' : 'rgba(30, 52, 90, 0.05)',
                                borderRadius: '0 4px 4px 0',
                            }}
                        >
                            {children}
                        </Box>
                    );
                },

                // Pre (for code blocks)
                pre: ({ children }) => (
                    <Box
                        component="pre"
                        sx={{
                            overflowX: 'auto',
                            bgcolor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.05)',
                            p: 2,
                            borderRadius: 2,
                            my: 2,
                            border: `1px solid ${theme.palette.divider}`,
                            '& code': {
                                bgcolor: 'transparent',
                                p: 0,
                                borderRadius: 0,
                            }
                        }}
                    >
                        {children}
                    </Box>
                ),

                // Code
                code: ({ inline, className, children, ...props }: { inline?: boolean; className?: string; children?: React.ReactNode }) => {
                    const match = /language-(\w+)/.exec(className || '');
                    return !inline && match ? (
                        <Box
                            component="code"
                            className={className}
                            {...props}
                            sx={{
                                fontFamily: 'monospace',
                                fontSize: '0.9em',
                                display: 'block', // Ensure block display
                            }}
                        >
                            {children}
                        </Box>
                    ) : (
                        <Box
                            component="code"
                            className={className}
                            {...props}
                            sx={{
                                fontFamily: 'monospace',
                                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                                px: 0.5,
                                py: 0.25,
                                borderRadius: 0.5,
                                fontSize: '0.9em',
                            }}
                        >
                            {children}
                        </Box>
                    );
                },

                // Tables
                table: ({ children }) => (
                    <Box
                        component="table"
                        sx={{
                            width: '100%',
                            borderCollapse: 'collapse',
                            my: 2,
                            fontSize: '0.9rem',
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: 1,
                            overflow: 'hidden',
                        }}
                    >
                        {children}
                    </Box>
                ),
                thead: ({ children }) => (
                    <Box
                        component="thead"
                        sx={{
                            bgcolor: theme.palette.mode === 'dark'
                                ? 'rgba(30, 52, 90, 0.4)'
                                : 'rgba(30, 52, 90, 0.1)',
                        }}
                    >
                        {children}
                    </Box>
                ),
                tbody: ({ children }) => (
                    <Box component="tbody">{children}</Box>
                ),
                tr: ({ children }) => (
                    <Box
                        component="tr"
                        sx={{
                            '&:nth-of-type(even)': {
                                bgcolor: theme.palette.mode === 'dark'
                                    ? 'rgba(255, 255, 255, 0.02)'
                                    : 'rgba(0, 0, 0, 0.02)',
                            },
                        }}
                    >
                        {children}
                    </Box>
                ),
                th: ({ children }) => (
                    <Box
                        component="th"
                        sx={{
                            p: 1,
                            textAlign: 'left',
                            fontWeight: 600,
                            borderBottom: `2px solid ${theme.palette.divider}`,
                            color: isUser ? 'inherit' : 'text.primary',
                        }}
                    >
                        {children}
                    </Box>
                ),
                td: ({ children }) => (
                    <Box
                        component="td"
                        sx={{
                            p: 1,
                            borderBottom: `1px solid ${theme.palette.divider}`,
                            color: isUser ? 'inherit' : 'text.primary',
                        }}
                    >
                        {children}
                    </Box>
                ),
            }}
        >
            {content}
        </ReactMarkdown>
    );
};
