import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Box, Typography, IconButton, Chip } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import FlagIcon from '@mui/icons-material/Flag';
import GroupsIcon from '@mui/icons-material/Groups';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import type { ParsedProposal, ParsedSection, ContentBlock, PhaseInfo, TeamMember, FinancialInfo } from '../../lib/proposalTypes';

const C = {
  navy: '#1e2d3d',
  navyLight: '#2a3d50',
  orange: '#e8842c',
  orangeLight: 'rgba(232,132,44,0.08)',
  surface: '#f8f9fb',
  white: '#ffffff',
  border: '#e2e6ec',
  textPrimary: '#1e2d3d',
  textSecondary: '#5a6c7d',
  textMuted: '#8899aa',
};

/* ─── Scroll reveal hook (CSS animation, no IntersectionObserver) ─── */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  return { ref, sx: {
    '@keyframes revealUp': {
      from: { opacity: 0, transform: 'translateY(30px)' },
      to: { opacity: 1, transform: 'translateY(0)' },
    },
    animation: 'revealUp 0.7s cubic-bezier(.22,1,.36,1) both',
  }};
}

/* ─── Hero ─── */
function Hero({ proposal }: { proposal: ParsedProposal }) {
  const { header, title, subtitle } = proposal;
  return (
    <Box sx={{
      background: `linear-gradient(135deg, ${C.navy} 0%, ${C.navyLight} 60%, #354b62 100%)`,
      color: '#fff', py: { xs: 8, md: 12 }, px: 4, position: 'relative', overflow: 'hidden',
    }}>
      {/* Decorative circles */}
      <Box sx={{ position: 'absolute', top: -120, right: -120, width: 400, height: 400,
        borderRadius: '50%', border: '1px solid rgba(255,255,255,0.04)' }} />
      <Box sx={{ position: 'absolute', bottom: -80, left: -80, width: 300, height: 300,
        borderRadius: '50%', border: '1px solid rgba(255,255,255,0.04)' }} />

      <Box sx={{ maxWidth: 900, mx: 'auto', position: 'relative', zIndex: 1 }}>
        <Typography sx={{
          color: C.orange, fontWeight: 700, fontSize: 13, letterSpacing: 2,
          textTransform: 'uppercase', mb: 4,
        }}>
          DAIRIA AVOCATS
        </Typography>

        <Typography sx={{ fontSize: { xs: 14, md: 16 }, fontWeight: 400, opacity: 0.7, mb: 1 }}>
          {title.replace(/PROPOSITION COMMERCIALE/i, 'Proposition Commerciale')}
        </Typography>

        {subtitle && (
          <Typography sx={{ fontSize: { xs: 28, md: 42 }, fontWeight: 700, lineHeight: 1.2, mb: 3 }}>
            {subtitle}
          </Typography>
        )}

        {!subtitle && header.clientName && (
          <Typography sx={{ fontSize: { xs: 28, md: 42 }, fontWeight: 700, lineHeight: 1.2, mb: 3 }}>
            {header.clientName}
          </Typography>
        )}

        <Box sx={{ width: 60, height: 4, bgcolor: C.orange, borderRadius: 2, mb: 4 }} />

        {subtitle && header.clientName && (
          <Typography sx={{ fontSize: 20, fontWeight: 500, opacity: 0.9, mb: 2 }}>
            {header.clientName}
          </Typography>
        )}

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', opacity: 0.7 }}>
          {header.contacts.map((c, i) => (
            <Typography key={i} sx={{ fontSize: 14 }}>
              {c.name}{c.title ? `, ${c.title}` : ''}
            </Typography>
          ))}
          {header.date && (
            <Typography sx={{ fontSize: 14 }}>
              {header.location ? `${header.location}, ` : ''}{header.date}
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
}

/* ─── TOC Sidebar ─── */
function TOC({ sections, activeId }: { sections: ParsedSection[]; activeId: string }) {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  return (
    <Box sx={{
      position: 'fixed', right: 32, top: '50%', transform: 'translateY(-50%)',
      zIndex: 10, display: { xs: 'none', lg: 'block' },
      bgcolor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)',
      borderRadius: 3, border: `1px solid ${C.border}`, p: 2,
      maxHeight: '60vh', overflow: 'auto', width: 220,
      boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
    }}>
      <Typography sx={{ fontSize: 11, fontWeight: 700, color: C.textMuted, letterSpacing: 1,
        textTransform: 'uppercase', mb: 1.5, px: 1.5 }}>
        Sommaire
      </Typography>
      {sections.map(s => (
        <Box
          key={s.id}
          onClick={() => scrollTo(s.id)}
          sx={{
            px: 1.5, py: 0.8, borderRadius: 1.5, cursor: 'pointer',
            borderLeft: activeId === s.id ? `3px solid ${C.orange}` : '3px solid transparent',
            bgcolor: activeId === s.id ? C.orangeLight : 'transparent',
            transition: 'all 0.2s',
            '&:hover': { bgcolor: C.orangeLight },
          }}
        >
          <Typography sx={{
            fontSize: 12, fontWeight: activeId === s.id ? 600 : 400,
            color: activeId === s.id ? C.navy : C.textSecondary,
            lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          }}>
            {s.number}. {s.title}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

/* ─── Content block renderer ─── */
function BlockRenderer({ block }: { block: ContentBlock }) {
  if (block.type === 'subheading') {
    return (
      <Typography component="div" sx={{
        fontSize: 16, fontWeight: 600, color: C.navy, mt: 3, mb: 1,
        display: 'flex', alignItems: 'center', gap: 1,
      }}>
        <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: C.orange, flexShrink: 0 }} />
        {block.text}
      </Typography>
    );
  }
  if (block.type === 'bullets' && block.items) {
    return (
      <Box component="ul" sx={{ pl: 0, listStyle: 'none', my: 2 }}>
        {block.items.map((item, i) => (
          <Box component="li" key={i} sx={{ display: 'flex', gap: 1.5, mb: 1.2, alignItems: 'flex-start' }}>
            <Box sx={{
              width: 8, height: 8, borderRadius: '50%', bgcolor: C.orange, mt: '7px', flexShrink: 0,
              opacity: 0.7,
            }} />
            <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: C.textPrimary }}>{item}</Typography>
          </Box>
        ))}
      </Box>
    );
  }
  return (
    <Typography sx={{ fontSize: 15, lineHeight: 1.8, color: C.textPrimary, mb: 2 }}>
      {block.text}
    </Typography>
  );
}

/* ─── Section renderer ─── */
function SectionCard({ section, index }: { section: ParsedSection; index: number }) {
  const reveal = useReveal();
  const isEven = index % 2 === 0;

  return (
    <Box
      id={section.id}
      ref={reveal.ref}
      sx={{
        ...reveal.sx,
        py: { xs: 5, md: 7 },
        px: { xs: 3, md: 0 },
        bgcolor: isEven ? C.white : C.surface,
      }}
    >
      <Box sx={{ maxWidth: 800, mx: 'auto' }}>
        {/* Section header */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3, mb: 4 }}>
          <Box sx={{
            width: 48, height: 48, borderRadius: 3, bgcolor: C.orangeLight,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Typography sx={{ color: C.orange, fontWeight: 700, fontSize: 20 }}>
              {section.number}
            </Typography>
          </Box>
          <Box>
            <Chip
              label={sectionLabel(section.type)}
              size="small"
              sx={{
                bgcolor: C.orangeLight, color: C.orange, fontWeight: 600,
                fontSize: 11, mb: 1, height: 22,
              }}
            />
            <Typography sx={{ fontSize: { xs: 22, md: 26 }, fontWeight: 700, color: C.navy, lineHeight: 1.3 }}>
              {section.title}
            </Typography>
          </Box>
        </Box>

        {/* Content */}
        <Box sx={{ pl: { xs: 0, md: '75px' } }}>
          {section.content.map((block, i) => (
            <BlockRenderer key={i} block={block} />
          ))}

          {/* Subsections */}
          {section.subsections.map((sub, i) => (
            <Box key={i} sx={{
              mt: 4, pl: 3, borderLeft: `3px solid ${C.border}`,
            }}>
              <Typography sx={{ fontSize: 18, fontWeight: 600, color: C.navy, mb: 2 }}>
                <Box component="span" sx={{ color: C.orange, mr: 1 }}>{sub.letter}.</Box>
                {sub.title}
              </Typography>
              {sub.content.map((block, j) => (
                <BlockRenderer key={j} block={block} />
              ))}
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}

function sectionLabel(type: ParsedSection['type']): string {
  const map: Record<string, string> = {
    summary: 'Synthèse', context: 'Contexte', scope: 'Périmètre',
    plan: 'Plan d\'actions', timeline: 'Planning', financial: 'Financier',
    why: 'Différenciation', governance: 'Gouvernance', launch: 'Lancement', generic: 'Section',
  };
  return map[type] || 'Section';
}

/* ─── Phases timeline ─── */
function PhasesTimeline({ phases }: { phases: PhaseInfo[] }) {
  const reveal = useReveal();
  if (!phases.length) return null;

  return (
    <Box ref={reveal.ref} sx={{
      ...reveal.sx, py: { xs: 6, md: 10 }, px: 3, bgcolor: C.navy,
    }}>
      <Box sx={{ maxWidth: 900, mx: 'auto' }}>
        <Typography sx={{
          color: C.orange, fontWeight: 700, fontSize: 13, letterSpacing: 2,
          textTransform: 'uppercase', mb: 1,
        }}>
          Feuille de route
        </Typography>
        <Typography sx={{ color: '#fff', fontSize: { xs: 24, md: 32 }, fontWeight: 700, mb: 6 }}>
          Phases de l'intervention
        </Typography>

        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: `repeat(${Math.min(phases.length, 3)}, 1fr)` },
          gap: 3,
        }}>
          {phases.map((phase, i) => (
            <Box key={i} sx={{
              bgcolor: 'rgba(255,255,255,0.06)', borderRadius: 4, p: 4,
              borderTop: `4px solid ${C.orange}`, position: 'relative',
              backdropFilter: 'blur(8px)',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 40px rgba(0,0,0,0.2)' },
            }}>
              <Box sx={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 36, height: 36, borderRadius: '50%', bgcolor: C.orange,
                color: '#fff', fontWeight: 700, fontSize: 16, mb: 2,
              }}>
                {phase.number}
              </Box>
              <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: 18, mb: 0.5 }}>
                {phase.name}
              </Typography>
              {phase.period && (
                <Chip
                  icon={<CalendarMonthIcon sx={{ fontSize: 14, color: `${C.orange} !important` }} />}
                  label={phase.period}
                  size="small"
                  sx={{
                    bgcolor: 'rgba(232,132,44,0.15)', color: C.orange,
                    fontWeight: 500, fontSize: 12, mb: 2, height: 26,
                  }}
                />
              )}
              {phase.objective && (
                <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, lineHeight: 1.6, mb: 2 }}>
                  {phase.objective}
                </Typography>
              )}
              {phase.actions.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700,
                    letterSpacing: 1, textTransform: 'uppercase', mb: 1 }}>
                    Actions
                  </Typography>
                  {phase.actions.slice(0, 4).map((a, j) => (
                    <Box key={j} sx={{ display: 'flex', gap: 1, mb: 0.8, alignItems: 'flex-start' }}>
                      <FlagIcon sx={{ fontSize: 14, color: C.orange, mt: '3px' }} />
                      <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, lineHeight: 1.5 }}>
                        {a}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}
              {phase.deliverables.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700,
                    letterSpacing: 1, textTransform: 'uppercase', mb: 1 }}>
                    Livrables
                  </Typography>
                  {phase.deliverables.slice(0, 4).map((d, j) => (
                    <Box key={j} sx={{ display: 'flex', gap: 1, mb: 0.8, alignItems: 'flex-start' }}>
                      <CheckCircleOutlineIcon sx={{ fontSize: 14, color: '#4caf50', mt: '3px' }} />
                      <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, lineHeight: 1.5 }}>
                        {d}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}

/* ─── Pricing ─── */
function PricingSection({ financial }: { financial: FinancialInfo }) {
  const reveal = useReveal();
  return (
    <Box ref={reveal.ref} sx={{ ...reveal.sx, py: { xs: 6, md: 10 }, px: 3, bgcolor: C.surface }}>
      <Box sx={{ maxWidth: 500, mx: 'auto', textAlign: 'center' }}>
        <Typography sx={{
          color: C.orange, fontWeight: 700, fontSize: 13, letterSpacing: 2,
          textTransform: 'uppercase', mb: 1,
        }}>
          {financial.model === 'abonnement' ? 'Abonnement' :
           financial.model === 'tjm' ? 'Taux journalier' : 'Tarification'}
        </Typography>
        <Typography sx={{ fontSize: 28, fontWeight: 700, color: C.navy, mb: 4 }}>
          Modalités financières
        </Typography>

        <Box sx={{
          bgcolor: C.white, borderRadius: 4, p: 5, position: 'relative', overflow: 'hidden',
          boxShadow: '0 8px 40px rgba(30,45,61,0.1)', border: `1px solid ${C.border}`,
        }}>
          <Box sx={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 4,
            background: `linear-gradient(90deg, ${C.orange}, #F5A623)`,
          }} />

          {financial.amount && (
            <Box sx={{ mb: 3 }}>
              <Typography sx={{ fontSize: 48, fontWeight: 800, color: C.orange, lineHeight: 1 }}>
                {financial.amount}
              </Typography>
              {financial.period && (
                <Typography sx={{ fontSize: 18, color: C.textSecondary, mt: 0.5 }}>
                  / {financial.period}
                </Typography>
              )}
            </Box>
          )}

          {financial.details.length > 0 && (
            <Box sx={{ textAlign: 'left' }}>
              {financial.details.map((d, i) => (
                <Box key={i} sx={{ display: 'flex', gap: 1.5, mb: 1.2, alignItems: 'flex-start' }}>
                  <CheckCircleOutlineIcon sx={{ fontSize: 18, color: C.orange, mt: '2px' }} />
                  <Typography sx={{ fontSize: 14, color: C.textPrimary, lineHeight: 1.5 }}>
                    {d}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}

/* ─── Team ─── */
function TeamSection({ team }: { team: TeamMember[] }) {
  const reveal = useReveal();
  if (!team.length) return null;

  return (
    <Box ref={reveal.ref} sx={{ ...reveal.sx, py: { xs: 6, md: 10 }, px: 3, bgcolor: C.white }}>
      <Box sx={{ maxWidth: 900, mx: 'auto' }}>
        <Box sx={{ textAlign: 'center', mb: 5 }}>
          <Typography sx={{
            color: C.orange, fontWeight: 700, fontSize: 13, letterSpacing: 2,
            textTransform: 'uppercase', mb: 1,
          }}>
            Votre équipe dédiée
          </Typography>
          <Typography sx={{ fontSize: 28, fontWeight: 700, color: C.navy }}>
            Les experts mobilisés
          </Typography>
        </Box>

        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: `repeat(${Math.min(team.length, 3)}, 1fr)` },
          gap: 3,
        }}>
          {team.map((member, i) => (
            <Box key={i} sx={{
              bgcolor: C.surface, borderRadius: 4, p: 4, textAlign: 'center',
              border: `1px solid ${C.border}`,
              transition: 'transform 0.3s, box-shadow 0.3s',
              '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 8px 32px rgba(0,0,0,0.08)' },
            }}>
              <Box sx={{
                width: 64, height: 64, borderRadius: '50%',
                background: `linear-gradient(135deg, ${C.orange}, #F5A623)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                mx: 'auto', mb: 2,
              }}>
                <GroupsIcon sx={{ color: '#fff', fontSize: 28 }} />
              </Box>
              <Typography sx={{ fontWeight: 700, color: C.navy, fontSize: 17, mb: 0.5 }}>
                {member.name}
              </Typography>
              <Typography sx={{ color: C.orange, fontWeight: 600, fontSize: 13, mb: 1 }}>
                {member.role}
              </Typography>
              {member.description && (
                <Typography sx={{ color: C.textSecondary, fontSize: 13, lineHeight: 1.6 }}>
                  {member.description}
                </Typography>
              )}
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}

/* ─── Preamble / Executive Summary ─── */
function PreambleSection({ text }: { text: string }) {
  const reveal = useReveal();
  return (
    <Box ref={reveal.ref} sx={{ ...reveal.sx, py: { xs: 5, md: 8 }, px: 3, bgcolor: C.white }}>
      <Box sx={{
        maxWidth: 800, mx: 'auto', p: { xs: 3, md: 5 }, borderRadius: 4,
        bgcolor: C.surface, border: `1px solid ${C.border}`,
        borderLeft: `4px solid ${C.orange}`,
      }}>
        <Typography sx={{
          color: C.orange, fontWeight: 700, fontSize: 13, letterSpacing: 2,
          textTransform: 'uppercase', mb: 2,
        }}>
          Résumé
        </Typography>
        <Typography sx={{ fontSize: 16, lineHeight: 1.8, color: C.textPrimary }}>
          {text}
        </Typography>
      </Box>
    </Box>
  );
}

/* ─── Footer ─── */
function ViewerFooter() {
  return (
    <Box sx={{
      bgcolor: C.navy, py: 6, px: 4, textAlign: 'center',
    }}>
      <Typography sx={{
        color: C.orange, fontWeight: 700, fontSize: 13, letterSpacing: 3,
        textTransform: 'uppercase', mb: 2,
      }}>
        DAIRIA AVOCATS
      </Typography>
      <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, mb: 0.5 }}>
        65 rue Jacques Louis Hénon — 69004 Lyon
      </Typography>
      <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, mb: 0.5 }}>
        3 quai Hoche — 44200 Nantes
      </Typography>
      <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, mb: 3 }}>
        s.coly@dairia-avocats.com — 06 72 42 24 86
      </Typography>
      <Box sx={{ width: 40, height: 3, bgcolor: C.orange, borderRadius: 2, mx: 'auto', mb: 3 }} />
      <Typography sx={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>
        Document confidentiel — Proposition générée par Dairia Avocats
      </Typography>
    </Box>
  );
}

/* ─── Main Viewer ─── */
export default function ProposalViewer({
  proposal, onBack,
}: {
  proposal: ParsedProposal; onBack: () => void;
}) {
  const [activeSection, setActiveSection] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Track active section
  const handleScroll = useCallback(() => {
    const sections = proposal.sections;
    for (let i = sections.length - 1; i >= 0; i--) {
      const el = document.getElementById(sections[i].id);
      if (el) {
        const rect = el.getBoundingClientRect();
        if (rect.top <= 200) {
          setActiveSection(sections[i].id);
          return;
        }
      }
    }
    if (sections.length) setActiveSection(sections[0].id);
  }, [proposal.sections]);

  useEffect(() => {
    const c = containerRef.current;
    if (!c) return;
    c.addEventListener('scroll', handleScroll, { passive: true });
    return () => c.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Find the financial section index to insert phases & pricing nearby
  const financialIdx = proposal.sections.findIndex(s => s.type === 'financial');
  const planIdx = proposal.sections.findIndex(s => s.type === 'plan' || s.type === 'timeline');
  const phasesInsertIdx = planIdx >= 0 ? planIdx + 1 : (financialIdx >= 0 ? financialIdx : proposal.sections.length);

  return (
    <Box
      ref={containerRef}
      sx={{
        position: 'fixed', inset: 0, zIndex: 9999,
        bgcolor: C.white, overflow: 'auto',
        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
      }}
    >
      {/* Back button */}
      <IconButton
        onClick={onBack}
        sx={{
          position: 'fixed', top: 20, left: 20, zIndex: 10001,
          bgcolor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
          '&:hover': { bgcolor: '#fff' },
        }}
      >
        <ArrowBackIcon sx={{ color: C.navy }} />
      </IconButton>

      {/* TOC */}
      <TOC sections={proposal.sections} activeId={activeSection} />

      {/* Hero */}
      <Hero proposal={proposal} />

      {/* Preamble */}
      {proposal.preamble && <PreambleSection text={proposal.preamble} />}

      {/* Sections with phases/pricing injected at the right position */}
      {proposal.sections.map((section, i) => (
        <React.Fragment key={section.id}>
          <SectionCard section={section} index={i} />

          {/* Insert phases after plan/timeline section */}
          {i === phasesInsertIdx - 1 && proposal.phases.length > 0 && (
            <PhasesTimeline phases={proposal.phases} />
          )}

          {/* Insert pricing after financial section */}
          {section.type === 'financial' && proposal.financial && (
            <PricingSection financial={proposal.financial} />
          )}
        </React.Fragment>
      ))}

      {/* If phases/pricing weren't inserted, put them at the end */}
      {phasesInsertIdx >= proposal.sections.length && proposal.phases.length > 0 && (
        <PhasesTimeline phases={proposal.phases} />
      )}
      {!proposal.sections.some(s => s.type === 'financial') && proposal.financial && (
        <PricingSection financial={proposal.financial} />
      )}

      {/* Team */}
      <TeamSection team={proposal.team} />

      {/* Footer */}
      <ViewerFooter />
    </Box>
  );
}
