const { createClient } = require('@supabase/supabase-js')

// Read environment variables
require('dotenv').config({ path: 'frontend/.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createTables() {
  console.log('Creating CRM tables...')
  
  try {
    // Create projects table
    const { error: projectsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS projects (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            created_by TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    })
    
    if (projectsError) {
      console.error('Error creating projects table:', projectsError)
    } else {
      console.log('✅ Projects table created')
    }

    // Create tasks table
    const { error: tasksError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS tasks (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT,
            status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in-progress', 'completed', 'blocked')),
            priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
            assignee TEXT,
            due_date DATE,
            category TEXT,
            notes TEXT,
            attachments JSONB DEFAULT '[]'::jsonb,
            links JSONB DEFAULT '[]'::jsonb,
            project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
            created_by TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    })
    
    if (tasksError) {
      console.error('Error creating tasks table:', tasksError)
    } else {
      console.log('✅ Tasks table created')
    }

    // Enable RLS
    await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE projects ENABLE ROW LEVEL SECURITY;'
    })
    
    await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;'
    })

    // Create RLS policies for projects
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY "Users can manage their own projects" ON projects
        FOR ALL USING (auth.uid() = user_id);
      `
    })

    // Create RLS policies for tasks  
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY "Users can manage tasks from their projects" ON tasks
        FOR ALL USING (
          project_id IN (
            SELECT id FROM projects WHERE user_id = auth.uid()
          )
        );
      `
    })

    console.log('✅ All tables created successfully!')
    
  } catch (error) {
    console.error('Error creating tables:', error)
  }
}

createTables()