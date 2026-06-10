-- Enable PostgREST embed: memberships → profiles via user_id
ALTER TABLE public.memberships
  ADD CONSTRAINT memberships_profiles_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles (user_id);
