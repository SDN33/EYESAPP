-- Script SQL Supabase : désactive les users inactifs depuis plus de 2 minutes
-- À exécuter régulièrement (cron job ou tâche planifiée)

update users
set is_active = false
where last_seen_at < (now() at time zone 'utc') - interval '2 minutes'
  and is_active = true;

-- Pour réactiver automatiquement un user actif, l'upsert front doit toujours mettre is_active = true.
