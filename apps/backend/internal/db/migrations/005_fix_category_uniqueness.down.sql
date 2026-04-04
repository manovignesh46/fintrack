-- 005_fix_category_uniqueness.down.sql

ALTER TABLE sub_categories DROP CONSTRAINT IF EXISTS sub_categories_user_id_category_id_name_key;
ALTER TABLE sub_categories ADD UNIQUE (category_id, name);

ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_user_id_name_entity_nature_key;
ALTER TABLE categories ADD UNIQUE (name, entity, nature);
