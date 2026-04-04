-- 005_fix_category_uniqueness.up.sql

ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_name_entity_nature_key;
ALTER TABLE categories ADD UNIQUE (user_id, name, entity, nature);

ALTER TABLE sub_categories DROP CONSTRAINT IF EXISTS sub_categories_category_id_name_key;
ALTER TABLE sub_categories ADD UNIQUE (user_id, category_id, name);
