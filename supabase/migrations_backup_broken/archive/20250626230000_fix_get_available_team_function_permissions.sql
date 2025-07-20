CREATE OR REPLACE FUNCTION get_available_team_by_org()
RETURNS UUID AS $$
DECLARE
    team_id_result UUID;
BEGIN
    -- Find a team where the number of assigned organizations is less than its capacity
    SELECT t.id INTO team_id_result
    FROM public.teams t
    LEFT JOIN (
        SELECT team_id, COUNT(*) as load FROM public.organizations WHERE team_id IS NOT NULL GROUP BY team_id
    ) o ON t.id = o.team_id
    WHERE COALESCE(o.load, 0) < t.capacity
    ORDER BY t.created_at ASC
    LIMIT 1;

    RETURN team_id_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 