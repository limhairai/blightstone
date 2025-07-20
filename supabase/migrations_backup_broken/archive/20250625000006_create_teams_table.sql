-- 1. Create the teams table with a capacity column
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    capacity INT NOT NULL DEFAULT 20, -- Set a default capacity for each team
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add team_id to the organizations table
ALTER TABLE public.organizations
ADD COLUMN team_id UUID,
ADD CONSTRAINT fk_team
    FOREIGN KEY(team_id) 
    REFERENCES public.teams(id)
    ON DELETE SET NULL;

-- 3. Create a function to find an available team based on organization load
CREATE OR REPLACE FUNCTION get_available_team_by_org()
RETURNS UUID AS $$
DECLARE
    team_id_result UUID;
BEGIN
    -- Find a team where the number of assigned organizations is less than its capacity
    SELECT t.id INTO team_id_result
    FROM teams t
    LEFT JOIN (
        SELECT team_id, COUNT(*) as load FROM organizations WHERE team_id IS NOT NULL GROUP BY team_id
    ) o ON t.id = o.team_id
    WHERE COALESCE(o.load, 0) < t.capacity
    ORDER BY t.created_at ASC
    LIMIT 1;

    RETURN team_id_result;
END;
$$ LANGUAGE plpgsql; 