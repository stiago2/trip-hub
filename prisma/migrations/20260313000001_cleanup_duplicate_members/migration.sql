-- Remove duplicate TripMember rows, keeping the one with the earliest joinedAt
-- for each (tripId, userId) pair.
DELETE FROM "TripMember"
WHERE id IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY "tripId", "userId"
             ORDER BY "joinedAt" ASC
           ) AS rn
    FROM "TripMember"
  ) AS ranked
  WHERE rn > 1
);
