-- Trigger pour mettre à jour la colonne location à chaque update de lat/lng
CREATE OR REPLACE FUNCTION update_location_from_latlng()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.lat IS NOT NULL AND NEW.lng IS NOT NULL THEN
    NEW.location := ST_SetSRID(ST_MakePoint(NEW.lng, NEW.lat), 4326);
  ELSE
    NEW.location := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_location ON users;
CREATE TRIGGER trg_update_location
BEFORE INSERT OR UPDATE OF lat, lng ON users
FOR EACH ROW EXECUTE FUNCTION update_location_from_latlng();
