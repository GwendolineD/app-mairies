-- Legal documents (CGU / Privacy Policy)
CREATE TABLE public.legal_documents (
  slug text PRIMARY KEY,
  title text NOT NULL,
  content_html text NOT NULL DEFAULT '',
  content_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  version integer NOT NULL DEFAULT 1,
  published_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY legal_documents_select ON public.legal_documents
  FOR SELECT USING (true);

CREATE POLICY legal_documents_update ON public.legal_documents
  FOR UPDATE USING (public.is_platform_admin());

CREATE POLICY legal_documents_insert ON public.legal_documents
  FOR INSERT WITH CHECK (public.is_platform_admin());

INSERT INTO public.legal_documents (slug, title, content_html, content_json, published_at)
VALUES
  ('cgu', 'Conditions Générales d''Utilisation', '<h1>CONDITIONS GÉNÉRALES D''UTILISATION</h1>
<p><strong>Tous Voisins</strong> — plateforme numérique de lien social et d''entraide</p>
<p>Mise à disposition par la Collectivité territoriale cliente</p>
<p><em>Version en vigueur à compter du 26 juin 2026</em></p>
<h2>ARTICLE 1 — OBJET</h2>
<p>Les présentes CGU ont pour objet de définir les modalités et conditions dans lesquelles Tous Voisins (ci-après « la Plateforme » ou « le Service »), édité par Gwendoline DUBOIS (entrepreneur individuel exerçant sous le nom commercial « Gwendoline DUBOIS Développement Web ») (ci-après « l''Éditeur ») et mis à la disposition de ses administrés, associations et commerces par toute collectivité territoriale cliente de la Plateforme (ci-après « la Commune »), est accessible et utilisé par ses Utilisateurs.</p>
<p>Parmi les Utilisateurs, les présentes CGU désignent par « Habitants » les personnes physiques résidant sur le territoire de la Commune ou y exerçant une activité à titre personnel, par opposition aux associations et aux commerces qui y sont établis.</p>
<p>La Plateforme permet notamment la publication d''annonces d''entraide, d''initiatives citoyennes et d''événements entre Utilisateurs, dans les conditions décrites à l''Article 4.</p>
<h2>ARTICLE 2 — ACCEPTATION DES CGU</h2>
<p>La création d''un compte sur la Plateforme implique l''acceptation pleine et entière des présentes CGU. L''Utilisateur qui n''accepte pas les CGU, en tout ou partie, doit s''abstenir de créer un compte et d''utiliser la Plateforme.</p>
<p>Les CGU applicables sont celles en vigueur à la date d''utilisation de la Plateforme. Elles peuvent être modifiées dans les conditions de l''Article 13.</p>
<h2>ARTICLE 3 — ACCÈS À LA PLATEFORME ET INSCRIPTION</h2>
<h3>3.1 Public concerné</h3>
<p>La Plateforme est destinée aux habitants, associations et commerces de la Commune. Elle peut également être ouverte, à la discrétion de la Commune, à d''autres personnes ayant un lien avec elle (salariés municipaux n''y résidant pas, personnes y exerçant une activité professionnelle, etc.).</p>
<h3>3.2 Âge minimum et utilisateurs mineurs</h3>
<p>L''inscription en tant qu''Habitant est réservée aux personnes physiques majeures, c''est-à-dire âgées d''au moins dix-huit (18) ans. Les associations et les commerces s''inscrivent par l''intermédiaire d''une personne physique majeure habilitée à les représenter, dans les conditions de l''Article 3.3.</p>
<h3>3.3 Création de compte</h3>
<p>Pour créer un compte, l''Utilisateur renseigne les informations suivantes : nom, prénom, adresse postale et adresse électronique.</p>
<p>Ces informations doivent être exactes et à jour ; l''Utilisateur s''engage à les actualiser en cas de changement.</p>
<h3>3.4 Compte personnel</h3>
<p>Chaque Utilisateur ne peut détenir qu''un seul compte, personnel, incessible et non transférable. L''Utilisateur est responsable de la confidentialité de ses identifiants et de toute activité réalisée depuis son compte. Il informe sans délai l''Éditeur de toute utilisation non autorisée de son compte dont il aurait connaissance.</p>
<h2>ARTICLE 4 — FONCTIONNALITÉS DE LA PLATEFORME</h2>
<p>La Plateforme permet notamment aux Utilisateurs de :</p>
<ul>
<li>publier et consulter des annonces d''entraide entre Utilisateurs ;</li>
<li>proposer et consulter des initiatives citoyennes, c''est-à-dire des idées d''actions à destination des Utilisateurs et de la Commune ;</li>
<li>publier et consulter des événements.</li>
</ul>
<h2>ARTICLE 5 — RÈGLES DE PUBLICATION ET BONNE CONDUITE</h2>
<p>En publiant un contenu sur la Plateforme (annonce, initiative, événement, message, image), l''Utilisateur s''engage à ne pas publier de contenu :</p>
<ul>
<li>illicite, notamment incitant à la haine, à la discrimination ou à la violence, diffamatoire, injurieux, à caractère pornographique, faisant l''apologie d''infractions ou de crimes contre l''humanité ;</li>
<li>portant atteinte à la vie privée, à l''image ou à la réputation d''un tiers ;</li>
<li>à caractère commercial ou publicitaire détourné de l''objet de la Plateforme, sauf accord préalable de l''Éditeur ou de la Commune ;</li>
<li>comportant de fausses informations ou usurpant l''identité d''un tiers ;</li>
<li>contraire à l''objet de la Plateforme tel que défini à l''Article 1 (lien social et entraide entre Utilisateurs).</li>
</ul>
<p>L''Utilisateur reste seul responsable du contenu qu''il publie sur la Plateforme et des conséquences de sa publication.</p>
<h2>ARTICLE 6 — MISE EN RELATION ENTRE UTILISATEURS — LIMITES DE RESPONSABILITÉ</h2>
<h3>6.1</h3>
<p>La Plateforme a pour seul objet de faciliter la mise en relation entre Utilisateurs souhaitant s''entraider, partager une initiative ou organiser un événement. Ni l''Éditeur ni la Commune ne sont parties aux échanges, services rendus ou rencontres organisés entre Utilisateurs à la suite d''une mise en relation via la Plateforme.</p>
<h3>6.2</h3>
<p>L''Éditeur et la Commune n''effectuent aucune vérification d''identité, de compétence, d''antécédents ou d''aptitude des Utilisateurs au-delà des informations renseignées lors de l''inscription. Il appartient à chaque Utilisateur de faire preuve de la prudence nécessaire avant tout échange ou rencontre avec un autre Utilisateur, notamment lors de rencontres en personne (privilégier par exemple un lieu public pour un premier contact, informer un proche de ce rendez-vous, etc.).</p>
<h3>6.3</h3>
<p>Ni l''Éditeur ni la Commune ne sauraient être tenus responsables des dommages ou préjudices, de quelque nature que ce soit, résultant des échanges, services rendus ou rencontres entre Utilisateurs organisés par l''intermédiaire de la Plateforme.</p>
<h2>ARTICLE 7 — MODÉRATION ET SIGNALEMENT DE CONTENUS ILLICITES</h2>
<h3>7.1</h3>
<p>Conformément à la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l''économie numérique, l''Éditeur met à la disposition des Utilisateurs un dispositif de signalement facilement accessible et visible, permettant à toute personne de porter à sa connaissance un contenu qu''elle estime illicite, accessible via la fonctionnalité « signaler » intégrée à la Plateforme ou à l''adresse de contact contact@tous-voisins.fr.</p>
<h3>7.2</h3>
<p>L''Éditeur examine promptement tout signalement reçu et retire ou rend inaccessible tout contenu manifestement illicite porté à sa connaissance, dans les conditions prévues par la loi.</p>
<h3>7.3</h3>
<p>L''Éditeur et la Commune se réservent le droit de retirer tout contenu contrevenant aux présentes CGU ou à la réglementation en vigueur, et de suspendre ou supprimer le compte d''un Utilisateur en cas de manquement. L''Utilisateur concerné en est informé dans les meilleurs délais, sauf urgence ou contenu manifestement illicite justifiant une action immédiate sans préavis.</p>
<h3>7.4</h3>
<p>L''Éditeur conserve les données permettant l''identification de toute personne ayant contribué à la création d''un contenu publié sur la Plateforme, conformément à ses obligations légales.</p>
<h2>ARTICLE 8 — PROTECTION DES DONNÉES PERSONNELLES</h2>
<h3>8.1</h3>
<p>Les données personnelles collectées lors de l''inscription d''un Habitant (nom, prénom, adresse postale, adresse électronique) sont traitées par la Commune dont il relève, responsable du traitement, aux fins de fonctionnement de la Plateforme décrites à l''Article 1.</p>
<h3>8.2</h3>
<p>Les informations relatives à une association ou à un commerce (dénomination, numéro SIRET ou RNA, adresse) ne constituent pas des données à caractère personnel au sens du RGPD, lequel ne couvre que les données relatives à des personnes physiques. Le nom de la personne physique qui représente l''association ou le commerce est en revanche traité dans les mêmes conditions que les données d''un Habitant.</p>
<h3>8.3</h3>
<p>Ces données sont traitées par Gwendoline DUBOIS, agissant en qualité de sous-traitant pour le compte de la Commune, dans les conditions prévues par le contrat conclu entre eux.</p>
<h3>8.4</h3>
<p>Les données sont hébergées au sein de l''Union européenne. Le recours à certains sous-traitants ultérieurs peut néanmoins constituer un transfert de données vers un pays tiers au sens du RGPD ; les modalités précises d''hébergement, l''identité de ces sous-traitants ultérieurs et les garanties applicables à un tel transfert sont décrites dans l''Accord de traitement des données personnelles (DPA) conclu entre l''Éditeur et la Commune.</p>
<h3>8.5</h3>
<p>Conformément au Règlement (UE) 2016/679 (RGPD) et à la loi Informatique et Libertés, chaque Utilisateur dispose d''un droit d''accès, de rectification, d''effacement, de limitation et d''opposition au traitement de ses données personnelles, qu''il peut exercer en s''adressant à contact@tous-voisins.fr. Il dispose également du droit d''introduire une réclamation auprès de la Commission nationale de l''informatique et des libertés (CNIL).</p>
<h3>8.6</h3>
<p>Pour plus d''informations sur le traitement de ses données, l''Utilisateur est invité à consulter la politique de confidentialité de la Plateforme.</p>
<h2>ARTICLE 9 — PROPRIÉTÉ INTELLECTUELLE</h2>
<h3>9.1</h3>
<p>La Plateforme, son architecture, son code source, sa charte graphique et l''ensemble de ses éléments constitutifs sont la propriété exclusive de Gwendoline DUBOIS. Aucune disposition des présentes CGU ne confère à l''Utilisateur un quelconque droit de propriété intellectuelle sur la Plateforme.</p>
<h3>9.2</h3>
<p>En publiant un contenu sur la Plateforme, l''Utilisateur concède à l''Éditeur et à la Commune une licence non exclusive, à titre gratuit, pour la durée de publication de ce contenu, leur permettant de l''héberger, de l''afficher et de le diffuser dans le cadre du fonctionnement de la Plateforme. L''Utilisateur garantit disposer des droits nécessaires sur tout contenu qu''il publie (notamment les images) et reste seul responsable à cet égard.</p>
<h2>ARTICLE 10 — DISPONIBILITÉ ET ÉVOLUTION DU SERVICE</h2>
<h3>10.1</h3>
<p>L''Éditeur s''efforce d''assurer l''accès à la Plateforme en continu, sous réserve des opérations de maintenance (dont les Utilisateurs sont informés dans la mesure du possible) et des cas de force majeure.</p>
<h3>10.2</h3>
<p>L''Éditeur peut faire évoluer les fonctionnalités de la Plateforme à tout moment, sans que cette évolution ne constitue une modification substantielle du Service justifiant une indemnisation des Utilisateurs.</p>
<h2>ARTICLE 11 — SUSPENSION ET SUPPRESSION DE COMPTE</h2>
<h3>11.1</h3>
<p>L''Utilisateur peut supprimer son compte à tout moment, depuis les paramètres de son compte.</p>
<h3>11.2</h3>
<p>L''Éditeur ou la Commune peuvent suspendre ou supprimer un compte en cas de manquement aux présentes CGU, de comportement abusif envers d''autres Utilisateurs, ou de publication de contenu manifestement illicite, dans les conditions de l''Article 7.3.</p>
<h3>11.3</h3>
<p>La suppression du compte entraîne la suppression des données personnelles de l''Utilisateur dans les conditions prévues par la politique de confidentialité de la Plateforme, sous réserve des obligations légales de conservation, notamment au titre de l''Article 7.4.</p>
<h2>ARTICLE 12 — RESPONSABILITÉ GÉNÉRALE</h2>
<h3>12.1</h3>
<p>L''Éditeur met en œuvre des moyens raisonnables pour assurer le bon fonctionnement de la Plateforme, sans garantir l''absence d''erreurs, d''interruptions ou de dysfonctionnements.</p>
<h3>12.2</h3>
<p>Sous réserve des dispositions de l''Article 6, la responsabilité de l''Éditeur et de la Commune envers les Utilisateurs, à raison de l''utilisation de la Plateforme, ne pourra être engagée qu''en cas de faute prouvée, et est limitée aux dommages directs et prévisibles.</p>
<h2>ARTICLE 13 — MODIFICATION DES CGU</h2>
<p>L''Éditeur peut modifier les présentes CGU à tout moment, notamment pour les adapter à des évolutions légales, réglementaires ou techniques. Les Utilisateurs sont informés de toute modification substantielle par courrier électronique, avant son entrée en vigueur. La poursuite de l''utilisation de la Plateforme après cette information vaut acceptation des CGU modifiées.</p>
<h2>ARTICLE 14 — DROIT APPLICABLE ET LITIGES</h2>
<h3>14.1</h3>
<p>Les présentes CGU sont soumises au droit français.</p>
<h3>14.2</h3>
<p>En cas de différend, l''Utilisateur est invité à contacter contact@tous-voisins.fr afin de rechercher une solution amiable.</p>
<h3>14.3</h3>
<p>À défaut de résolution amiable, le litige relève de la compétence des juridictions françaises compétentes. L''Utilisateur, en tant que consommateur, peut, conformément à l''article 46 du Code de procédure civile, saisir la juridiction de son domicile ou celle du défendeur.</p>
<h2>ARTICLE 15 — MENTIONS LÉGALES ET CONTACT</h2>
<ul>
<li><strong>Éditeur de la Plateforme :</strong> Gwendoline DUBOIS, entrepreneur individuel (auto-entrepreneur) exerçant sous le nom commercial « Gwendoline DUBOIS Développement Web », SIRET 909 499 303 00016, domiciliée 7 bis rue de la Forêt du Parc, 27220 Les Authieux</li>
<li><strong>Directeur de la publication :</strong> Gwendoline DUBOIS</li>
<li><strong>Hébergement technique :</strong> Hetzner Online GmbH (Allemagne), pour l''interface de la Plateforme, Supabase, Inc., pour la base de données (région Europe de l''Ouest — Irlande), et Cloudinary, Inc., pour le stockage des fichiers déposés par les Utilisateurs</li>
<li><strong>Mise à disposition par :</strong> la Collectivité territoriale cliente de la Plateforme</li>
<li><strong>Contact :</strong> contact@tous-voisins.fr</li>
</ul>', '{}'::jsonb, now()),
  ('politique-confidentialite', 'Politique de confidentialité', '<h1>POLITIQUE DE CONFIDENTIALITÉ</h1>
<p><strong>Tous Voisins</strong> — plateforme numérique de lien social et d''entraide</p>
<p>Mise à disposition par la Collectivité territoriale cliente</p>
<p><em>Version en vigueur à compter du 26 juin 2026</em></p>
<h2>ARTICLE 1 — OBJET</h2>
<p>La présente Politique de confidentialité a pour objet d''informer les utilisateurs de Tous Voisins (ci-après « la Plateforme »), qu''ils soient des Habitants (personnes physiques), des associations ou des commerces (ci-après collectivement les « Utilisateurs »), sur la manière dont leurs données à caractère personnel sont collectées, utilisées, partagées, conservées et protégées.</p>
<p>Elle complète les Conditions Générales d''Utilisation (CGU) de la Plateforme, dont les stipulations relatives aux données personnelles (Article 8) renvoient à la présente Politique pour le détail des modalités de traitement.</p>
<h2>ARTICLE 2 — QUI EST RESPONSABLE DE VOS DONNÉES ?</h2>
<h3>2.1 La Commune, responsable du traitement</h3>
<p>La collectivité territoriale qui met la Plateforme à la disposition de ses administrés (ci-après « la Commune ») est responsable du traitement, au sens de l''article 4.7 du RGPD, des données personnelles des Habitants utilisateurs de la Plateforme. C''est la Commune qui détermine les finalités de cette mise à disposition, dans le cadre de sa mission d''intérêt public de favoriser le lien social et l''entraide entre administrés, telle qu''elle relève de sa clause de compétence générale (article L. 2121-29 du Code général des collectivités territoriales). Le traitement repose, à ce titre, sur le fondement de l''article 6.1.e du RGPD (exécution d''une mission d''intérêt public).</p>
<h3>2.2 L''Éditeur, sous-traitant</h3>
<p>Madame Gwendoline DUBOIS, entrepreneur individuel (auto-entrepreneur) exerçant sous le nom commercial « Gwendoline DUBOIS Développement Web », SIRET 909 499 303 00016, domiciliée professionnellement 7 bis rue de la Forêt du Parc, 27220 Les Authieux (ci-après « l''Éditeur »), édite la Plateforme et agit en qualité de sous-traitant, au sens de l''article 28 du RGPD, pour le compte de la Commune.</p>
<p>L''Éditeur traite les données personnelles selon les instructions documentées de la Commune, telles que mises en œuvre via le fonctionnement normal de la Plateforme.</p>
<h3>2.3 Coordonnées</h3>
<ul>
<li><strong>Éditeur :</strong> contact@tous-voisins.fr</li>
</ul>
<h2>ARTICLE 3 — QUELLES DONNÉES SONT COLLECTÉES ?</h2>
<h3>3.1 Données des utilisateurs</h3>
<p>Lors de la création d''un compte, l''Éditeur collecte, pour le compte de la Commune : nom, prénom, adresse postale et adresse électronique. S''y ajoutent les données que l''Habitant choisit de renseigner volontairement dans le cadre de l''utilisation de la Plateforme (contenu des annonces, initiatives, événements ou messages qu''il publie).</p>
<h3>3.2 Données techniques</h3>
<p>Des données techniques de connexion (par exemple horodatage, adresse IP) sont également collectées automatiquement, dans la mesure nécessaire au fonctionnement, à la sécurité de la Plateforme et au respect des obligations légales de l''Éditeur en matière de lutte contre les contenus illicites (Article 7 des CGU).</p>
<h2>ARTICLE 4 — POURQUOI CES DONNÉES SONT-ELLES COLLECTÉES ?</h2>
<p>Les données des Utilisateurs sont traitées aux fins suivantes :</p>
<ul>
<li>la création et la gestion des comptes Utilisateurs ;</li>
<li>la mise en relation entre Utilisateurs au titre des annonces d''entraide, des initiatives citoyennes et des événements proposés sur la Plateforme ;</li>
<li>la modération des contenus et la sécurité de la Plateforme ;</li>
<li>la réponse aux demandes d''assistance ou d''exercice de droits des Utilisateurs ;</li>
<li>le respect des obligations légales de la Commune et de l''Éditeur, notamment en matière de protection des données et de lutte contre les contenus illicites.</li>
</ul>
<h2>ARTICLE 5 — QUI A ACCÈS À VOS DONNÉES ?</h2>
<p>Selon leur finalité, les données des Utilisateurs sont accessibles :</p>
<ul>
<li>aux services habilités de la Commune, responsable du traitement ;</li>
<li>au personnel habilité de l''Éditeur, sous-traitant ;</li>
<li>aux autres Utilisateurs de la Plateforme, dans la stricte mesure nécessaire à la mise en relation (par exemple, le prénom et les informations qu''un Utilisateur choisit de faire figurer dans une annonce sont visibles par les autres Utilisateurs) ;</li>
<li>aux sous-traitants ultérieurs auxquels l''Éditeur a recours pour des fonctions techniques (hébergement, stockage), dont la liste et les garanties sont décrites dans l''Accord de traitement des données personnelles (DPA) conclu entre l''Éditeur et la Commune ;</li>
<li>aux autorités administratives ou judiciaires compétentes, sur réquisition et dans les conditions prévues par la loi.</li>
</ul>
<p>L''Éditeur ne vend ni ne cède les données des Utilisateurs à des tiers à des fins commerciales.</p>
<h2>ARTICLE 6 — VOS DONNÉES SONT-ELLES TRANSFÉRÉES HORS DE L''UNION EUROPÉENNE ?</h2>
<p>Les données des Utilisateurs sont hébergées au sein de l''Union européenne. Le recours à certains sous-traitants ultérieurs peut néanmoins constituer un transfert de données vers un pays tiers au sens du Chapitre V du RGPD ; les modalités précises d''hébergement, l''identité de ces sous-traitants ultérieurs et les garanties applicables à un tel transfert (notamment les clauses contractuelles types) sont décrites dans le DPA conclu entre l''Éditeur et la Commune, disponible sur demande.</p>
<h2>ARTICLE 7 — COMBIEN DE TEMPS VOS DONNÉES SONT-ELLES CONSERVÉES ?</h2>
<h3>7.1</h3>
<p>Les données d''un Utilisateur sont conservées tant que son compte demeure actif sur la Plateforme.</p>
<h3>7.2</h3>
<p>En cas de suppression de compte par l''Utilisateur (Article 11.1 des CGU), ses données sont supprimées des bases actives dans un délai de trente (30) jours, à l''exception des données permettant son identification, conservées pendant deux (2) ans, conformément aux obligations de l''Éditeur en matière de lutte contre les contenus illicites (loi du 21 juin 2004 pour la confiance dans l''économie numérique).</p>
<h3>7.3</h3>
<p>À l''issue du contrat conclu entre l''Éditeur et la Commune (résiliation ou non-renouvellement), les données des Habitants sont supprimées dans les conditions prévues par le DPA, c''est-à-dire dans un délai de trente (30) jours, porté à quatre-vingt-dix (90) jours pour les copies de sauvegarde, sauf demande de restitution formulée par la Commune avant l''expiration de ce délai.</p>
<h2>ARTICLE 8 — COMMENT VOS DONNÉES SONT-ELLES SÉCURISÉES ?</h2>
<p>L''Éditeur met en œuvre les mesures techniques et organisationnelles appropriées pour assurer un niveau de sécurité adapté au risque, notamment le chiffrement des données en transit, le contrôle des accès et des sauvegardes régulières testées, conformément à l''article 32 du RGPD et aux stipulations du DPA.</p>
<h2>ARTICLE 9 — COOKIES ET TRACEURS</h2>
<p>La Plateforme utilise uniquement, à la date de la présente Politique, des cookies strictement nécessaires à son fonctionnement (notamment la gestion de la connexion et de la session de l''Utilisateur), qui ne requièrent pas de consentement préalable conformément aux recommandations de la CNIL.</p>
<h2>ARTICLE 10 — QUELS SONT VOS DROITS ?</h2>
<p>Conformément au RGPD et à la loi Informatique et Libertés, chaque Utilisateur dispose, sur les données le concernant, d''un droit d''accès, de rectification, d''effacement, de limitation et d''opposition, ainsi que d''un droit à la portabilité lorsque celui-ci s''applique. Ces droits peuvent être exercés en s''adressant à contact@tous-voisins.fr, l''Éditeur transmettant la demande à la Commune compétente lorsque celle-ci concerne le traitement dont elle est responsable, sans y répondre lui-même, sauf instruction contraire de la Commune.</p>
<p>Chaque Utilisateur dispose également du droit d''introduire une réclamation auprès de la Commission nationale de l''informatique et des libertés (CNIL) — 3 Place de Fontenoy, TSA 80715, 75334 Paris Cedex 07, www.cnil.fr — s''il estime que ses droits ne sont pas respectés.</p>
<h2>ARTICLE 11 — MODIFICATION DE LA PRÉSENTE POLITIQUE</h2>
<p>La présente Politique de confidentialité peut être modifiée à tout moment, notamment pour tenir compte d''évolutions légales, réglementaires ou techniques. Les Utilisateurs sont informés de toute modification substantielle dans les conditions prévues à l''Article 13 des CGU.</p>', '{}'::jsonb, now());
