-- Add child task support to existing tasks table
-- Self-referencing relationship for parent/child tasks

-- Add parent_task_id column for child task relationships
ALTER TABLE tasks ADD COLUMN parent_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE;

-- Add completion tracking columns
ALTER TABLE tasks ADD COLUMN child_count INTEGER DEFAULT 0;
ALTER TABLE tasks ADD COLUMN completed_child_count INTEGER DEFAULT 0;

-- Create index for efficient parent/child queries
CREATE INDEX IF NOT EXISTS idx_tasks_parent_id ON tasks(parent_task_id);

-- Create function to update parent task completion counts
CREATE OR REPLACE FUNCTION update_parent_task_counts()
RETURNS TRIGGER AS $$
BEGIN
    -- If this is a child task (has parent_task_id)
    IF NEW.parent_task_id IS NOT NULL OR OLD.parent_task_id IS NOT NULL THEN
        -- Update counts for the parent task
        UPDATE tasks 
        SET 
            child_count = (
                SELECT COUNT(*) 
                FROM tasks 
                WHERE parent_task_id = COALESCE(NEW.parent_task_id, OLD.parent_task_id)
            ),
            completed_child_count = (
                SELECT COUNT(*) 
                FROM tasks 
                WHERE parent_task_id = COALESCE(NEW.parent_task_id, OLD.parent_task_id) 
                AND status = 'completed'
            )
        WHERE id = COALESCE(NEW.parent_task_id, OLD.parent_task_id);
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update parent task counts
CREATE TRIGGER update_parent_counts_on_insert
    AFTER INSERT ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_parent_task_counts();

CREATE TRIGGER update_parent_counts_on_update
    AFTER UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_parent_task_counts();

CREATE TRIGGER update_parent_counts_on_delete
    AFTER DELETE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_parent_task_counts();

-- Add RLS policies for child tasks (inherit from parent policies)
-- Child tasks follow the same security model as regular tasks