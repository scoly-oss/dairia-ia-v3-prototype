import type {
  ParsedProposal, ProposalHeader, ProposalContact,
  ParsedSection, ParsedSubsection, ContentBlock,
  PhaseInfo, FinancialInfo, TeamMember,
} from './proposalTypes';

const FOOTER_NOISE = [
  /^Page \d+ sur \d+$/,
  /^Dairia [Aa]vocats?\s*$/,
  /Dairia\s+avocats?\s*[–—-]\s*65\s+rue\s+Jacques/i,
  /^65 rue Jacques Louis/,
  /^3 quai Hoche/,
  /^Contact\s*:\s*Sofiane/,
  /^s\.coly@dairia-avocats/,
  /^\d{4}-\d{2}-\d{2}\s*$/,
  /^69004\s+LYON/,
  /^44200\s+NANTES/,
  /^Piste d'audit$/,
  /^Détails$/,
  /^NOM DU FICHIER/,
  /^ÉTAT\s/,
  /^CODE TEMPOREL/,
  /^Activité$/,
  /^ENVOYÉ$/,
  /^SIGNÉ$/,
  /^TERMINÉ$/,
  /l\.guitton@dairia/,
  /a\.mourer@dairia/,
  /s\.coly@dairia/,
  /^Il est possible que/,
  /^Ce document a été signé/,
  /^Signé par/,
  /Could not get FontBBox/,
  // Audit trail timestamps and metadata (sometimes joined on one line)
  /^\d{4}[-/]\d{2}[-/]\d{2}\s+\d{2}:\d{2}:\d{2}\s+UTC/,
  /\d{4}\/\d{2}\/\d{2}\s+\d{2}:\d{2}:\d{2}\s+UTC/,
  /^L'ÉTAT\s/i,
  /^terminé\s*\./i,
  /l'adresse e-mail principale ou secondaire/i,
  /^(\d{4}-\d{2}-\d{2}\s*){2,}/,
];

const SECTION_NUM = /^(\d+)\.\s+(.+)$/;
const SECTION_ROMAN = /^([IVXLC]{1,5})\.\s+(.+)$/;
const SUBSECTION_LETTER = /^([A-Z])\.\s+(.+)$/;
const PHASE_RE = /Phase\s+(\d+)\s*[—–-]\s*(.+?)(?:\(([^)]+)\))?$/;
const BULLET_RE = /^[●•◦○▪▸►➤→✓✔☐]\s+/;
const EMOJI_HEADER_RE = /^[🔎📸💼🎯💻⚠💡🔧]\s*/;

const INLINE_NOISE = [
  /Dairia\s+avocats?\s*[–—-]\s*65\s+rue\s+Jacques\s+Louis\s+Hénon\s*[–—-]\s*69004\s+LYON/gi,
  /3\s+quai\s+Hoche\s*[–—-]\s*44200\s+NANTES/gi,
];

function cleanLines(text: string): string[] {
  return text.split('\n').map(line => {
    let cleaned = line;
    for (const pattern of INLINE_NOISE) {
      cleaned = cleaned.replace(pattern, '');
    }
    return cleaned;
  }).filter(line => {
    const t = line.trim();
    if (!t) return true;
    return !FOOTER_NOISE.some(p => p.test(t));
  });
}

function extractHeader(lines: string[]): {
  header: ProposalHeader; title: string; subtitle: string; contentStart: number;
} {
  let clientName = '';
  const contacts: ProposalContact[] = [];
  let date = '', location = '', confidential = false;
  let title = '', subtitle = '';
  let contentStart = 0;

  for (let i = 0; i < Math.min(lines.length, 40); i++) {
    const t = lines[i].trim();
    if (!t) continue;

    if (/personnel\s+et\s+confidentiel/i.test(t)) { confidential = true; continue; }

    const dateM = t.match(/^(Lyon|Paris|Nantes),?\s+le\s+(.+?),?$/i);
    if (dateM) { location = dateM[1]; date = dateM[2].replace(/,$/, ''); continue; }

    const contactM = t.match(/^(Madame|Monsieur|Mme|M\.)\s+(.+?),\s+(.+)$/i);
    if (contactM) { contacts.push({ name: contactM[2], title: contactM[3] }); continue; }

    const emailM = t.match(/^([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})$/);
    if (emailM && contacts.length > 0 && !contacts[contacts.length - 1].email) {
      contacts[contacts.length - 1].email = emailM[1]; continue;
    }

    if (/proposition\s+commerciale/i.test(t)) {
      title = t;
      for (let j = i + 1; j < Math.min(lines.length, i + 5); j++) {
        const nt = lines[j].trim();
        if (!nt) continue;
        if (SECTION_NUM.test(nt) || SECTION_ROMAN.test(nt)) break;
        if (!/proposition/i.test(nt) && !/^(madame|monsieur)/i.test(nt) && nt.length > 5) {
          subtitle = nt; break;
        }
      }
      contentStart = i + 1;
      if (subtitle) contentStart++;
      break;
    }

    if (!clientName && /^[A-ZÉÈÊËÀÂÎÏÔÙÛÇ\s&'-]{3,60}$/.test(t) &&
        !/^(LYON|PARIS|NANTES|PROPOSITION)/.test(t)) {
      clientName = t;
    }
  }

  if (!clientName) {
    for (let i = 0; i < Math.min(lines.length, 15); i++) {
      const t = lines[i].trim();
      if (!t || /personnel/i.test(t) || /^(madame|monsieur)/i.test(t)) continue;
      if (t.length >= 3 && t.length <= 80) { clientName = t; break; }
    }
  }

  while (contentStart < lines.length && !lines[contentStart].trim()) contentStart++;

  return {
    header: { clientName, contacts, date, location, confidential },
    title: title || 'Proposition Commerciale',
    subtitle,
    contentStart,
  };
}

function classifySection(title: string): ParsedSection['type'] {
  const l = title.toLowerCase();
  if (/objet|résumé|présentation/i.test(l)) return 'summary';
  if (/contexte|enjeux/i.test(l)) return 'context';
  if (/périmètre|scope|volet|capacité/i.test(l)) return 'scope';
  if (/plan d.action|démarche|méthodologie|accompagnement/i.test(l)) return 'plan';
  if (/planning|calendrier|prévisionnel/i.test(l)) return 'timeline';
  if (/modalités financières|prix|chiffrage|tarif|offre d.abonnement/i.test(l)) return 'financial';
  if (/pourquoi|différenciation|compétence/i.test(l)) return 'why';
  if (/gouvernance|organisation|équipe/i.test(l)) return 'governance';
  if (/lancement|démarrage/i.test(l)) return 'launch';
  return 'generic';
}

function parseContentBlocks(text: string): ContentBlock[] {
  const lines = text.split('\n');
  const blocks: ContentBlock[] = [];
  let bullets: string[] = [];
  let para = '';

  const flushPara = () => { if (para.trim()) { blocks.push({ type: 'paragraph', text: para.trim() }); para = ''; } };
  const flushBullets = () => { if (bullets.length) { blocks.push({ type: 'bullets', items: [...bullets] }); bullets = []; } };

  for (const line of lines) {
    const t = line.trim();
    if (!t) { flushBullets(); flushPara(); continue; }

    if (BULLET_RE.test(t) || /^[-–—]\s+/.test(t) || /^○\s+/.test(t)) {
      flushPara();
      bullets.push(t.replace(BULLET_RE, '').replace(/^[-–—○]\s+/, ''));
    } else if (EMOJI_HEADER_RE.test(t)) {
      flushBullets(); flushPara();
      blocks.push({ type: 'subheading', text: t.replace(EMOJI_HEADER_RE, '') });
    } else if (bullets.length > 0 && !SECTION_NUM.test(t) && !SECTION_ROMAN.test(t) &&
               !SUBSECTION_LETTER.test(t) && !PHASE_RE.test(t) &&
               /^[a-zéèêëàâäîïôöùûüç\d(]/.test(t) && t.length < 150) {
      // Continuation of last bullet item (starts with lowercase)
      bullets[bullets.length - 1] += ' ' + t;
    } else {
      flushBullets();
      para += (para ? ' ' : '') + t;
    }
  }
  flushBullets(); flushPara();
  return blocks;
}

function splitSections(contentLines: string[]): ParsedSection[] {
  const sections: ParsedSection[] = [];
  let num = '', title = '', buf = '';
  let count = 0;

  const flush = () => {
    if (!title) return;
    const subsections = extractSubsections(buf);
    // Only include content before first subsection marker in section.content
    let mainBuf = buf;
    if (subsections.length > 0) {
      const bufLines = buf.split('\n');
      const firstSubLine = bufLines.findIndex(l => SUBSECTION_LETTER.test(l.trim()));
      if (firstSubLine >= 0) mainBuf = bufLines.slice(0, firstSubLine).join('\n');
    }
    sections.push({
      id: `section-${count}`, number: num, title,
      type: classifySection(title),
      content: parseContentBlocks(mainBuf),
      subsections,
    });
    count++;
  };

  for (const line of contentLines) {
    const t = line.trim();
    const numM = t.match(SECTION_NUM);
    const romM = !numM ? t.match(SECTION_ROMAN) : null;
    const match = numM || romM;

    if (match) {
      flush();
      num = match[1]; title = match[2]; buf = '';
    } else {
      buf += t + '\n';
    }
  }
  flush();

  if (sections.length === 0) {
    return splitByKeywordHeaders(contentLines);
  }
  return sections;
}

function splitByKeywordHeaders(lines: string[]): ParsedSection[] {
  const sections: ParsedSection[] = [];
  const keywords = [
    'présentation', 'compétence', 'plan d\'action', 'capacité', 'accompagnement',
    'proposition d\'offre', 'prix proposé', 'pourquoi', 'méthodologie',
    'périmètre', 'objectif', 'contexte', 'modalités', 'option paie',
    'chantier transversal', 'gouvernance', 'sécuriser', 'indemnités',
    'frais professionnels', 'invitations', 'véhicules', 'dsn',
  ];

  let currentTitle = '';
  let buf = '';
  let count = 0;

  const flush = () => {
    if (!currentTitle || !buf.trim()) return;
    sections.push({
      id: `section-${count}`, number: String(count + 1), title: currentTitle,
      type: classifySection(currentTitle),
      content: parseContentBlocks(buf),
      subsections: [],
    });
    count++;
  };

  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim();
    if (!t) { buf += '\n'; continue; }

    const isHeader = t.length < 120 && t.length > 5 &&
      !BULLET_RE.test(t) && !EMOJI_HEADER_RE.test(t) &&
      keywords.some(k => t.toLowerCase().includes(k));

    if (isHeader) {
      flush();
      currentTitle = t;
      buf = '';
    } else {
      buf += t + '\n';
    }
  }
  flush();
  return sections;
}

function extractSubsections(text: string): ParsedSubsection[] {
  const subs: ParsedSubsection[] = [];
  const parts = text.split('\n');
  let letter = '', subTitle = '', buf = '';

  const flush = () => {
    if (subTitle) {
      subs.push({ letter, title: subTitle, content: parseContentBlocks(buf) });
    }
  };

  for (const line of parts) {
    const t = line.trim();
    const m = t.match(SUBSECTION_LETTER);
    if (m) {
      flush();
      letter = m[1]; subTitle = m[2]; buf = '';
    } else if (subTitle) {
      buf += t + '\n';
    }
  }
  flush();
  return subs;
}

function extractPhases(sections: ParsedSection[]): PhaseInfo[] {
  const phases: PhaseInfo[] = [];
  for (const section of sections) {
    const full = section.content.map(b => b.text || (b.items || []).join('\n')).join('\n');
    const lines = full.split('\n');
    let current: PhaseInfo | null = null;
    let zone: 'none' | 'actions' | 'deliverables' = 'none';

    for (const line of lines) {
      const pm = line.match(PHASE_RE);
      if (pm) {
        if (current) phases.push(current);
        current = {
          number: parseInt(pm[1]), name: pm[2].trim(),
          period: pm[3]?.trim() || '', objective: '', actions: [], deliverables: [],
        };
        zone = 'none';
        continue;
      }
      if (!current) continue;

      const t = line.trim();
      if (/^Objectif\s*:/i.test(t)) {
        current.objective = t.replace(/^Objectif\s*:\s*/i, '');
        zone = 'none';
      } else if (/^Actions\s*$/i.test(t)) {
        zone = 'actions';
      } else if (/^Livrables\s*$/i.test(t)) {
        zone = 'deliverables';
      } else if (t.length > 3) {
        const clean = t.replace(BULLET_RE, '').replace(/^[-–—○]\s+/, '');
        if (zone === 'actions' && clean) current.actions.push(clean);
        else if (zone === 'deliverables' && clean) current.deliverables.push(clean);
      }
    }
    if (current) phases.push(current);
  }
  return phases;
}

function extractFinancial(sections: ParsedSection[]): FinancialInfo | undefined {
  const fin = sections.find(s => s.type === 'financial');
  if (!fin) return undefined;

  const full = fin.content.map(b => b.text || (b.items || []).join('\n')).join('\n');
  const amountM = full.match(/([\d\s]+)\s*€\s*(HT|TTC)/);
  const periodM = full.match(/\/\s*(mois|jour|an)/i);
  let model = 'forfait';
  if (/abonnement/i.test(full)) model = 'abonnement';
  if (/tjm|taux\s+journalier/i.test(full)) model = 'tjm';

  const details: string[] = [];
  fin.content.forEach(b => { if (b.items) details.push(...b.items); });

  return {
    model,
    amount: amountM ? amountM[1].trim().replace(/\s+/g, ' ') + ' € ' + amountM[2] : '',
    period: periodM ? periodM[1] : '',
    details,
  };
}

function extractTeam(sections: ParsedSection[]): TeamMember[] {
  const team: TeamMember[] = [];
  const candidates = sections.filter(s =>
    s.type === 'governance' || s.type === 'why' || s.type === 'generic'
  );

  for (const sec of candidates) {
    const full = sec.content.map(b => b.text || (b.items || []).join('\n')).join('\n');
    const re = /([A-ZÉÈÊÀÂÎÏÔÙÛÇ][a-zéèêëàâäîïôöùûüç]+(?:\s+[A-ZÉÈÊÀÂÎÏÔÙÛÇ]+[a-zéèêëàâäîïôöùûüç]*)+)\s*[—–-]\s*(.+?)(?:\s*:\s*(.+?))?(?:\.|$)/gm;
    let m;
    while ((m = re.exec(full)) !== null) {
      team.push({
        name: m[1].trim(),
        role: m[2].trim(),
        description: m[3]?.trim() || '',
      });
    }
  }
  return team;
}

export function parseProposal(rawText: string): ParsedProposal {
  // Strip audit trail (e-signature metadata at end of document)
  const auditIdx = rawText.search(/Piste d['']audit/i);
  const cleanedRaw = auditIdx > 0 ? rawText.slice(0, auditIdx) : rawText;
  const lines = cleanLines(cleanedRaw);
  const { header, title, subtitle, contentStart } = extractHeader(lines);
  const contentLines = lines.slice(contentStart);

  // Extract preamble (text before first numbered section)
  let preamble = '';
  const preambleLines: string[] = [];
  for (const line of contentLines) {
    const t = line.trim();
    if (SECTION_NUM.test(t) || SECTION_ROMAN.test(t)) break;
    preambleLines.push(t);
  }
  preamble = preambleLines.join('\n').trim();
  if (preamble.length < 20) preamble = '';

  const sections = splitSections(contentLines);
  const phases = extractPhases(sections);
  const financial = extractFinancial(sections);
  const team = extractTeam(sections);

  return {
    header, title, subtitle, preamble,
    sections, phases, financial, team,
    rawText,
  };
}
