import React from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Divider,
  Link
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

export const TermsOfService: React.FC = () => {
  return (
    <Box
      sx={{
        width: '100%',
        minHeight: '100vh',
        backgroundColor: '#111318',
        py: 8
      }}
    >
      <Container maxWidth="md">
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 5 },
            borderRadius: 4,
            background: 'rgba(30, 32, 38, 0.5)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <Typography
            variant="h3"
            component="h1"
            gutterBottom
            sx={{
              fontWeight: 700,
              background: 'linear-gradient(to right, #fe904d 0%, #ff914c 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 4
            }}
          >
            Conditions Générales de Services
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
            Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
          </Typography>

          <Divider sx={{ mb: 4, borderColor: 'rgba(255, 255, 255, 0.1)' }} />

          <Box sx={{ '& > *': { mb: 4 } }}>
            {/* Préambule */}
            <Box>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
                Préambule
              </Typography>
              <Typography variant="body1" paragraph sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                La société <strong>GO</strong>, société par actions simplifiée, enregistrée au registre du commerce et des sociétés sous le numéro n° 934 557 455, ayant son siège social situé 65 Rue Jacques-louis Hénon – 69004 Lyon, représentée par Monsieur Sofiane COLY (ci-après désignée « GO » ou la « Société »), fournit une plateforme web disponible au nom de domaine <Link href="https://ia.dairia-avocats.com/" target="_blank" sx={{ color: '#fe904d' }}>https://ia.dairia-avocats.com/</Link> incluant les services d'un assistant numérique intelligent, sous la forme d'un logiciel en mode Software as a Service (SaaS).
              </Typography>
              <Typography variant="body1" paragraph sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                Ce logiciel permet de générer des réponses juridiques aux questions courantes en droit du travail, de la sécurité sociale et de la paie, au moyen d'une interface conversationnelle automatisée reposant sur l'intelligence artificielle (ci-après le « Logiciel »).
              </Typography>
              <Typography variant="body1" paragraph sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                Le Logiciel est mis à disposition sous l'appellation <strong>« DAIRIA IA »</strong>, marque légalement exploitée par la Société.
              </Typography>
            </Box>

            {/* Article 1 */}
            <Box>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
                Article 1 - Souscription et Services
              </Typography>

              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'text.primary', mt: 2 }}>
                1.1 Commande des Services
              </Typography>
              <Typography variant="body1" paragraph sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                Toute commande de services s'effectue exclusivement sur le site du Logiciel. Le Client doit créer un compte utilisateur en renseignant son adresse email. La communication de ces informations est collectée et conservée selon les modalités détaillées dans la <Link component={RouterLink} to="/privacy-policy" sx={{ color: '#fe904d' }}>Politique de Confidentialité</Link>.
              </Typography>

              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'text.primary', mt: 2 }}>
                1.2 Offre d'essai
              </Typography>
              <Typography variant="body1" paragraph sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                Au moment de la création de son compte, le Client bénéficie automatiquement, à titre gratuit et non renouvelable, d'une période d'essai de sept (7) jours avec un usage illimité des fonctionnalités du Logiciel.
              </Typography>
              <Typography variant="body1" paragraph sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                GO se réserve le droit de limiter l'accès à certains services dans le cadre de l'offre d'essai.
              </Typography>

              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'text.primary', mt: 2 }}>
                1.3 Formules disponibles
              </Typography>
              <Typography variant="body1" paragraph sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                Le Logiciel est disponible via deux formules :
              </Typography>
              <Box component="ul" sx={{ color: 'text.secondary', pl: 4, lineHeight: 1.8 }}>
                <li><strong>Abonnement mensuel</strong> : formule récurrente avec tarif réduit, souscrite pour une période initiale de douze (12) mois sans durée minimale d'engagement obligatoire. Le contrat se renouvelle tacitement pour des périodes d'un (1) mois jusqu'à résiliation par le Client.</li>
                <li><strong>Formule Prépayée</strong> : utilisation ponctuelle du Logiciel par achat de Tokens à la demande.</li>
              </Box>

              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'text.primary', mt: 2 }}>
                1.4 Services du Logiciel
              </Typography>
              <Typography variant="body1" paragraph sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                Le Logiciel comprend :
              </Typography>
              <Box component="ul" sx={{ color: 'text.secondary', pl: 4, lineHeight: 1.8 }}>
                <li>Un droit d'utilisation du Logiciel selon les fonctionnalités décrites</li>
                <li>Un chatbot juridique basé sur l'intelligence artificielle permettant de poser des questions en langage naturel</li>
                <li>Les services d'hébergement des données (via Amazon Web Services)</li>
                <li>Les services d'assistance et de maintenance</li>
                <li>Une fonctionnalité d'achat ponctuel de Tokens</li>
                <li>Une fonctionnalité de consultation d'un avocat (sous réserve de disponibilité et d'honoraires)</li>
                <li>Une fonctionnalité de base de données et documents (pour l'Abonnement uniquement)</li>
              </Box>
            </Box>

            {/* Article 2 */}
            <Box>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
                Article 2 - Accès au Logiciel
              </Typography>

              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'text.primary', mt: 2 }}>
                2.1 Licence d'utilisation
              </Typography>
              <Typography variant="body1" paragraph sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                En contrepartie du paiement du prix, GO concède au Client à titre personnel, non-exclusif, non-transférable, non-sous-licenciable et non cessible, une licence d'utilisation du Logiciel pour la durée du contrat dans le monde entier. La licence est personnelle et nominative.
              </Typography>

              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'text.primary', mt: 2 }}>
                2.2 Modalités d'accès
              </Typography>
              <Typography variant="body1" paragraph sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                L'accès au Logiciel s'effectue par l'interface web accessible à l'adresse <Link href="https://ia.dairia-avocats.com/" target="_blank" sx={{ color: '#fe904d' }}>https://ia.dairia-avocats.com/</Link> et par la connexion au compte Client. Le Client est seul et totalement responsable de l'utilisation et de la confidentialité de ses identifiants.
              </Typography>

              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'text.primary', mt: 2 }}>
                2.3 Disponibilité
              </Typography>
              <Typography variant="body1" paragraph sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                GO s'engage à rendre le Logiciel accessible 24h/24 et 7j/7, à l'exception des périodes de maintenance. Le Client sera prévenu des périodes de maintenance en amont, sauf cas de force majeure. GO ne peut être tenu responsable des difficultés d'accès liées aux perturbations du réseau Internet ou aux limitations des prestataires tiers (AWS, OpenAI).
              </Typography>

              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'text.primary', mt: 2 }}>
                2.4 Prérequis techniques
              </Typography>
              <Typography variant="body1" paragraph sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                Le Client s'engage à disposer d'un abonnement Internet fonctionnel, d'équipements mis à jour régulièrement, et d'un ordinateur avec configuration minimale du système d'exploitation Windows ou Mac OS.
              </Typography>

              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'text.primary', mt: 2 }}>
                2.5 Assistance
              </Typography>
              <Typography variant="body1" paragraph sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                Une assistance Client est disponible via la FAQ du site et par email. Les problèmes liés à l'accès Internet ou à la configuration des équipements du Client ne sont pas couverts par l'assistance.
              </Typography>
            </Box>

            {/* Article 3 */}
            <Box>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
                Article 3 - Prix et Paiement
              </Typography>

              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'text.primary', mt: 2 }}>
                3.1 Tarification
              </Typography>
              <Typography variant="body1" paragraph sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                Le prix des services est facturé selon la formule choisie. Pour l'Abonnement, le règlement intervient mensuellement à date d'anniversaire de la souscription. Pour la Formule Prépayée, le règlement intervient à la commande de Tokens.
              </Typography>

              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'text.primary', mt: 2 }}>
                3.2 Modalités de paiement
              </Typography>
              <Typography variant="body1" paragraph sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                Les paiements sont sécurisés et traités par notre prestataire de paiement. Les prix s'entendent en euros toutes taxes comprises (TTC). Le prélèvement bancaire et le paiement par carte bancaire sont mis en œuvre par un prestataire de paiement sécurisé avec cryptage SSL.
              </Typography>

              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'text.primary', mt: 2 }}>
                3.3 Retard de paiement
              </Typography>
              <Typography variant="body1" paragraph sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                En cas de retard de paiement, des pénalités calculées à un taux égal au taux d'intérêt de la BCE majoré de 10 points de pourcentage pourront être appliquées, ainsi qu'une indemnité forfaitaire de 40€ pour frais de recouvrement.
              </Typography>

              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'text.primary', mt: 2 }}>
                3.4 Révision des prix
              </Typography>
              <Typography variant="body1" paragraph sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                Les prix des services sont révisés chaque 1er janvier. Toute modification du périmètre du Logiciel ou changement de formule peut entraîner une révision du prix.
              </Typography>
            </Box>

            {/* Article 4 */}
            <Box>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
                Article 4 - Obligations du Client
              </Typography>
              <Typography variant="body1" paragraph sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                Le Client s'engage à :
              </Typography>
              <Box component="ul" sx={{ color: 'text.secondary', pl: 4, lineHeight: 1.8 }}>
                <li>S'assurer de l'adéquation du Logiciel à ses besoins propres</li>
                <li>Fournir des informations sincères, exactes et véridiques</li>
                <li>Assurer la licéité et la conformité des contenus et documents intégrés</li>
                <li>Protéger la confidentialité de ses identifiants</li>
                <li>Utiliser le Logiciel conformément à sa destination et aux conditions générales</li>
                <li>Ne pas nuire à la réputation de GO</li>
                <li>Respecter les droits des tiers et les lois et règlements applicables</li>
                <li>Réaliser les sauvegardes nécessaires de ses données</li>
              </Box>
            </Box>

            {/* Article 5 */}
            <Box>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
                Article 5 - Obligations de GO
              </Typography>
              <Typography variant="body1" paragraph sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                GO s'engage à :
              </Typography>
              <Box component="ul" sx={{ color: 'text.secondary', pl: 4, lineHeight: 1.8 }}>
                <li>Respecter le caractère strictement confidentiel de tout document et données transmises</li>
                <li>Ne pas entraîner ou réentraîner de modèle d'intelligence artificielle avec les données du Client</li>
                <li>Souscrire une assurance responsabilité civile professionnelle</li>
                <li>Répondre aux demandes techniques du Client</li>
              </Box>
            </Box>

            {/* Article 6 */}
            <Box>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
                Article 6 - Propriété Intellectuelle
              </Typography>
              <Typography variant="body1" paragraph sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                Le contrat ne confère au Client aucun droit de propriété sur le Logiciel, l'infrastructure informatique, les bases de données, marques ou tout autre élément appartenant à GO. La mise à disposition temporaire du Logiciel ne constitue pas une cession de droits de propriété intellectuelle.
              </Typography>
              <Typography variant="body1" paragraph sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                Il est notamment interdit de procéder à toute reproduction, représentation, diffusion, commercialisation, modification, décompilation ou adaptation du Logiciel sans autorisation expresse de GO.
              </Typography>
              <Typography variant="body1" paragraph sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                Le Client est autorisé à utiliser les éléments et réponses générés par le Logiciel à des fins personnelles uniquement, toute utilisation commerciale étant interdite.
              </Typography>
            </Box>

            {/* Article 7 */}
            <Box>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
                Article 7 - Résiliation
              </Typography>
              <Typography variant="body1" paragraph sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                En cas de manquement par l'une des Parties à ses obligations contractuelles, le contrat pourra être résilié après mise en demeure restée infructueuse pendant 15 jours.
              </Typography>
              <Typography variant="body1" paragraph sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                Le Client peut résilier son Abonnement à tout moment via son compte personnel ou par lettre recommandée avec avis de réception. La résiliation sera effective à partir du mois suivant la réception de la notification.
              </Typography>
              <Typography variant="body1" paragraph sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                En cas de résiliation anticipée par faute du Client, celui-ci restera redevable de l'intégralité des sommes dues. Aucune restitution du prix payé ne sera réalisée.
              </Typography>
            </Box>

            {/* Article 8 */}
            <Box>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
                Article 8 - Droit de Rétractation (Consommateurs)
              </Typography>
              <Typography variant="body1" paragraph sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                Pour les Clients ayant souscrit à un Abonnement, ils bénéficient de la faculté d'annuler leur commande sans donner de motifs dans un délai de quatorze (14) jours à partir du lendemain de la conclusion du contrat.
              </Typography>
              <Typography variant="body1" paragraph sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                Pour la Formule Prépayée, le droit de rétractation ne s'applique pas aux prestations pleinement exécutées avant la fin du délai, lorsque leur exécution a commencé avec l'accord préalable exprès du Client.
              </Typography>
            </Box>

            {/* Article 9 */}
            <Box>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
                Article 9 - Responsabilité et Garanties
              </Typography>

              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'text.primary', mt: 2 }}>
                9.1 Garantie
              </Typography>
              <Typography variant="body1" paragraph sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                GO garantit la conformité du Logiciel aux normes françaises. Le Client bénéficie de la garantie légale de conformité et de la garantie légale relative aux défauts de la chose vendue.
              </Typography>
              <Typography variant="body1" paragraph sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                <strong>Important :</strong> Le Client reconnaît que GO ne garantit pas l'exactitude, la pertinence ou l'exhaustivité des données et réponses fournies par le Logiciel. Le Logiciel fournit des informations à titre indicatif et général qui ne constituent pas des recommandations juridiques professionnelles et ne sauraient se substituer à une consultation chez un professionnel assermenté du droit.
              </Typography>

              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'text.primary', mt: 2 }}>
                9.2 Limitation de responsabilité
              </Typography>
              <Typography variant="body1" paragraph sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                GO ne peut être tenu responsable des dommages indirects et immatériels, notamment les pertes de gains, de profits, de données, de chance, ou les dommages commerciaux.
              </Typography>
              <Typography variant="body1" paragraph sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                La responsabilité de GO est limitée au montant total du prix prévu au bon de commande pour l'utilisation du Logiciel.
              </Typography>
            </Box>

            {/* Article 10 */}
            <Box>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
                Article 10 - Force Majeure
              </Typography>
              <Typography variant="body1" paragraph sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                Les obligations des Parties seront suspendues en cas de survenance d'un événement de force majeure au sens de l'article 1218 du Code civil. Sont notamment considérés comme cas de force majeure : les guerres, attentats, épidémies, catastrophes naturelles, pannes d'électricité, et difficultés d'approvisionnement chez GO ou ses prestataires.
              </Typography>
            </Box>

            {/* Article 11 */}
            <Box>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
                Article 11 - Données Personnelles
              </Typography>
              <Typography variant="body1" paragraph sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                Le traitement de vos données personnelles est détaillé dans notre <Link component={RouterLink} to="/privacy-policy" sx={{ color: '#fe904d' }}>Politique de Confidentialité</Link>.
              </Typography>
            </Box>

            {/* Article 12 */}
            <Box>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
                Article 12 - Médiation et Litiges
              </Typography>
              <Typography variant="body1" paragraph sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                Tout litige entre GO et un Client consommateur peut faire l'objet d'une tentative de résolution amiable avant toute action judiciaire. Le consommateur doit préalablement contacter GO par écrit avec accusé de réception.
              </Typography>
              <Typography variant="body1" paragraph sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                En cas d'échec de la démarche amiable, le consommateur peut saisir le médiateur de la consommation. La procédure est gratuite pour le consommateur.
              </Typography>
              <Typography variant="body1" paragraph sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                Pour les Parties professionnelles, tout différend sera soumis aux juridictions compétentes de Lyon.
              </Typography>
            </Box>

            {/* Article 13 */}
            <Box>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
                Article 13 - Droit Applicable
              </Typography>
              <Typography variant="body1" paragraph sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                Les présentes conditions générales sont régies par le droit français.
              </Typography>
            </Box>

            {/* Avertissement */}
            <Box sx={{ mt: 6, p: 3, backgroundColor: 'rgba(255, 145, 76, 0.1)', borderRadius: 2, border: '1px solid rgba(255, 145, 76, 0.3)' }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: '#fe904d' }}>
                ⚠️ Avertissement Important
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                Le Logiciel DAIRIA IA fournit des informations juridiques à titre indicatif et ne constitue pas un conseil juridique personnalisé. Les réponses générées par l'intelligence artificielle ne remplacent pas l'avis d'un avocat professionnel. Pour des questions juridiques complexes ou nécessitant une analyse approfondie de votre situation personnelle, nous vous recommandons vivement de consulter un avocat qualifié.
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ my: 4, borderColor: 'rgba(255, 255, 255, 0.1)' }} />

          <Box sx={{ textAlign: 'center' }}>
            <Link
              component={RouterLink}
              to="/"
              sx={{
                color: '#fe904d',
                textDecoration: 'none',
                fontWeight: 600,
                '&:hover': {
                  opacity: 0.8
                }
              }}
            >
              ← Retour à l'accueil
            </Link>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default TermsOfService;
