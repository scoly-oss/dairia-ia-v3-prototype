import React from 'react';
import { Box } from '@mui/material';
import { StructuredAIResponse } from '../../../services/chatService';
import { SynthesisCard } from './SynthesisCard';
import { SectionCard } from './SectionCard';
import { SourcesAccordion } from './SourcesAccordion';
import { FollowUpPills } from './FollowUpPills';
import { MarkdownRenderer } from '../MarkdownRenderer';

interface StructuredResponseRendererProps {
  content: string;
  structuredResponse?: StructuredAIResponse;
  onFollowUp?: (text: string) => void;
}

export const StructuredResponseRenderer: React.FC<StructuredResponseRendererProps> = ({
  content,
  structuredResponse,
  onFollowUp,
}) => {
  // If no structured response, fallback to markdown
  if (!structuredResponse || (!structuredResponse.faits && !structuredResponse.analyse)) {
    return <MarkdownRenderer content={content} isUser={false} />;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Synthesis / Facts */}
      {structuredResponse.faits && (
        <SynthesisCard content={structuredResponse.faits} />
      )}

      {/* Main Analysis */}
      {structuredResponse.analyse && (
        <SectionCard title="Analyse juridique" content={structuredResponse.analyse} />
      )}

      {/* Practical Advice */}
      {structuredResponse.conseils && structuredResponse.conseils.length > 0 && (
        <SectionCard
          title="Conseils pratiques"
          items={structuredResponse.conseils}
        />
      )}

      {/* Legal Sources */}
      {structuredResponse.sources && structuredResponse.sources.length > 0 && (
        <SourcesAccordion sources={structuredResponse.sources} />
      )}

      {/* Follow-up Questions */}
      {structuredResponse.demandes && structuredResponse.demandes.length > 0 && onFollowUp && (
        <FollowUpPills questions={structuredResponse.demandes} onSelect={onFollowUp} />
      )}
    </Box>
  );
};
