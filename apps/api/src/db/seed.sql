DELETE FROM entries;
DELETE FROM trip_members;
DELETE FROM trips;

-- Seed trips
WITH v(id, title, start_date, end_date) AS (
    VALUES
        ('00000000-0000-0000-0000-000000000001', 'Two weeks in Japan', '2026-10-07 23:00:00', '2026-10-21 23:00:00'),
        ('00000000-0000-0000-0000-000000000002', 'Portugal coast',     '2026-12-01 23:00:00', '2026-12-10 23:00:00'),
        ('00000000-0000-0000-0000-000000000003', 'Tenerife',           '2026-02-18 23:00:00', '2026-03-01 23:00:00')
)
INSERT INTO trips (id, title, start_date, end_date, cover_photo_id, created_by, created_at, updated_at)
SELECT
    v.id,
    v.title,
    unixepoch(v.start_date),
    unixepoch(v.end_date),
    NULL,
    (SELECT id FROM user ORDER BY created_at LIMIT 1),
    cast(unixepoch('subsecond') * 1000 as integer),
    cast(unixepoch('subsecond') * 1000 as integer)
FROM v;

-- Seed trip members
INSERT INTO trip_members (trip_id, user_id)
SELECT t.id, u.id
FROM trips t
CROSS JOIN user u;

-- Seed entries
WITH v(id, trip_id, title, entry_date, location, tag, notes) AS (
    VALUES
        -- Japan
        ('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0000-000000000001', 'Landed at Haneda, ramen near the hotel',   '2026-10-08 19:30:00', json_object('osmType', NULL, 'osmId', NULL, 'displayName', 'Haneda Airport, Ota, Tokyo, Japan', 'name', 'Haneda Airport', 'lat', 35.6762, 'lng', 139.6503, 'category', NULL, 'type', NULL, 'locality', 'Tokyo', 'country', 'Japan', 'countryCode', 'jp', 'boundingBox', NULL), 'food', 'Arrived at Haneda Airport'),
        ('00000000-0000-0000-0001-000000000002', '00000000-0000-0000-0000-000000000001', 'Shibuya Crossing at night',               '2026-10-09 21:00:00', json_object('osmType', NULL, 'osmId', NULL, 'displayName', 'Shibuya Crossing, Shibuya, Tokyo, Japan', 'name', 'Shibuya Crossing', 'lat', 35.6595, 'lng', 139.7005, 'category', NULL, 'type', NULL, 'locality', 'Tokyo', 'country', 'Japan', 'countryCode', 'jp', 'boundingBox', NULL), 'sights', 'Evening visit to Shibuya Crossing'),
        ('00000000-0000-0000-0001-000000000003', '00000000-0000-0000-0000-000000000001', 'Shinkansen to Kyoto',                     '2026-10-13 09:15:00', json_object('osmType', NULL, 'osmId', NULL, 'displayName', 'Kyoto Station, Kyoto, Japan', 'name', 'Kyoto Station', 'lat', 35.0116, 'lng', 135.7681, 'category', NULL, 'type', NULL, 'locality', 'Kyoto', 'country', 'Japan', 'countryCode', 'jp', 'boundingBox', NULL), 'transport', 'Traveling to Kyoto by Shinkansen'),
        ('00000000-0000-0000-0001-000000000004', '00000000-0000-0000-0000-000000000001', 'Fushimi Inari at sunrise',                '2026-10-14 06:45:00', json_object('osmType', NULL, 'osmId', NULL, 'displayName', 'Fushimi Inari Taisha, Kyoto, Japan', 'name', 'Fushimi Inari Taisha', 'lat', 34.9671, 'lng', 135.7727, 'category', NULL, 'type', NULL, 'locality', 'Kyoto', 'country', 'Japan', 'countryCode', 'jp', 'boundingBox', NULL), 'sights', 'Early morning visit to Fushimi Inari'),
        ('00000000-0000-0000-0001-000000000005', '00000000-0000-0000-0000-000000000001', 'Takoyaki in Dotonbori',                   '2026-10-17 20:00:00', json_object('osmType', NULL, 'osmId', NULL, 'displayName', 'Dotonbori, Osaka, Japan', 'name', 'Dotonbori', 'lat', 34.6687, 'lng', 135.5013, 'category', NULL, 'type', NULL, 'locality', 'Osaka', 'country', 'Japan', 'countryCode', 'jp', 'boundingBox', NULL), 'food', 'Enjoying Takoyaki in Dotonbori'),

        -- Portugal
        ('00000000-0000-0000-0002-000000000001', '00000000-0000-0000-0000-000000000002', 'Pastéis de nata in Lisbon',               '2026-12-02 10:30:00', json_object('osmType', NULL, 'osmId', NULL, 'displayName', 'Pastéis de Belém, Lisbon, Portugal', 'name', 'Pastéis de Belém', 'lat', 38.7223, 'lng', -9.1393, 'category', NULL, 'type', NULL, 'locality', 'Lisbon', 'country', 'Portugal', 'countryCode', 'pt', 'boundingBox', NULL), 'food', 'Tasting the famous Pastéis de nata in Lisbon'),
        ('00000000-0000-0000-0002-000000000002', '00000000-0000-0000-0000-000000000002', 'Tram 28 up to the Alfama',                '2026-12-03 15:00:00', json_object('osmType', NULL, 'osmId', NULL, 'displayName', 'Alfama, Lisbon, Portugal', 'name', 'Alfama', 'lat', 38.7139, 'lng', -9.1334, 'category', NULL, 'type', NULL, 'locality', 'Lisbon', 'country', 'Portugal', 'countryCode', 'pt', 'boundingBox', NULL), 'sights', 'Riding Tram 28 through the Alfama district'),
        ('00000000-0000-0000-0002-000000000003', '00000000-0000-0000-0000-000000000002', 'Drive down to the Algarve',               '2026-12-06 11:00:00', json_object('osmType', NULL, 'osmId', NULL, 'displayName', 'Algarve, Portugal', 'name', 'Algarve', 'lat', 37.1028, 'lng', -8.6730, 'category', NULL, 'type', NULL, 'locality', 'Algarve', 'country', 'Portugal', 'countryCode', 'pt', 'boundingBox', NULL), 'transport', 'Road trip to the Algarve region'),
        ('00000000-0000-0000-0002-000000000004', '00000000-0000-0000-0000-000000000002', 'Cliff walk near Sagres',                  '2026-12-08 14:20:00', json_object('osmType', NULL, 'osmId', NULL, 'displayName', 'Sagres, Algarve, Portugal', 'name', 'Sagres', 'lat', 37.0086, 'lng', -8.9411, 'category', NULL, 'type', NULL, 'locality', 'Sagres', 'country', 'Portugal', 'countryCode', 'pt', 'boundingBox', NULL), 'sights', 'Walking along the cliffs near Sagres'),

        -- Tenerife
        ('00000000-0000-0000-0003-000000000001', '00000000-0000-0000-0000-000000000003', 'Arrived, apartment in Costa Adeje',       '2026-02-19 17:00:00', json_object('osmType', NULL, 'osmId', NULL, 'displayName', 'Costa Adeje, Tenerife, Spain', 'name', 'Costa Adeje', 'lat', 28.0916, 'lng', -16.7291, 'category', NULL, 'type', NULL, 'locality', 'Adeje', 'country', 'Spain', 'countryCode', 'es', 'boundingBox', NULL), 'stay', ''),
        ('00000000-0000-0000-0003-000000000002', '00000000-0000-0000-0000-000000000003', 'Cable car up Teide',                      '2026-02-22 10:00:00', json_object('osmType', NULL, 'osmId', NULL, 'displayName', 'Mount Teide, Tenerife, Spain', 'name', 'Mount Teide', 'lat', 28.2724, 'lng', -16.6425, 'category', NULL, 'type', NULL, 'locality', 'Tenerife', 'country', 'Spain', 'countryCode', 'es', 'boundingBox', NULL), 'sights', NULL),
        ('00000000-0000-0000-0003-000000000003', '00000000-0000-0000-0000-000000000003', 'Masca valley hike',                       '2026-02-25 09:30:00', json_object('osmType', NULL, 'osmId', NULL, 'displayName', 'Masca, Tenerife, Spain', 'name', 'Masca', 'lat', 28.3066, 'lng', -16.8396, 'category', NULL, 'type', NULL, 'locality', 'Masca', 'country', 'Spain', 'countryCode', 'es', 'boundingBox', NULL), 'sights', NULL),
        ('00000000-0000-0000-0003-000000000004', '00000000-0000-0000-0000-000000000003', 'Lazy beach day, no plans',                '2026-02-27 13:00:00', NULL, NULL, NULL)
)
INSERT INTO entries (
    id, trip_id, author_id, title, entry_date, location, tag, notes,
    is_deleted, created_at, updated_at, server_updated_at
)
SELECT
    v.id,
    v.trip_id,
    (SELECT id FROM user ORDER BY created_at LIMIT 1),
    v.title,
    unixepoch(v.entry_date),
    v.location,
    v.tag,
    v.notes,
    0,
    -- LWW clock must be edit time, not the (possibly future-dated) entry date,
    -- so seeded rows never win last-write-wins against a live client edit
    cast(unixepoch('subsecond') * 1000 as integer),
    cast(unixepoch('subsecond') * 1000 as integer),
    cast(unixepoch('subsecond') * 1000 as integer)
FROM v;
