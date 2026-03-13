export interface ProposalContact {
  name: string;
  title: string;
  email?: string;
}

export interface ProposalHeader {
  clientName: string;
  contacts: ProposalContact[];
  date: string;
  location: string;
  confidential: boolean;
}

export interface ContentBlock {
  type: 'paragraph' | 'bullets' | 'subheading';
  text?: string;
  items?: string[];
}

export interface ParsedSubsection {
  letter: string;
  title: string;
  content: ContentBlock[];
}

export interface ParsedSection {
  id: string;
  number: string;
  title: string;
  type: 'summary' | 'context' | 'scope' | 'plan' | 'timeline' | 'financial' | 'why' | 'governance' | 'launch' | 'generic';
  content: ContentBlock[];
  subsections: ParsedSubsection[];
}

export interface PhaseInfo {
  number: number;
  name: string;
  period: string;
  objective: string;
  actions: string[];
  deliverables: string[];
}

export interface FinancialInfo {
  model: string;
  amount: string;
  period: string;
  details: string[];
}

export interface TeamMember {
  name: string;
  role: string;
  description: string;
}

export interface ParsedProposal {
  header: ProposalHeader;
  title: string;
  subtitle: string;
  preamble: string;
  sections: ParsedSection[];
  phases: PhaseInfo[];
  financial?: FinancialInfo;
  team: TeamMember[];
  rawText: string;
}
