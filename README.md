# Max Bara

## Étape 1 · Fondations

Node.js 22.18 ou plus récent, Next.js, TypeScript, Tailwind CSS et Postgres (Supabase).

```sh
npm ci
npm test
npm run build
npm run dev
```

## Étape 2 · Site public

La page française est à `/` et la version anglaise à `/en`. Le formulaire gratuit demande la forme juridique, le capital, le secteur, le forfait, l’adresse, le mode de signature et le besoin d’un code import-export. Le serveur calcule le devis et les réponses restent dans l’URL pour retrouver le résultat ou changer de langue.

Vérifier le devis Essentiel avec les réponses par défaut (149 000 FCFA), puis sélectionner le code import-export (179 000 FCFA). Avec la domiciliation, le notaire et le code import-export, le total est de 500 600 FCFA. Pour une autre forme juridique ou un autre capital, le résultat demande une étude tarifaire. « Commencer » ouvre le parcours de création d’un dossier.

### Base de démonstration

Avec Docker et une [CLI Supabase](https://supabase.com/docs/guides/local-development) disponibles, démarrer une base locale neuve et charger les données de démonstration.

```sh
npx supabase start
cp .env.example .env.local
npm run db:seed
```

Sur une base locale déjà démarrée, appliquer la migration avec `npx supabase migration up --local` avant le peuplement. Le script charge les trois dossiers et leurs devis dans une transaction, avec des identifiants fixes pour permettre plusieurs exécutions. Utiliser une base de développement pour les données de démonstration.

```sql
select c.reference, c.status, q.total_fcfa, q.requires_verification
from public.cases c
join public.quotes q on q.case_id = c.id
where c.reference like 'MB-DEMO-%'
order by c.reference;
```

| Référence | Statut | Total FCFA |
| --- | --- | ---: |
| MB-DEMO-001 | draft | 149 000 |
| MB-DEMO-002 | submitted | 479 000 |
| MB-DEMO-003 | delivered | 450 000 |

Les sept tables utilisent la sécurité au niveau des lignes. Les rôles navigateur `anon` et `authenticated` ont zéro accès direct aux tables à cette étape.

### Hypothèses tarifaires

- La grille couvre la SARL à 1 000 000 FCFA de capital. Les autres scénarios nécessitent une étude tarifaire.
- Les forfaits incluent les frais de constitution du scénario. La domiciliation de 12 mois s’ajoute en cas d’absence d’adresse, et le notaire s’ajoute uniquement sur sélection. Le calcul utilise par défaut des statuts sous seing privé.
- Agrément est une estimation à partir de 750 000 FCFA. Un montant propre au secteur nécessite une vérification.
- La date renseigne le jour de consultation des sources tarifaires. Le GUFE (RCCM et dépôt au greffe), le code import-export et la publication en ligne correspondent à la grille CEPICI consultée. Les autres montants du cahier des charges sont provisoires et portent `verifiedOn: null`. Les devis conservent cette information pour le badge « A VERIFIER » de l’étape 4. [Grille CEPICI pour la SARL](https://www.cepici.gouv.ci/public/frontend/assets/document/doc3/liste-des-pieces-a-fournir-sarl-capital-inf-a-10-000-000-f-cfa.pdf)

## Étape 3 · Dossiers clients

Appliquer les migrations Supabase, puis renseigner les quatre variables de `.env.example` dans `.env.local`. Utiliser la clé publiable pour Auth et conserver la clé secrète ou `service_role` côté serveur pour le stockage privé. Pour Vercel, renseigner ces variables dans le projet avant la compilation et utiliser une connexion Supabase Postgres adaptée aux fonctions serveur.

Activer le fournisseur Phone et configurer le prestataire SMS dans Supabase Auth. Pour tester sans SMS sur une base locale, suivre [la procédure OTP de test de Supabase](https://supabase.com/docs/guides/auth/testing-auth-flows). Configurer un numéro ivoirien de test au format `225` suivi de dix chiffres. Réserver les codes fixes à la configuration locale. La migration crée le bucket privé `case-documents`.

1. Depuis un devis SARL, cliquer sur « Commencer », vérifier le numéro puis renseigner la société. La page du dossier conserve le devis calculé côté serveur.
2. Ajouter les pièces applicables, une à la fois. Les fichiers restent privés. Le dossier transmis est reçu par Max Bara pour examen. La date affichée reste « À confirmer » jusqu’à ce qu’une date soit enregistrée.
3. Enregistrer le mode de paiement. Orange Money, MTN MoMo, Wave et carte sont des choix sans débit. Après un paiement hors ligne, un opérateur peut confirmer un paiement manuel depuis l’URL du dossier.
4. Pour tester la confirmation manuelle, utiliser un second compte et attribuer le rôle `admin` à son profil côté base. Pour un compte ayant déjà créé un dossier, exécuter `update public.users set role = 'admin' where auth_user_id = '<UUID Auth de l’opérateur>';`. Le statut payé peut être remis en attente depuis la même page.

La checklist couvre la SARL chiffrée par le simulateur. Elle distingue les statuts sous seing privé et notariés et ajoute les pièces d’après les situations renseignées. Pour la domiciliation Max Bara, le contrat peut être ajouté s’il est déjà disponible. Chaque document est examiné par l’équipe après transmission. [Liste du CEPICI](https://www.cepici.gouv.ci/public/frontend/assets/document/doc3/liste-des-pieces-a-fournir-sarl-capital-inf-a-10-000-000-f-cfa.pdf)

## Étape 4 · Administration

Appliquer la migration `20261119000200_admin.sql`. Se connecter avec un compte opérateur et ouvrir `/admin` ou suivre le lien « Administration » depuis « Mes dossiers ». La page anglaise est à `/en/admin`. Le rôle `admin` reste géré en base, selon la procédure de l’étape 3.

- Filtrer par société ou référence, statut ou échéance. Les deux compteurs affichent les dossiers ouverts et en retard.
- Les deux délais internes partent de la transmission à Max Bara. La première revue se clôture avec « Marquer la revue terminée » et la livraison avec le statut « Livré ». Un retour en brouillon efface les délais de cette transmission. La date prévue et la prochaine étape apparaissent dans l’espace client après enregistrement.
- Les notes internes, les documents privés, la marge brute estimée et les badges « A VERIFIER » sont accessibles depuis l’administration. La marge correspond au dernier devis moins le coût plancher enregistré avec ce devis. Les pièces PDF, JPEG, PNG et WebP s’ouvrent dans le navigateur. Les autres pièces peuvent être téléchargées.
