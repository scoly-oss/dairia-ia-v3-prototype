import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Chip,
  Button,
  TextField,
  MenuItem,
  Paper,
  Divider,
  LinearProgress,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import {
  Gavel,
  TrendingUp,
  Warning,
  Info,
  AccountBalance,
  Calculate,
  ArrowForward,
  ArrowBack,
  RestartAlt,
} from '@mui/icons-material';
import { DSCard } from '../../components/design-system/DSCard';

// ---------------------------------------------------------------------------
// Types & constants
// ---------------------------------------------------------------------------

const ORANGE = '#e8842c';
const NAVY = '#1e2d3d';

const STEPS = ['Parametres', 'Analyse', 'Resultats'];

const TYPES_CONTENTIEUX = [
  'Licenciement sans cause reelle et serieuse',
  'Harcelement moral',
  'Discrimination',
  'Heures supplementaires',
  'Rupture abusive',
];

const MOTIFS_OPTIONS = [
  'Absence de cause reelle et serieuse',
  'Procedure irreguliere',
  'Rappel heures sup',
  'Prejudice moral',
  'Execution deloyale',
];

const ANALYSIS_STEPS = [
  'Calcul bareme Macron',
  'Recherche jurisprudence similaire',
  'Evaluation des risques',
  'Estimation financiere',
];

const MOCK_JURISPRUDENCE = [
  {
    ref: 'Cass. soc. 15 jan. 2026, n\u00B024-12.345',
    result: 'Condamnation 8 mois de salaire',
  },
  {
    ref: 'Cass. soc. 22 nov. 2025, n\u00B023-18.901',
    result: 'Rejet, procedure reguliere',
  },
  {
    ref: 'CA Paris, 10 sept. 2025, n\u00B023/04567',
    result: 'Transaction 12 000\u20AC',
  },
];

interface Results {
  riskScore: number;
  plancher: number;
  plafond: number;
  probable: number;
  indemniteLicenciement: number;
  dommagesInterets: number;
  rappelHeuresSup: number;
  prejudiceMoral: number;
  article700: number;
  total: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getRiskLabel(score: number): string {
  if (score < 30) return 'Risque faible';
  if (score < 50) return 'Risque moyen';
  if (score < 70) return 'Risque eleve';
  return 'Risque tres eleve';
}

function getRiskColor(score: number): string {
  if (score < 30) return '#4caf50';
  if (score < 60) return ORANGE;
  return '#e53935';
}

function computeResults(
  anciennete: number,
  salaire: number,
  motifs: string[],
): Results {
  const plancher = Math.max(1, anciennete * 0.5);
  const plafond = Math.min(20, anciennete * 1.5 + 3);
  const probable = parseFloat(((plancher + plafond) / 2).toFixed(1));

  const indemniteLicenciement = parseFloat(
    ((salaire / 4) * anciennete).toFixed(2),
  );
  const dommagesInterets = parseFloat((probable * salaire).toFixed(2));
  const rappelHeuresSup = motifs.includes('Rappel heures sup')
    ? parseFloat((salaire * 12 * 0.15).toFixed(2))
    : 0;
  const prejudiceMoral = motifs.includes('Prejudice moral')
    ? parseFloat((salaire * 3).toFixed(2))
    : 0;
  const article700 = 2000;

  const total =
    indemniteLicenciement +
    dommagesInterets +
    rappelHeuresSup +
    prejudiceMoral +
    article700;

  // Risk heuristic: more motifs + higher anciennete = higher risk
  const riskBase = Math.min(
    100,
    motifs.length * 15 + anciennete * 3 + 10,
  );
  const riskScore = Math.round(Math.min(100, riskBase));

  return {
    riskScore,
    plancher,
    plafond,
    probable,
    indemniteLicenciement,
    dommagesInterets,
    rappelHeuresSup,
    prejudiceMoral,
    article700,
    total: parseFloat(total.toFixed(2)),
  };
}

function formatEuro(value: number): string {
  return value.toLocaleString('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  });
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const SectionTitle: React.FC<{
  icon: React.ReactNode;
  title: string;
}> = ({ icon, title }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 40,
        height: 40,
        borderRadius: '12px',
        background: `linear-gradient(135deg, ${ORANGE}, #f4a261)`,
        color: '#fff',
      }}
    >
      {icon}
    </Box>
    <Typography variant="h6" sx={{ fontWeight: 700, color: NAVY }}>
      {title}
    </Typography>
  </Box>
);

const CostLine: React.FC<{
  label: string;
  value: number;
  bold?: boolean;
  color?: string;
}> = ({ label, value, bold, color }) => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      py: 1,
    }}
  >
    <Typography
      sx={{
        fontWeight: bold ? 700 : 400,
        color: color ?? NAVY,
        fontSize: bold ? '1.1rem' : '0.95rem',
      }}
    >
      {label}
    </Typography>
    <Typography
      sx={{
        fontWeight: bold ? 700 : 500,
        color: color ?? NAVY,
        fontSize: bold ? '1.1rem' : '0.95rem',
      }}
    >
      {formatEuro(value)}
    </Typography>
  </Box>
);

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export const LitigationPage: React.FC = () => {
  // Form state
  const [typeContentieux, setTypeContentieux] = useState(TYPES_CONTENTIEUX[0]);
  const [anciennete, setAnciennete] = useState<number>(5);
  const [salaire, setSalaire] = useState<number>(3500);
  const [effectif, setEffectif] = useState<number>(50);
  const [convention, setConvention] = useState('Syntec - IDCC 1486');
  const [motifs, setMotifs] = useState<string[]>([]);

  // Navigation
  const [activeStep, setActiveStep] = useState(0);

  // Analysis
  const [loading, setLoading] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [completedAnalysisSteps, setCompletedAnalysisSteps] = useState<
    number[]
  >([]);

  // Results
  const [results, setResults] = useState<Results | null>(null);

  // ------ motif toggle ------
  const toggleMotif = useCallback((motif: string) => {
    setMotifs((prev) =>
      prev.includes(motif) ? prev.filter((m) => m !== motif) : [...prev, motif],
    );
  }, []);

  // ------ analysis simulation ------
  const runAnalysis = useCallback(() => {
    setActiveStep(1);
    setLoading(true);
    setAnalysisProgress(0);
    setCompletedAnalysisSteps([]);

    const stepDuration = 2000 / ANALYSIS_STEPS.length; // total 2s

    ANALYSIS_STEPS.forEach((_, idx) => {
      setTimeout(() => {
        setCompletedAnalysisSteps((prev) => [...prev, idx]);
        setAnalysisProgress(((idx + 1) / ANALYSIS_STEPS.length) * 100);

        // Last step -> compute & advance
        if (idx === ANALYSIS_STEPS.length - 1) {
          setTimeout(() => {
            setResults(computeResults(anciennete, salaire, motifs));
            setLoading(false);
            setActiveStep(2);
          }, 400);
        }
      }, stepDuration * (idx + 1));
    });
  }, [anciennete, salaire, motifs]);

  const resetSimulation = useCallback(() => {
    setActiveStep(0);
    setResults(null);
    setLoading(false);
    setAnalysisProgress(0);
    setCompletedAnalysisSteps([]);
  }, []);

  // ------ recommendations based on risk ------
  const getRecommendations = useCallback(
    (score: number): string[] => {
      const recs: string[] = [];
      if (score >= 60) {
        recs.push(
          'Risque contentieux eleve : privilegier une negociation amiable ou une transaction.',
        );
        recs.push(
          'Constituer un dossier solide avec preuves documentees avant toute procedure.',
        );
      }
      if (score >= 30 && score < 60) {
        recs.push(
          'Risque modere : envisager une mediation conventionnelle avant la saisine du CPH.',
        );
      }
      if (score < 30) {
        recs.push(
          'Risque faible : la position de l\'employeur semble solide.',
        );
      }
      if (motifs.includes('Rappel heures sup')) {
        recs.push(
          'Verifier la conformite des decomptes horaires et bulletins de paie.',
        );
      }
      if (motifs.includes('Prejudice moral')) {
        recs.push(
          'Rassembler les elements de preuve du prejudice (certificats medicaux, temoignages).',
        );
      }
      recs.push(
        'Consulter la convention collective applicable pour les dispositions specifiques.',
      );
      recs.push(
        'Anticiper les delais de prescription (12 mois pour contester le licenciement).',
      );
      return recs;
    },
    [motifs],
  );

  // =====================================================================
  // RENDER
  // =====================================================================

  return (
    <Box sx={{ maxWidth: 960, mx: 'auto', px: { xs: 2, md: 4 }, py: 4 }}>
      {/* ---- HEADER ---- */}
      <Box sx={{ textAlign: 'center', mb: 5 }}>
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: '20px',
            background: (theme: any) =>
              theme.custom?.gradients?.primary ??
              `linear-gradient(135deg, ${ORANGE}, #f4a261)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 2,
            boxShadow: `0 8px 24px ${ORANGE}40`,
          }}
        >
          <Gavel sx={{ color: '#fff', fontSize: 32 }} />
        </Box>
        <Typography
          variant="h4"
          sx={{ fontWeight: 800, color: NAVY, mb: 0.5 }}
        >
          Simulateur Contentieux Prud'homal
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary' }}>
          Estimez les risques et couts d'un contentieux devant le Conseil de
          Prud'hommes
        </Typography>
      </Box>

      {/* ---- STEPPER ---- */}
      <Stepper
        activeStep={activeStep}
        alternativeLabel
        sx={{
          mb: 4,
          '& .MuiStepLabel-label.Mui-active': { color: ORANGE, fontWeight: 600 },
          '& .MuiStepLabel-label.Mui-completed': { color: ORANGE },
          '& .MuiStepIcon-root.Mui-active': { color: ORANGE },
          '& .MuiStepIcon-root.Mui-completed': { color: ORANGE },
        }}
      >
        {STEPS.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* ================================================================ */}
      {/* STEP 1 - PARAMETRES                                              */}
      {/* ================================================================ */}
      {activeStep === 0 && (
        <DSCard noHover sx={{ p: { xs: 3, md: 4 } }}>
          <SectionTitle
            icon={<Calculate fontSize="small" />}
            title="Parametres du contentieux"
          />

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              gap: 3,
              mt: 3,
            }}
          >
            {/* Type de contentieux */}
            <TextField
              select
              fullWidth
              label="Type de contentieux"
              value={typeContentieux}
              onChange={(e) => setTypeContentieux(e.target.value)}
            >
              {TYPES_CONTENTIEUX.map((t) => (
                <MenuItem key={t} value={t}>
                  {t}
                </MenuItem>
              ))}
            </TextField>

            {/* Anciennete */}
            <TextField
              type="number"
              fullWidth
              label="Anciennete (annees)"
              value={anciennete}
              onChange={(e) =>
                setAnciennete(Math.max(0, parseInt(e.target.value, 10) || 0))
              }
              inputProps={{ min: 0 }}
            />

            {/* Salaire */}
            <TextField
              type="number"
              fullWidth
              label="Salaire brut mensuel (\u20AC)"
              value={salaire}
              onChange={(e) =>
                setSalaire(Math.max(0, parseFloat(e.target.value) || 0))
              }
              inputProps={{ min: 0 }}
            />

            {/* Effectif */}
            <TextField
              type="number"
              fullWidth
              label="Effectif entreprise"
              value={effectif}
              onChange={(e) =>
                setEffectif(Math.max(1, parseInt(e.target.value, 10) || 1))
              }
              inputProps={{ min: 1 }}
            />

            {/* Convention collective */}
            <TextField
              fullWidth
              label="Convention collective"
              value={convention}
              onChange={(e) => setConvention(e.target.value)}
              sx={{ gridColumn: { sm: '1 / -1' } }}
            />
          </Box>

          {/* Motifs */}
          <Typography
            variant="subtitle2"
            sx={{ mt: 4, mb: 1.5, fontWeight: 600, color: NAVY }}
          >
            Motifs invoques
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {MOTIFS_OPTIONS.map((m) => {
              const selected = motifs.includes(m);
              return (
                <Chip
                  key={m}
                  label={m}
                  clickable
                  onClick={() => toggleMotif(m)}
                  variant={selected ? 'filled' : 'outlined'}
                  sx={{
                    fontWeight: 500,
                    borderRadius: '12px',
                    ...(selected
                      ? {
                          bgcolor: ORANGE,
                          color: '#fff',
                          '&:hover': { bgcolor: '#d6751f' },
                        }
                      : {
                          borderColor: '#ccc',
                          '&:hover': { borderColor: ORANGE, color: ORANGE },
                        }),
                  }}
                />
              );
            })}
          </Box>

          {/* Submit */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
            <Button
              variant="contained"
              size="large"
              endIcon={<ArrowForward />}
              disabled={motifs.length === 0}
              onClick={runAnalysis}
              sx={{
                bgcolor: ORANGE,
                borderRadius: '14px',
                textTransform: 'none',
                fontWeight: 600,
                px: 4,
                '&:hover': { bgcolor: '#d6751f' },
              }}
            >
              Analyser
            </Button>
          </Box>
        </DSCard>
      )}

      {/* ================================================================ */}
      {/* STEP 2 - ANALYSE                                                 */}
      {/* ================================================================ */}
      {activeStep === 1 && (
        <DSCard noHover sx={{ p: { xs: 3, md: 5 }, textAlign: 'center' }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: '16px',
              background: `linear-gradient(135deg, ${ORANGE}, #f4a261)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 3,
            }}
          >
            <TrendingUp sx={{ color: '#fff', fontSize: 28 }} />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: NAVY, mb: 1 }}>
            Analyse en cours...
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4 }}>
            Notre moteur d'analyse evalue votre situation
          </Typography>

          <LinearProgress
            variant="determinate"
            value={analysisProgress}
            sx={{
              height: 8,
              borderRadius: 4,
              mb: 4,
              bgcolor: '#f0f0f0',
              '& .MuiLinearProgress-bar': {
                bgcolor: ORANGE,
                borderRadius: 4,
              },
            }}
          />

          <Box sx={{ textAlign: 'left', maxWidth: 360, mx: 'auto' }}>
            {ANALYSIS_STEPS.map((step, idx) => {
              const done = completedAnalysisSteps.includes(idx);
              return (
                <Box
                  key={step}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    py: 0.75,
                    opacity: done ? 1 : 0.4,
                    transition: 'opacity 0.3s',
                  }}
                >
                  <Typography sx={{ fontSize: '1.1rem' }}>
                    {done ? '\u2705' : '\u23F3'}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: done ? 600 : 400,
                      color: done ? NAVY : 'text.secondary',
                    }}
                  >
                    {step}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </DSCard>
      )}

      {/* ================================================================ */}
      {/* STEP 3 - RESULTATS                                               */}
      {/* ================================================================ */}
      {activeStep === 2 && results && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* ---------- Risk gauge ---------- */}
          <DSCard noHover sx={{ p: { xs: 3, md: 4 } }}>
            <SectionTitle
              icon={<Warning fontSize="small" />}
              title="Niveau de risque"
            />
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: 'center',
                gap: 3,
                mt: 2,
              }}
            >
              {/* Large score */}
              <Box sx={{ textAlign: 'center', minWidth: 120 }}>
                <Typography
                  sx={{
                    fontSize: '3.5rem',
                    fontWeight: 800,
                    lineHeight: 1,
                    color: getRiskColor(results.riskScore),
                  }}
                >
                  {results.riskScore}%
                </Typography>
                <Chip
                  label={getRiskLabel(results.riskScore)}
                  size="small"
                  sx={{
                    mt: 1,
                    fontWeight: 600,
                    bgcolor: `${getRiskColor(results.riskScore)}18`,
                    color: getRiskColor(results.riskScore),
                    borderRadius: '10px',
                  }}
                />
              </Box>

              {/* Horizontal bar */}
              <Box sx={{ flex: 1, width: '100%' }}>
                <Box
                  sx={{
                    height: 16,
                    borderRadius: 8,
                    bgcolor: '#f0f0f0',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <Box
                    sx={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      height: '100%',
                      width: `${results.riskScore}%`,
                      borderRadius: 8,
                      background: `linear-gradient(90deg, ${getRiskColor(
                        results.riskScore,
                      )}cc, ${getRiskColor(results.riskScore)})`,
                      transition: 'width 0.6s ease',
                    }}
                  />
                </Box>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    mt: 0.5,
                  }}
                >
                  <Typography variant="caption" sx={{ color: '#4caf50' }}>
                    Faible
                  </Typography>
                  <Typography variant="caption" sx={{ color: ORANGE }}>
                    Moyen
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#e53935' }}>
                    Eleve
                  </Typography>
                </Box>
              </Box>
            </Box>
          </DSCard>

          {/* ---------- Bareme Macron ---------- */}
          <DSCard noHover sx={{ p: { xs: 3, md: 4 } }}>
            <SectionTitle
              icon={<AccountBalance fontSize="small" />}
              title="Bareme Macron"
            />

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' },
                gap: 2,
                mt: 2,
              }}
            >
              {/* Plancher */}
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: '16px',
                  bgcolor: '#f8f9fb',
                  textAlign: 'center',
                }}
              >
                <Typography
                  variant="caption"
                  sx={{ color: 'text.secondary', fontWeight: 500 }}
                >
                  Indemnite plancher
                </Typography>
                <Typography
                  sx={{ fontSize: '1.6rem', fontWeight: 700, color: NAVY }}
                >
                  {results.plancher} mois
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {formatEuro(results.plancher * salaire)}
                </Typography>
              </Paper>

              {/* Probable */}
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: '16px',
                  bgcolor: `${ORANGE}12`,
                  border: `2px solid ${ORANGE}`,
                  textAlign: 'center',
                }}
              >
                <Typography
                  variant="caption"
                  sx={{ color: ORANGE, fontWeight: 600 }}
                >
                  Estimation probable
                </Typography>
                <Typography
                  sx={{ fontSize: '1.6rem', fontWeight: 800, color: ORANGE }}
                >
                  {results.probable} mois
                </Typography>
                <Typography variant="caption" sx={{ color: ORANGE }}>
                  {formatEuro(results.probable * salaire)}
                </Typography>
              </Paper>

              {/* Plafond */}
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: '16px',
                  bgcolor: '#f8f9fb',
                  textAlign: 'center',
                }}
              >
                <Typography
                  variant="caption"
                  sx={{ color: 'text.secondary', fontWeight: 500 }}
                >
                  Indemnite plafond
                </Typography>
                <Typography
                  sx={{ fontSize: '1.6rem', fontWeight: 700, color: NAVY }}
                >
                  {results.plafond} mois
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {formatEuro(results.plafond * salaire)}
                </Typography>
              </Paper>
            </Box>

            {/* Visual range bar */}
            <Box sx={{ mt: 3 }}>
              <Box
                sx={{
                  height: 12,
                  borderRadius: 6,
                  bgcolor: '#f0f0f0',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    left: `${(results.plancher / 20) * 100}%`,
                    width: `${((results.plafond - results.plancher) / 20) * 100}%`,
                    top: 0,
                    height: '100%',
                    borderRadius: 6,
                    background: `linear-gradient(90deg, ${ORANGE}88, ${ORANGE})`,
                  }}
                />
                {/* Probable marker */}
                <Box
                  sx={{
                    position: 'absolute',
                    left: `${(results.probable / 20) * 100}%`,
                    top: -4,
                    width: 4,
                    height: 20,
                    bgcolor: NAVY,
                    borderRadius: 2,
                    transform: 'translateX(-50%)',
                  }}
                />
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  mt: 0.5,
                }}
              >
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  0 mois
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  20 mois
                </Typography>
              </Box>
            </Box>
          </DSCard>

          {/* ---------- Cout total ---------- */}
          <DSCard noHover sx={{ p: { xs: 3, md: 4 } }}>
            <SectionTitle
              icon={<Calculate fontSize="small" />}
              title="Cout total estime"
            />

            <CostLine
              label="Indemnite de licenciement"
              value={results.indemniteLicenciement}
            />
            <Divider />
            <CostLine
              label="Dommages et interets (bareme Macron)"
              value={results.dommagesInterets}
            />
            <Divider />
            {results.rappelHeuresSup > 0 && (
              <>
                <CostLine
                  label="Rappel heures supplementaires"
                  value={results.rappelHeuresSup}
                />
                <Divider />
              </>
            )}
            {results.prejudiceMoral > 0 && (
              <>
                <CostLine
                  label="Prejudice moral"
                  value={results.prejudiceMoral}
                />
                <Divider />
              </>
            )}
            <CostLine label="Article 700 (frais de justice)" value={results.article700} />
            <Divider sx={{ borderStyle: 'dashed', my: 1 }} />
            <CostLine label="Total estime" value={results.total} bold color={ORANGE} />
          </DSCard>

          {/* ---------- Jurisprudence ---------- */}
          <DSCard noHover sx={{ p: { xs: 3, md: 4 } }}>
            <SectionTitle
              icon={<AccountBalance fontSize="small" />}
              title="Jurisprudence similaire"
            />
            {MOCK_JURISPRUDENCE.map((j, idx) => (
              <Box
                key={idx}
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 2,
                  py: 1.5,
                  borderBottom:
                    idx < MOCK_JURISPRUDENCE.length - 1
                      ? '1px solid #eee'
                      : 'none',
                }}
              >
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '10px',
                    bgcolor: `${ORANGE}14`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    mt: 0.25,
                  }}
                >
                  <Gavel sx={{ fontSize: 16, color: ORANGE }} />
                </Box>
                <Box>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 600, color: NAVY }}
                  >
                    {j.ref}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {j.result}
                  </Typography>
                </Box>
              </Box>
            ))}
          </DSCard>

          {/* ---------- Recommandations ---------- */}
          <DSCard noHover sx={{ p: { xs: 3, md: 4 } }}>
            <SectionTitle
              icon={<Info fontSize="small" />}
              title="Recommandations strategiques"
            />
            <Box
              component="ul"
              sx={{ pl: 2.5, m: 0, display: 'flex', flexDirection: 'column', gap: 1.5 }}
            >
              {getRecommendations(results.riskScore).map((rec, idx) => (
                <Box component="li" key={idx}>
                  <Typography variant="body2" sx={{ color: NAVY }}>
                    {rec}
                  </Typography>
                </Box>
              ))}
            </Box>
          </DSCard>

          {/* ---------- Actions ---------- */}
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: 2,
              mt: 1,
            }}
          >
            <Button
              variant="outlined"
              startIcon={<RestartAlt />}
              onClick={resetSimulation}
              sx={{
                borderRadius: '14px',
                textTransform: 'none',
                fontWeight: 600,
                borderColor: NAVY,
                color: NAVY,
                '&:hover': { borderColor: NAVY, bgcolor: `${NAVY}08` },
              }}
            >
              Nouvelle simulation
            </Button>
            <Button
              variant="contained"
              sx={{
                borderRadius: '14px',
                textTransform: 'none',
                fontWeight: 600,
                bgcolor: NAVY,
                '&:hover': { bgcolor: '#16222e' },
              }}
            >
              Creer un dossier
            </Button>
            <Button
              variant="contained"
              sx={{
                borderRadius: '14px',
                textTransform: 'none',
                fontWeight: 600,
                bgcolor: ORANGE,
                '&:hover': { bgcolor: '#d6751f' },
              }}
            >
              Consulter l'IA
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
};
