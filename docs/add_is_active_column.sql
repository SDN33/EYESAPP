-- Ajout d'une colonne booléenne 'is_active' à la table users
ALTER TABLE users ADD COLUMN is_active boolean DEFAULT true;
-- (optionnel) Index pour requêtes rapides
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
