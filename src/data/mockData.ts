/**
 * Mock data for DEMO_MODE - Realistic French labor law scenarios
 * Company: TechVision SAS, 47 salariés, Syntec IDCC 1486
 */

import { Alert } from '../types/alert';
import { Dossier, DossierDetail, DossierEvent } from '../types/dossier';

// ==========================================
// ALERTS - Veille juridique personnalisée
// ==========================================
export const MOCK_ALERTS: Alert[] = [
  {
    id: 'alert-001',
    company_id: 'demo-company-001',
    type: 'legal_watch',
    severity: 'critical',
    title: 'Forfait jours : nouvelle jurisprudence Cass. soc.',
    description: 'Cass. soc. 10 mars 2026, n°24-15.789 : la Cour de cassation invalide les conventions de forfait jours conclues sans suivi effectif de la charge de travail. Impact direct sur vos 12 cadres au forfait. Actions correctives nécessaires sous 30 jours.',
    is_read: false,
    source: 'Cour de cassation - Chambre sociale',
    source_url: 'https://www.legifrance.gouv.fr',
    created_at: '2026-03-11T08:30:00Z',
    updated_at: '2026-03-11T08:30:00Z',
    metadata: { affected_employees: 12, risk_level: 'high' },
  },
  {
    id: 'alert-002',
    company_id: 'demo-company-001',
    type: 'deadline',
    severity: 'critical',
    title: 'Entretiens professionnels : 5 retards identifiés',
    description: 'Les entretiens professionnels biennaux de 5 salariés n\'ont pas été réalisés dans les délais. Risque d\'abondement correctif du CPF (3 000€/salarié). Planifiez-les avant le 30 avril 2026.',
    is_read: false,
    due_date: '2026-04-30T00:00:00Z',
    created_at: '2026-03-10T14:00:00Z',
    updated_at: '2026-03-10T14:00:00Z',
    metadata: { affected_employees: 5, penalty_per_employee: 3000 },
  },
  {
    id: 'alert-003',
    company_id: 'demo-company-001',
    type: 'compliance',
    severity: 'warning',
    title: 'Accord télétravail : expiration dans 45 jours',
    description: 'Votre accord d\'entreprise sur le télétravail expire le 25 avril 2026. Sans renouvellement, le télétravail sera soumis au droit commun (accord individuel). Recommandation : ouvrir les négociations avec les élus CSE dès maintenant.',
    is_read: false,
    due_date: '2026-04-25T00:00:00Z',
    created_at: '2026-03-09T10:00:00Z',
    updated_at: '2026-03-09T10:00:00Z',
  },
  {
    id: 'alert-004',
    company_id: 'demo-company-001',
    type: 'ccn_update',
    severity: 'warning',
    title: 'Syntec : nouvelle grille de salaires minima 2026',
    description: 'Avenant n°48 du 14 février 2026 à la CCN Syntec : revalorisation des minima conventionnels de 3,2%. 8 de vos salariés ETAM sont potentiellement sous les nouveaux minima. Vérification et régularisation recommandées.',
    is_read: true,
    source: 'IDCC 1486 - Avenant salaires',
    created_at: '2026-03-05T09:00:00Z',
    updated_at: '2026-03-07T11:30:00Z',
    metadata: { affected_employees: 8, salary_increase_percent: 3.2 },
  },
  {
    id: 'alert-005',
    company_id: 'demo-company-001',
    type: 'deadline',
    severity: 'warning',
    title: 'BDESE : mise à jour annuelle requise',
    description: 'La Base de Données Économiques, Sociales et Environnementales doit être mise à jour avant la consultation annuelle du CSE sur la politique sociale. Échéance recommandée : 15 avril 2026.',
    is_read: true,
    due_date: '2026-04-15T00:00:00Z',
    created_at: '2026-03-03T08:00:00Z',
    updated_at: '2026-03-03T08:00:00Z',
  },
  {
    id: 'alert-006',
    company_id: 'demo-company-001',
    type: 'compliance',
    severity: 'info',
    title: 'Seuil de 50 salariés : anticipez vos obligations',
    description: 'Avec 47 salariés, vous approchez du seuil de 50. Au franchissement : participation obligatoire, CSE avec attributions élargies, règlement intérieur obligatoire, bilan social. Dairia IA a préparé une checklist de mise en conformité.',
    is_read: true,
    created_at: '2026-03-01T10:00:00Z',
    updated_at: '2026-03-01T10:00:00Z',
    metadata: { current_headcount: 47, threshold: 50 },
  },
  {
    id: 'alert-007',
    company_id: 'demo-company-001',
    type: 'legal_watch',
    severity: 'info',
    title: 'Décret : nouveau barème indemnités kilométriques 2026',
    description: 'Arrêté du 28 février 2026 : revalorisation du barème kilométrique de 4,7%. Mettez à jour vos notes de frais et politique de remboursement.',
    is_read: true,
    source: 'Journal Officiel',
    created_at: '2026-02-28T08:00:00Z',
    updated_at: '2026-02-28T08:00:00Z',
  },
];

// ==========================================
// DOSSIERS - Affaires juridiques en cours
// ==========================================
export const MOCK_DOSSIERS: Dossier[] = [
  {
    id: 'dossier-001',
    company_id: 'demo-company-001',
    created_by: 'demo-user-001',
    title: 'Licenciement M. Dupont - Insuffisance professionnelle',
    description: 'Procédure de licenciement pour insuffisance professionnelle de Marc Dupont (développeur senior, 6 ans d\'ancienneté). Entretien préalable réalisé le 5 mars. Notification en cours de rédaction.',
    type: 'licenciement',
    status: 'in_progress',
    priority: 'high',
    created_at: '2026-02-15T09:00:00Z',
    updated_at: '2026-03-11T16:00:00Z',
    metadata: {
      employee_name: 'Marc Dupont',
      position: 'Développeur Senior',
      seniority_years: 6,
      next_action: 'Envoi lettre de licenciement',
      next_deadline: '2026-03-19T00:00:00Z',
    },
  },
  {
    id: 'dossier-002',
    company_id: 'demo-company-001',
    created_by: 'demo-user-001',
    title: 'Rupture conventionnelle Mme Leclerc',
    description: 'Négociation de rupture conventionnelle avec Claire Leclerc (chef de projet, 4 ans). Demande initiée par la salariée. Calcul des indemnités et rédaction du protocole.',
    type: 'rupture_conv',
    status: 'in_progress',
    priority: 'normal',
    created_at: '2026-03-01T10:00:00Z',
    updated_at: '2026-03-10T14:30:00Z',
    metadata: {
      employee_name: 'Claire Leclerc',
      position: 'Chef de projet',
      seniority_years: 4,
      next_action: 'Signature CERFA + homologation DREETS',
      next_deadline: '2026-03-25T00:00:00Z',
      indemnity_calculated: 8750,
    },
  },
  {
    id: 'dossier-003',
    company_id: 'demo-company-001',
    created_by: 'demo-user-001',
    title: 'Contentieux prud\'homal - A. Moreau',
    description: 'Contestation de licenciement par Antoine Moreau (ancien commercial). Demande : 45 000€ pour licenciement sans cause réelle et sérieuse + rappel d\'heures supplémentaires. Audience BCO le 20 mai 2026.',
    type: 'contentieux',
    status: 'in_progress',
    priority: 'urgent',
    created_at: '2026-01-20T09:00:00Z',
    updated_at: '2026-03-11T17:00:00Z',
    metadata: {
      employee_name: 'Antoine Moreau',
      amount_claimed: 45000,
      hearing_date: '2026-05-20T14:00:00Z',
      next_action: 'Rédaction des conclusions en défense',
      next_deadline: '2026-04-15T00:00:00Z',
      jurisdiction: 'CPH Paris',
      risk_assessment: 'moyen',
    },
  },
  {
    id: 'dossier-004',
    company_id: 'demo-company-001',
    created_by: 'demo-user-001',
    title: 'Audit conformité forfait jours',
    description: 'Suite à la jurisprudence récente, audit complet des 12 conventions de forfait jours. Vérification des accords collectifs, avenants individuels, et respect du suivi charge de travail.',
    type: 'audit',
    status: 'open',
    priority: 'high',
    created_at: '2026-03-11T09:00:00Z',
    updated_at: '2026-03-11T09:00:00Z',
    metadata: {
      scope: '12 cadres au forfait jours',
      next_action: 'Analyse des conventions individuelles',
      triggered_by: 'alert-001',
    },
  },
  {
    id: 'dossier-005',
    company_id: 'demo-company-001',
    created_by: 'demo-user-001',
    title: 'Mise en place accord intéressement',
    description: 'Négociation et rédaction d\'un accord d\'intéressement pour l\'exercice 2026. Objectif : motiver les équipes tout en optimisant le coût social.',
    type: 'general',
    status: 'pending_review',
    priority: 'normal',
    created_at: '2026-02-01T10:00:00Z',
    updated_at: '2026-03-08T11:00:00Z',
    metadata: {
      next_action: 'Validation du projet d\'accord par la direction',
      next_deadline: '2026-04-01T00:00:00Z',
    },
  },
  {
    id: 'dossier-006',
    company_id: 'demo-company-001',
    created_by: 'demo-user-001',
    title: 'Renouvellement accord télétravail',
    description: 'Négociation du renouvellement de l\'accord télétravail expirant le 25 avril 2026. Intégration des nouvelles pratiques post-Covid et du droit à la déconnexion.',
    type: 'general',
    status: 'open',
    priority: 'normal',
    created_at: '2026-03-09T10:00:00Z',
    updated_at: '2026-03-09T10:00:00Z',
    metadata: {
      expiration_date: '2026-04-25T00:00:00Z',
      next_action: 'Ouverture des négociations avec le CSE',
    },
  },
];

// ==========================================
// DOSSIER DETAIL - Events for each dossier
// ==========================================
const EVENTS_DOSSIER_001: DossierEvent[] = [
  {
    id: 'evt-001-1',
    dossier_id: 'dossier-001',
    user_id: 'demo-user-001',
    type: 'created',
    title: 'Dossier créé',
    description: 'Ouverture du dossier de licenciement pour insuffisance professionnelle.',
    created_at: '2026-02-15T09:00:00Z',
  },
  {
    id: 'evt-001-2',
    dossier_id: 'dossier-001',
    type: 'note',
    title: 'Éléments factuels rassemblés',
    description: 'Objectifs non atteints sur 3 trimestres consécutifs. Courriels d\'alertes du manager. Plan d\'accompagnement mis en place le 15/09/2025 sans amélioration.',
    created_at: '2026-02-18T14:00:00Z',
  },
  {
    id: 'evt-001-3',
    dossier_id: 'dossier-001',
    type: 'document_linked',
    title: 'Lettre de convocation entretien préalable',
    description: 'Lettre LRAR envoyée le 25/02/2026. Entretien fixé au 05/03/2026 à 14h.',
    created_at: '2026-02-25T10:00:00Z',
  },
  {
    id: 'evt-001-4',
    dossier_id: 'dossier-001',
    type: 'note',
    title: 'Compte rendu entretien préalable',
    description: 'Entretien réalisé le 05/03. Salarié accompagné d\'un conseiller du salarié. Explications données sur les manquements. Le salarié conteste les évaluations.',
    created_at: '2026-03-05T16:00:00Z',
  },
  {
    id: 'evt-001-5',
    dossier_id: 'dossier-001',
    type: 'status_change',
    title: 'Statut → En cours',
    description: 'Rédaction de la lettre de licenciement en cours. Délai de réflexion de 2 jours ouvrables respecté.',
    created_at: '2026-03-07T09:00:00Z',
  },
  {
    id: 'evt-001-6',
    dossier_id: 'dossier-001',
    type: 'note',
    title: 'Calcul indemnité de licenciement',
    description: 'Indemnité légale : 1/4 mois par année d\'ancienneté = 6 × (4 200 × 1/4) = 6 300€. Convention Syntec plus favorable : 1/3 mois = 8 400€. Retenu : 8 400€ (conventionnel).',
    created_at: '2026-03-10T11:00:00Z',
  },
];

const EVENTS_DOSSIER_003: DossierEvent[] = [
  {
    id: 'evt-003-1',
    dossier_id: 'dossier-003',
    type: 'created',
    title: 'Dossier créé',
    description: 'Réception de la convocation devant le CPH de Paris. Requête d\'A. Moreau pour licenciement abusif.',
    created_at: '2026-01-20T09:00:00Z',
  },
  {
    id: 'evt-003-2',
    dossier_id: 'dossier-003',
    type: 'note',
    title: 'Analyse de la demande adverse',
    description: 'Demandes : 30 000€ licenciement sans CRS (barème Macron : 3 à 15,5 mois) + 15 000€ rappel heures sup. Risque évalué à moyen. Points faibles : procédure respectée, motif documenté. Point de vigilance : heures supplémentaires non contractualisées.',
    created_at: '2026-01-25T14:00:00Z',
  },
  {
    id: 'evt-003-3',
    dossier_id: 'dossier-003',
    type: 'document_linked',
    title: 'Pièces du dossier assemblées',
    description: '23 pièces : contrat de travail, avenants, évaluations annuelles, mails de recadrage, attestation Pôle emploi, bulletins de paie.',
    created_at: '2026-02-10T10:00:00Z',
  },
  {
    id: 'evt-003-4',
    dossier_id: 'dossier-003',
    type: 'note',
    title: 'Stratégie de défense définie',
    description: 'Axe principal : insuffisance de résultats documentée. Axe secondaire : contestation du calcul des heures sup (forfait jours valide). Jurisprudence favorable identifiée : Cass. soc. 18 nov. 2025, n°23-22.456.',
    created_at: '2026-02-20T16:00:00Z',
  },
  {
    id: 'evt-003-5',
    dossier_id: 'dossier-003',
    type: 'note',
    title: 'Proposition de transaction étudiée',
    description: 'Calcul : risque contentieux × probabilité = 22 500€. Proposition de transaction à 15 000€ net. Régime fiscal et social analysé. Attente décision de la direction.',
    created_at: '2026-03-05T11:00:00Z',
  },
];

export const MOCK_DOSSIER_DETAILS: Record<string, DossierDetail> = {
  'dossier-001': {
    ...MOCK_DOSSIERS[0],
    events: EVENTS_DOSSIER_001,
    conversations: [
      { id: 'conv-001', title: 'Analyse motif licenciement Dupont', created_at: '2026-02-16T10:00:00Z' },
      { id: 'conv-002', title: 'Calcul indemnités licenciement Syntec', created_at: '2026-03-10T09:00:00Z' },
    ],
    documents: [
      { id: 'doc-001', name: 'Lettre convocation entretien préalable.pdf', created_at: '2026-02-25T10:00:00Z' },
      { id: 'doc-002', name: 'Compte rendu entretien préalable.pdf', created_at: '2026-03-05T17:00:00Z' },
      { id: 'doc-003', name: 'Projet lettre licenciement.docx', created_at: '2026-03-10T14:00:00Z' },
    ],
  },
  'dossier-002': {
    ...MOCK_DOSSIERS[1],
    events: [
      { id: 'evt-002-1', dossier_id: 'dossier-002', type: 'created', title: 'Dossier créé', description: 'Demande de rupture conventionnelle initiée par la salariée.', created_at: '2026-03-01T10:00:00Z' },
      { id: 'evt-002-2', dossier_id: 'dossier-002', type: 'note', title: 'Calcul indemnité spécifique', description: 'Indemnité légale : 4 388€. Indemnité négociée proposée : 8 750€ (2 mois de salaire). Dans les limites d\'exonération fiscale et sociale.', created_at: '2026-03-05T10:00:00Z' },
      { id: 'evt-002-3', dossier_id: 'dossier-002', type: 'document_linked', title: 'CERFA rupture conventionnelle préparé', description: 'Formulaire pré-rempli avec les dates d\'entretiens et le montant négocié.', created_at: '2026-03-08T14:00:00Z' },
    ],
    conversations: [{ id: 'conv-003', title: 'Simulation rupture conventionnelle Leclerc', created_at: '2026-03-02T10:00:00Z' }],
    documents: [
      { id: 'doc-004', name: 'CERFA rupture conventionnelle.pdf', created_at: '2026-03-08T14:00:00Z' },
      { id: 'doc-005', name: 'Simulation indemnités.xlsx', created_at: '2026-03-05T10:00:00Z' },
    ],
  },
  'dossier-003': {
    ...MOCK_DOSSIERS[2],
    events: EVENTS_DOSSIER_003,
    conversations: [
      { id: 'conv-004', title: 'Analyse risque contentieux Moreau', created_at: '2026-01-22T10:00:00Z' },
      { id: 'conv-005', title: 'Recherche jurisprudence forfait jours', created_at: '2026-02-15T14:00:00Z' },
    ],
    documents: [
      { id: 'doc-006', name: 'Requête adverse CPH.pdf', created_at: '2026-01-20T09:00:00Z' },
      { id: 'doc-007', name: 'Bordereau de pièces.pdf', created_at: '2026-02-10T10:00:00Z' },
      { id: 'doc-008', name: 'Projet conclusions en défense.docx', created_at: '2026-03-01T16:00:00Z' },
    ],
  },
  'dossier-004': {
    ...MOCK_DOSSIERS[3],
    events: [
      { id: 'evt-004-1', dossier_id: 'dossier-004', type: 'created', title: 'Dossier créé', description: 'Audit déclenché suite à la jurisprudence Cass. soc. 10 mars 2026 sur les forfaits jours.', created_at: '2026-03-11T09:00:00Z' },
    ],
    conversations: [],
    documents: [],
  },
  'dossier-005': {
    ...MOCK_DOSSIERS[4],
    events: [
      { id: 'evt-005-1', dossier_id: 'dossier-005', type: 'created', title: 'Dossier créé', description: 'Lancement du projet d\'accord d\'intéressement 2026.', created_at: '2026-02-01T10:00:00Z' },
      { id: 'evt-005-2', dossier_id: 'dossier-005', type: 'document_linked', title: 'Projet d\'accord rédigé', description: 'Accord d\'intéressement basé sur les résultats d\'exploitation et la satisfaction client.', created_at: '2026-02-20T14:00:00Z' },
      { id: 'evt-005-3', dossier_id: 'dossier-005', type: 'status_change', title: 'Statut → En attente de validation', description: 'Le projet d\'accord est soumis à la direction pour validation avant présentation au CSE.', created_at: '2026-03-08T11:00:00Z' },
    ],
    conversations: [{ id: 'conv-006', title: 'Clauses accord intéressement Syntec', created_at: '2026-02-05T10:00:00Z' }],
    documents: [{ id: 'doc-009', name: 'Projet accord intéressement 2026.docx', created_at: '2026-02-20T14:00:00Z' }],
  },
  'dossier-006': {
    ...MOCK_DOSSIERS[5],
    events: [
      { id: 'evt-006-1', dossier_id: 'dossier-006', type: 'created', title: 'Dossier créé', description: 'Renouvellement de l\'accord télétravail avant expiration le 25/04/2026.', created_at: '2026-03-09T10:00:00Z' },
    ],
    conversations: [],
    documents: [],
  },
};

// ==========================================
// COMPLIANCE SCORE - Santé sociale entreprise
// ==========================================
export interface ComplianceItem {
  id: string;
  label: string;
  status: 'ok' | 'warning' | 'critical';
  detail: string;
  action?: string;
}

export const MOCK_COMPLIANCE: ComplianceItem[] = [
  { id: 'comp-01', label: 'Contrats de travail', status: 'ok', detail: '47/47 conformes' },
  { id: 'comp-02', label: 'Conventions forfait jours', status: 'critical', detail: '12 conventions à revoir', action: 'Voir dossier audit' },
  { id: 'comp-03', label: 'Entretiens professionnels', status: 'critical', detail: '5 en retard sur 47', action: 'Planifier les entretiens' },
  { id: 'comp-04', label: 'Affichages obligatoires', status: 'ok', detail: 'À jour' },
  { id: 'comp-05', label: 'Document unique (DUERP)', status: 'warning', detail: 'Dernière mise à jour : sept. 2025', action: 'Mettre à jour' },
  { id: 'comp-06', label: 'Registre du personnel', status: 'ok', detail: 'À jour' },
  { id: 'comp-07', label: 'Accord télétravail', status: 'warning', detail: 'Expire dans 45 jours', action: 'Renouveler' },
  { id: 'comp-08', label: 'Élections CSE', status: 'ok', detail: 'Prochain renouvellement : juin 2027' },
  { id: 'comp-09', label: 'Minima conventionnels Syntec', status: 'warning', detail: '8 salariés sous les nouveaux minima', action: 'Régulariser' },
  { id: 'comp-10', label: 'Mutuelle / Prévoyance', status: 'ok', detail: 'Conforme' },
];

// ==========================================
// UPCOMING DEADLINES - Calendrier RH
// ==========================================
export interface Deadline {
  id: string;
  date: string;
  title: string;
  type: 'legal' | 'dossier' | 'ccn' | 'internal';
  urgent: boolean;
  dossierId?: string;
}

export const MOCK_DEADLINES: Deadline[] = [
  { id: 'dl-01', date: '2026-03-19', title: 'Envoi lettre licenciement Dupont (délai 2j ouvrés)', type: 'dossier', urgent: true, dossierId: 'dossier-001' },
  { id: 'dl-02', date: '2026-03-25', title: 'Signature CERFA rupture conv. Leclerc', type: 'dossier', urgent: false, dossierId: 'dossier-002' },
  { id: 'dl-03', date: '2026-03-31', title: 'DSN événementielle - fin de contrat Dupont', type: 'legal', urgent: false },
  { id: 'dl-04', date: '2026-04-01', title: 'Validation accord intéressement par la direction', type: 'internal', urgent: false, dossierId: 'dossier-005' },
  { id: 'dl-05', date: '2026-04-15', title: 'Conclusions en défense CPH Moreau', type: 'dossier', urgent: true, dossierId: 'dossier-003' },
  { id: 'dl-06', date: '2026-04-15', title: 'Mise à jour BDESE', type: 'legal', urgent: false },
  { id: 'dl-07', date: '2026-04-25', title: 'Expiration accord télétravail', type: 'ccn', urgent: true, dossierId: 'dossier-006' },
  { id: 'dl-08', date: '2026-04-30', title: 'Entretiens professionnels (5 en retard)', type: 'legal', urgent: true },
  { id: 'dl-09', date: '2026-05-05', title: 'DSN mensuelle avril 2026', type: 'legal', urgent: false },
  { id: 'dl-10', date: '2026-05-20', title: 'Audience BCO - CPH Paris (Moreau)', type: 'dossier', urgent: true, dossierId: 'dossier-003' },
];

// ==========================================
// COMPANY HEALTH SCORE CALCULATION
// ==========================================
export function calculateHealthScore(compliance: ComplianceItem[]): number {
  const weights = { ok: 1, warning: 0.5, critical: 0 };
  const total = compliance.length;
  const score = compliance.reduce((acc, item) => acc + weights[item.status], 0);
  return Math.round((score / total) * 100);
}
