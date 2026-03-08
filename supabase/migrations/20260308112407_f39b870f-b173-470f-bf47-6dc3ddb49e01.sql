-- Fix channel positions for existing communities that have all positions = 0
-- Assign correct positions based on the canonical order

DO $$
DECLARE
    comm RECORD;
BEGIN
    FOR comm IN SELECT id FROM communities LOOP
        UPDATE channels SET position = 0 WHERE community_id = comm.id AND name = 'community-feed';
        UPDATE channels SET position = 1 WHERE community_id = comm.id AND name = 'intros';
        UPDATE channels SET position = 2 WHERE community_id = comm.id AND name = 'announcements';
        UPDATE channels SET position = 3 WHERE community_id = comm.id AND name = 'our-leaders';
        UPDATE channels SET position = 4 WHERE community_id = comm.id AND name = 'projects-watch';
        UPDATE channels SET position = 5 WHERE community_id = comm.id AND name = 'promises-watch';
        UPDATE channels SET position = 6 WHERE community_id = comm.id AND name = 'project-tracker';
        UPDATE channels SET position = 7 WHERE community_id = comm.id AND name = 'general-chat';
        UPDATE channels SET position = 8 WHERE community_id = comm.id AND name = 'baraza';
        UPDATE channels SET position = 9 WHERE community_id = comm.id AND name = 'public-forum';
    END LOOP;
END $$;