import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { mapFieldsToDatabase, mapFieldsToFrontend, mapArrayToFrontend } from '@/lib/field-mapping'

// GET /api/tasks/[id]/children - Get child tasks for a parent task
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createSupabaseServerClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const parentTaskId = params.id
    
    if (!parentTaskId) {
      return NextResponse.json({ error: 'Parent task ID is required' }, { status: 400 })
    }

    // Get child tasks for the parent task
    const { data: childTasks, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('parent_task_id', parentTaskId)
      .order('created_at', { ascending: true }) // Child tasks in creation order

    if (error) {
      console.error('Error fetching child tasks:', error)
      return NextResponse.json({ error: 'Failed to fetch child tasks' }, { status: 500 })
    }

    // Convert database snake_case to frontend camelCase
    const camelCaseChildTasks = mapArrayToFrontend(childTasks || [])
    return NextResponse.json({ childTasks: camelCaseChildTasks })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/tasks/[id]/children - Create a child task
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createSupabaseServerClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const parentTaskId = params.id
    const body = await request.json()
    
    // Convert frontend camelCase to database snake_case
    const dbData = mapFieldsToDatabase(body)
    
    const { 
      title, 
      description = '', 
      status = 'todo', 
      priority = 'medium', 
      assignee = 'You', 
      due_date, 
      category = 'General', 
      project_id,
      notes = ''
    } = dbData

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    // Verify parent task exists and get its project_id
    const { data: parentTask, error: parentError } = await supabase
      .from('tasks')
      .select('project_id')
      .eq('id', parentTaskId)
      .single()

    if (parentError || !parentTask) {
      return NextResponse.json({ error: 'Parent task not found' }, { status: 404 })
    }

    const { data: childTask, error } = await supabase
      .from('tasks')
      .insert({
        title,
        description,
        status,
        priority,
        assignee,
        due_date: due_date || null,
        category,
        project_id: project_id || parentTask.project_id, // Inherit from parent if not specified
        parent_task_id: parentTaskId,
        notes,
        attachments: [],
        links: [],
        created_by: user.email
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating child task:', error)
      return NextResponse.json({ error: 'Failed to create child task' }, { status: 500 })
    }

    // Convert database snake_case to frontend camelCase
    const camelCaseChildTask = mapFieldsToFrontend(childTask)
    return NextResponse.json({ childTask: camelCaseChildTask })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}