
UPDATE profiles p
SET county = ad.name
FROM administrative_divisions ad
WHERE p.county_id::text = ad.id::text
  AND p.county IS NULL;

UPDATE profiles p
SET constituency = ad.name
FROM administrative_divisions ad
WHERE p.constituency_id::text = ad.id::text
  AND p.constituency IS NULL;

UPDATE profiles p
SET ward = ad.name
FROM administrative_divisions ad
WHERE p.ward_id::text = ad.id::text
  AND p.ward IS NULL;
