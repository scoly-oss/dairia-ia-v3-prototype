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

export const PrivacyPolicy: React.FC = () => {
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
            Politique de Confidentialité
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
            Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
          </Typography>

          <Divider sx={{ mb: 4, borderColor: 'rgba(255, 255, 255, 0.1)' }} />

          <Box sx={{ '& > *': { mb: 4 } }}>
            <Box>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
                1. Responsable du traitement
              </Typography>
              <Typography variant="body1" paragraph sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                La société <strong>GO</strong>, société par actions simplifiée, enregistrée au registre du commerce et des sociétés sous le numéro n° 934 557 455, ayant son siège social situé 65 Rue Jacques-louis Hénon – 69004 Lyon, représentée par Monsieur Sofiane COLY (ci-après « GO » ou la « Société »), est responsable du traitement de vos données personnelles dans le cadre de l'utilisation de la plateforme <strong>DAIRIA IA</strong>.
              </Typography>
            </Box>

            <Box>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
                2. Données personnelles collectées
              </Typography>
              <Typography variant="body1" paragraph sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                GO est susceptible de traiter les données personnelles suivantes dans le cadre de l'exécution des services :
              </Typography>
              <Box component="ul" sx={{ color: 'text.secondary', pl: 4, lineHeight: 1.8 }}>
                <li>Noms et prénoms</li>
                <li>Adresse email</li>
                <li>Adresse postale</li>
                <li>Numéro de téléphone</li>
                <li>Données relatives à l'utilisation du logiciel (historique des conversations, documents téléversés)</li>
                <li>Données de paiement (traitées par nos partenaires de paiement sécurisés)</li>
              </Box>
            </Box>

            <Box>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
                3. Finalités du traitement
              </Typography>
              <Typography variant="body1" paragraph sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                Les données personnelles sont collectées uniquement aux fins d'organisation et d'exécution des services, notamment :
              </Typography>
              <Box component="ul" sx={{ color: 'text.secondary', pl: 4, lineHeight: 1.8 }}>
                <li>Gestion de votre compte utilisateur</li>
                <li>Fourniture des services du logiciel DAIRIA IA</li>
                <li>Traitement de vos demandes et questions juridiques</li>
                <li>Gestion des paiements et de la facturation</li>
                <li>Amélioration de nos services</li>
                <li>Communication relative aux services (support technique, mises à jour)</li>
              </Box>
              <Typography variant="body1" paragraph sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                Sauf autorisation préalable de votre part, vos données personnelles ne seront pas utilisées à d'autres fins (ex : envoi de newsletters et promotion de produits ou services analogues).
              </Typography>
            </Box>

            <Box>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
                4. Destinataires des données
              </Typography>
              <Typography variant="body1" paragraph sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                GO est la seule destinataire directe de vos données. Toutefois, certaines données peuvent être transmises à nos partenaires ou prestataires, sous-traitants au sens du RGPD, notamment :
              </Typography>
              <Box component="ul" sx={{ color: 'text.secondary', pl: 4, lineHeight: 1.8 }}>
                <li>Prestataires de services de paiement sécurisé</li>
                <li>Prestataires d'hébergement (Amazon Web Services)</li>
                <li>Prestataires de services d'intelligence artificielle (OpenAI)</li>
                <li>Prestataires techniques nécessaires à l'exécution du service</li>
              </Box>
            </Box>

            <Box>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
                5. Transferts internationaux
              </Typography>
              <Typography variant="body1" paragraph sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                En cas de transfert de données auprès d'un partenaire situé hors de l'Union Européenne, GO s'assure que ses partenaires disposent de clauses contractuelles types telles qu'établies par la Commission européenne ou que des garanties appropriées sont prises conformément à l'article 46 du RGPD.
              </Typography>
            </Box>

            <Box>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
                6. Durée de conservation
              </Typography>
              <Typography variant="body1" paragraph sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                Vos données sont conservées pendant la durée du contrat entre vous et GO, puis pendant la durée minimum de conservation des documents commerciaux imposée par la législation en vigueur.
              </Typography>
            </Box>

            <Box>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
                7. Sécurité des données
              </Typography>
              <Typography variant="body1" paragraph sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                GO met en place, dans le cadre d'une démarche de mise en conformité avec la réglementation, les moyens techniques et organisationnels permettant d'assurer la sécurité de vos données.
              </Typography>
              <Typography variant="body1" paragraph sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                <strong>Hébergement des données</strong> : Conformément au RGPD, votre base de données est hébergée en France, sur les serveurs Supabase situés à Paris. Les fichiers sont stockés sur les serveurs AWS en Europe.
              </Typography>
              <Typography variant="body1" paragraph sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                <strong>Chiffrement</strong> : Vos données sont chiffrées au repos (AES-256) et en transit (TLS).
              </Typography>
              <Typography variant="body1" paragraph sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                <strong>Mises à jour de sécurité</strong> : Le code de la plateforme DAIRIA IA fait l'objet de mises à jour régulières afin de corriger les failles de sécurité identifiées dans les dépendances logicielles (packages). Une veille active est assurée sur les vulnérabilités de sécurité.
              </Typography>
              <Typography variant="body1" paragraph sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                <strong>Authentification des intervenants</strong> : L'ensemble des collaborateurs de GO disposant d'un accès aux environnements de production sont soumis à une authentification multi-facteurs (MFA).
              </Typography>
              <Typography variant="body1" paragraph sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                <strong>Encadrement des accès aux documents clients</strong> :
              </Typography>
              <Box component="ul" sx={{ color: 'text.secondary', pl: 4, lineHeight: 1.8 }}>
                <li><strong>Cloisonnement logique</strong> : L'architecture multi-tenant de la plateforme garantit une isolation stricte des données entre clients. Les documents téléversés par un client ne sont jamais accessibles par un autre client.</li>
                <li><strong>Contrôle d'accès interne</strong> : L'accès aux espaces de stockage S3 par les collaborateurs de GO SAS est strictement encadré par des politiques d'accès limitées et tracées, prévenant toute consultation ou fuite de documents confidentiels de clients.</li>
              </Box>
              <Typography variant="body1" paragraph sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                GO s'engage à ne pas entraîner, réentraîner ou faire du fine-tuning de modèle d'intelligence artificielle avec vos données et documents.
              </Typography>
            </Box>

            <Box>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
                8. Vos droits
              </Typography>
              <Typography variant="body1" paragraph sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                Conformément à la loi informatique et libertés du 6 janvier 1978 ainsi qu'au Règlement UE général sur la protection des données personnelles n°2016-679 du 27 avril 2016, vous disposez des droits suivants :
              </Typography>
              <Box component="ul" sx={{ color: 'text.secondary', pl: 4, lineHeight: 1.8 }}>
                <li><strong>Droit d'accès</strong> : obtenir une copie de vos données personnelles</li>
                <li><strong>Droit de rectification</strong> : corriger vos données inexactes ou incomplètes</li>
                <li><strong>Droit de suppression</strong> : demander l'effacement de vos données</li>
                <li><strong>Droit de limitation</strong> : limiter le traitement de vos données</li>
                <li><strong>Droit d'opposition</strong> : vous opposer au traitement de vos données</li>
                <li><strong>Droit à la portabilité</strong> : recevoir vos données dans un format structuré</li>
              </Box>
              <Typography variant="body1" paragraph sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                Pour exercer ces droits, vous pouvez nous contacter à l'adresse email suivante : <Link href="mailto:contact@dairia-avocats.com" sx={{ color: '#fe904d' }}>contact@dairia-avocats.com</Link>
              </Typography>
            </Box>

            <Box>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
                9. Réclamation auprès de la CNIL
              </Typography>
              <Typography variant="body1" paragraph sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                Vous avez le droit d'introduire une plainte auprès de la Commission Nationale de l'Informatique et des Libertés (CNIL) si vous estimez que le traitement de vos données personnelles constitue une violation de la réglementation applicable.
              </Typography>
              <Typography variant="body1" paragraph sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                CNIL - 3 Place de Fontenoy - TSA 80715 - 75334 PARIS CEDEX 07<br />
                Téléphone : 01 53 73 22 22<br />
                Site web : <Link href="https://www.cnil.fr" target="_blank" rel="noopener" sx={{ color: '#fe904d' }}>www.cnil.fr</Link>
              </Typography>
            </Box>

            <Box>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
                10. Cookies
              </Typography>
              <Typography variant="body1" paragraph sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                Notre site utilise des cookies techniques nécessaires au fonctionnement de la plateforme et à votre authentification. Ces cookies sont indispensables à la fourniture des services et ne nécessitent pas de consentement préalable.
              </Typography>
            </Box>

            <Box>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
                11. Modifications de la politique de confidentialité
              </Typography>
              <Typography variant="body1" paragraph sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                GO se réserve le droit de modifier cette politique de confidentialité à tout moment. Toute modification sera communiquée aux utilisateurs par email ou via une notification sur la plateforme.
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

export default PrivacyPolicy;
