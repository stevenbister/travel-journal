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
WITH v(id, trip_id, note, entry_date, lat, lng, tag) AS (
    VALUES
        -- Japan
        ('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0000-000000000001', 'Landed at Haneda, ramen near the hotel',   '2026-03-10 19:30:00', 35.6762, 139.6503, 'food'),
        ('00000000-0000-0000-0001-000000000002', '00000000-0000-0000-0000-000000000001', 'Shibuya Crossing at night',               '2026-03-11 21:00:00', 35.6595, 139.7005, 'sights'),
        ('00000000-0000-0000-0001-000000000003', '00000000-0000-0000-0000-000000000001', 'Shinkansen to Kyoto',                     '2026-03-15 09:15:00', 35.0116, 135.7681, 'transport'),
        ('00000000-0000-0000-0001-000000000004', '00000000-0000-0000-0000-000000000001', 'Fushimi Inari at sunrise',                '2026-03-16 06:45:00', 34.9671, 135.7727, 'sights'),
        ('00000000-0000-0000-0001-000000000005', '00000000-0000-0000-0000-000000000001', 'Takoyaki in Dotonbori',                   '2026-03-19 20:00:00', 34.6687, 135.5013, 'food'),

        -- Portugal
        ('00000000-0000-0000-0002-000000000001', '00000000-0000-0000-0000-000000000002', 'Pastéis de nata in Lisbon',               '2026-12-02 10:30:00', 38.7223, -9.1393, 'food'),
        ('00000000-0000-0000-0002-000000000002', '00000000-0000-0000-0000-000000000002', 'Tram 28 up to the Alfama',                '2026-12-03 15:00:00', 38.7139, -9.1334, 'sights'),
        ('00000000-0000-0000-0002-000000000003', '00000000-0000-0000-0000-000000000002', 'Drive down to the Algarve',               '2026-12-06 11:00:00', 37.1028, -8.6730, 'transport'),
        ('00000000-0000-0000-0002-000000000004', '00000000-0000-0000-0000-000000000002', 'Cliff walk near Sagres',                  '2026-12-08 14:20:00', 37.0086, -8.9411, 'sights'),

        -- Tenerife
        ('00000000-0000-0000-0003-000000000001', '00000000-0000-0000-0000-000000000003', 'Arrived, apartment in Costa Adeje',       '2026-02-19 17:00:00', 28.0916, -16.7291, 'stay'),
        ('00000000-0000-0000-0003-000000000002', '00000000-0000-0000-0000-000000000003', 'Cable car up Teide',                      '2026-02-22 10:00:00', 28.2724, -16.6425, 'sights'),
        ('00000000-0000-0000-0003-000000000003', '00000000-0000-0000-0000-000000000003', 'Masca valley hike',                       '2026-02-25 09:30:00', 28.3066, -16.8396, 'sights'),
        ('00000000-0000-0000-0003-000000000004', '00000000-0000-0000-0000-000000000003', 'Lazy beach day, no plans',                '2026-02-27 13:00:00', NULL,    NULL,     NULL)
)
INSERT INTO entries (
    id, trip_id, author_id, note, entry_date, lat, lng, tag,
    is_deleted, created_at, updated_at, server_updated_at
)
SELECT
    v.id,
    v.trip_id,
    (SELECT id FROM user ORDER BY created_at LIMIT 1),
    v.note,
    unixepoch(v.entry_date),
    v.lat,
    v.lng,
    v.tag,
    0,
    unixepoch(v.entry_date) * 1000,
    unixepoch(v.entry_date) * 1000,
    cast(unixepoch('subsecond') * 1000 as integer)
FROM v;
