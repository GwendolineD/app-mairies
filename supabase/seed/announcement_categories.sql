-- Fixed announcement categories (national list, all communes)
insert into public.announcement_categories (slug, label, sort_order, icon_url, map_pin_url) values
  ('bricolage', 'Bricolage', 1, null, null),
  ('numerique', 'Numérique', 2, null, null),
  ('transport', 'Transport', 3, null, null),
  ('alimentaire', 'Alimentaire', 4, null, null),
  ('garde-pontuelle', 'Garde ponctuelle', 5, null, null),
  ('paperasse', 'Paperasse', 6, null, null),
  ('animaux', 'Animaux', 7, null, null),
  ('jardinage-exterieur', 'Jardinage & extérieur', 8, null, null),
  ('pret-objet', 'Prêt d''objet', 9, null, null),
  ('don-troc', 'Don & troc', 10, null, null),
  ('loisirs', 'Loisirs', 11, null, null),
  ('autre', 'Autre', 12, null, null)
on conflict (slug) do update set
  label = excluded.label,
  sort_order = excluded.sort_order;
