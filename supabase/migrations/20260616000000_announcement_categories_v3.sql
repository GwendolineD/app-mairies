-- Announcement categories v3: add icon_name, default_image_url, color_hex columns
-- and populate with data from existing TypeScript constants

-- Drop unused icon_url column, replace with icon_name (Lucide icon identifier)
ALTER TABLE public.announcement_categories DROP COLUMN IF EXISTS icon_url;
ALTER TABLE public.announcement_categories ADD COLUMN IF NOT EXISTS icon_name text;
ALTER TABLE public.announcement_categories ADD COLUMN IF NOT EXISTS default_image_url text;
ALTER TABLE public.announcement_categories ADD COLUMN IF NOT EXISTS color_hex text NOT NULL DEFAULT '#A8A8A8';

-- Populate all new columns with data from existing TypeScript constants
UPDATE public.announcement_categories SET
  icon_name = CASE slug
    WHEN 'bricolage' THEN 'hammer'
    WHEN 'numerique' THEN 'monitor'
    WHEN 'transport' THEN 'car'
    WHEN 'alimentaire' THEN 'shopping-basket'
    WHEN 'garde-pontuelle' THEN 'users'
    WHEN 'paperasse' THEN 'file-text'
    WHEN 'animaux' THEN 'paw-print'
    WHEN 'jardinage-exterieur' THEN 'leaf'
    WHEN 'pret-objet' THEN 'package'
    WHEN 'don-troc' THEN 'gift'
    WHEN 'loisirs' THEN 'music'
    WHEN 'autre' THEN 'more-horizontal'
  END,
  color_hex = CASE slug
    WHEN 'bricolage' THEN '#E85D3A'
    WHEN 'numerique' THEN '#5CBDB9'
    WHEN 'transport' THEN '#4A9FD4'
    WHEN 'alimentaire' THEN '#F4A261'
    WHEN 'garde-pontuelle' THEN '#E89AB8'
    WHEN 'paperasse' THEN '#E8C07A'
    WHEN 'animaux' THEN '#B58463'
    WHEN 'jardinage-exterieur' THEN '#7BB661'
    WHEN 'pret-objet' THEN '#8FA8C9'
    WHEN 'don-troc' THEN '#B084CC'
    WHEN 'loisirs' THEN '#E8688F'
    WHEN 'autre' THEN '#A8A8A8'
  END,
  default_image_url = CASE slug
    WHEN 'bricolage' THEN 'https://res.cloudinary.com/du3ko16j1/image/upload/v1781280253/app-mairies/illustrations/annonce-categorie-image-default/bricolage_2_xgz7dd.png'
    WHEN 'numerique' THEN 'https://res.cloudinary.com/du3ko16j1/image/upload/v1781280255/app-mairies/illustrations/annonce-categorie-image-default/numerique_2_bqxjvf.png'
    WHEN 'transport' THEN 'https://res.cloudinary.com/du3ko16j1/image/upload/v1781280256/app-mairies/illustrations/annonce-categorie-image-default/transport_2_thbebj.png'
    WHEN 'alimentaire' THEN 'https://res.cloudinary.com/du3ko16j1/image/upload/v1781280252/app-mairies/illustrations/annonce-categorie-image-default/alimentaire_-_Moyenne_sjiy1u.png'
    WHEN 'garde-pontuelle' THEN 'https://res.cloudinary.com/du3ko16j1/image/upload/v1781280254/app-mairies/illustrations/annonce-categorie-image-default/garde-enfants_2_ilgrha.png'
    WHEN 'paperasse' THEN 'https://res.cloudinary.com/du3ko16j1/image/upload/v1781280256/app-mairies/illustrations/annonce-categorie-image-default/paperasse_2_jlabjc.png'
    WHEN 'animaux' THEN 'https://res.cloudinary.com/du3ko16j1/image/upload/v1781280252/app-mairies/illustrations/annonce-categorie-image-default/animaux_-_Moyenne_grssuv.png'
    WHEN 'jardinage-exterieur' THEN 'https://res.cloudinary.com/du3ko16j1/image/upload/v1781280254/app-mairies/illustrations/annonce-categorie-image-default/jardin-exterieur_2_etmein.png'
    WHEN 'pret-objet' THEN 'https://res.cloudinary.com/du3ko16j1/image/upload/v1781280256/app-mairies/illustrations/annonce-categorie-image-default/pret-objet_2_emrbqp.png'
    WHEN 'don-troc' THEN 'https://res.cloudinary.com/du3ko16j1/image/upload/v1781280253/app-mairies/illustrations/annonce-categorie-image-default/don-troc_2_jeqxql.png'
    WHEN 'loisirs' THEN 'https://res.cloudinary.com/du3ko16j1/image/upload/v1781280255/app-mairies/illustrations/annonce-categorie-image-default/loisirs_2_hvzfoe.png'
    WHEN 'autre' THEN 'https://res.cloudinary.com/du3ko16j1/image/upload/v1781280253/app-mairies/illustrations/annonce-categorie-image-default/autre_2_s1dc51.png'
  END,
  map_pin_url = CASE slug
    WHEN 'bricolage' THEN 'https://res.cloudinary.com/du3ko16j1/image/upload/v1781508550/app-mairies/illustrations/annonces-categories-pin/bricolage-small_dk2phc.png'
    WHEN 'numerique' THEN 'https://res.cloudinary.com/du3ko16j1/image/upload/v1781508553/app-mairies/illustrations/annonces-categories-pin/numerique-small_hpbzaf.png'
    WHEN 'transport' THEN 'https://res.cloudinary.com/du3ko16j1/image/upload/v1781508555/app-mairies/illustrations/annonces-categories-pin/transport-small_dgq6um.png'
    WHEN 'alimentaire' THEN 'https://res.cloudinary.com/du3ko16j1/image/upload/v1781508549/app-mairies/illustrations/annonces-categories-pin/alimentation-small_govrc3.png'
    WHEN 'garde-pontuelle' THEN 'https://res.cloudinary.com/du3ko16j1/image/upload/v1781508552/app-mairies/illustrations/annonces-categories-pin/garde-enfant-small_krbvcz.png'
    WHEN 'paperasse' THEN 'https://res.cloudinary.com/du3ko16j1/image/upload/v1781508554/app-mairies/illustrations/annonces-categories-pin/paperasse-small_elhdlk.png'
    WHEN 'animaux' THEN 'https://res.cloudinary.com/du3ko16j1/image/upload/v1781508550/app-mairies/illustrations/annonces-categories-pin/animaux-small_dyhb3o.png'
    WHEN 'jardinage-exterieur' THEN 'https://res.cloudinary.com/du3ko16j1/image/upload/v1781508552/app-mairies/illustrations/annonces-categories-pin/jardinage-exterieur-small_xe5567.png'
    WHEN 'pret-objet' THEN 'https://res.cloudinary.com/du3ko16j1/image/upload/v1781508555/app-mairies/illustrations/annonces-categories-pin/pret-objet-small_uyozmf.png'
    WHEN 'don-troc' THEN 'https://res.cloudinary.com/du3ko16j1/image/upload/v1781508551/app-mairies/illustrations/annonces-categories-pin/don-troc-small_r5eifr.png'
    WHEN 'loisirs' THEN 'https://res.cloudinary.com/du3ko16j1/image/upload/v1781508553/app-mairies/illustrations/annonces-categories-pin/loisirs-small_eiepsv.png'
    WHEN 'autre' THEN 'https://res.cloudinary.com/du3ko16j1/image/upload/v1781508550/app-mairies/illustrations/annonces-categories-pin/autre-small_kq7l8b.png'
  END;
