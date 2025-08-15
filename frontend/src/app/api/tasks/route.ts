import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { mapFieldsToDatabase, mapFieldsToFrontend, mapArrayToFrontend } from '@/lib/field-mapping'

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const statusFilter = searchParams.get('status') // New: allow status filtering
    
    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
    }

    // Build query for tasks with child task relationships
    let query = supabase
      .from('tasks')
      .select(`
        *,
        child_tasks:tasks!parent_task_id(id, title, status, priority, assignee, due_date, created_at)
      `)
      .eq('project_id', projectId)
      .is('parent_task_id', null) // Only parent tasks, no subtasks

    // Apply status filter if provided, otherwise hide completed tasks by default
    if (statusFilter) {
      if (statusFilter === 'all') {
        // Show all tasks including completed
      } else {
        // Filter by specific status
        query = query.eq('status', statusFilter)
      }
    } else {
      // Default: hide completed tasks
      query = query.neq('status', 'completed')
    }

    const { data: tasks, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching tasks:', error)
      return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
    }

    // Convert database snake_case to frontend camelCase
    const camelCaseTasks = mapArrayToFrontend(tasks || [])
    return NextResponse.json({ tasks: camelCaseTasks })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    // Convert frontend camelCase to database snake_case
    const dbData = mapFieldsToDatabase(body)
    
    const { 
      title, 
      description, 
      status = 'todo', 
      priority = 'medium', 
      assignee, 
      due_date, 
      category, 
      project_id,
      parent_task_id,
      notes,
      attachments,
      links
    } = dbData

    if (!title || !project_id) {
      return NextResponse.json({ error: 'Title and projectId are required' }, { status: 400 })
    }

    const { data: task, error } = await supabase
      .from('tasks')
      .insert({
        title,
        description,
        status,
        priority,
        assignee,
        due_date: due_date || null, // Convert empty string to null
        category,
        project_id,
        parent_task_id: parent_task_id || null,
        notes,
        attachments: attachments || [],
        links: links || [],
        created_by: user.email
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating task:', error)
      return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
    }

    // Convert database snake_case to frontend camelCase
    const camelCaseTask = mapFieldsToFrontend(task)
    return NextResponse.json({ task: camelCaseTask })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, ...frontendUpdateData } = body

    if (!id) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 })
    }

    // Convert frontend camelCase to database snake_case
    const dbUpdateData = mapFieldsToDatabase(frontendUpdateData)
    
    // Remove virtual fields that don't exist in the database
    const { child_tasks, child_count, completed_child_count, ...cleanUpdateData } = dbUpdateData

    console.log('Updating task with data:', cleanUpdateData)

    const { data: task, error } = await supabase
      .from('tasks')
      .update(cleanUpdateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating task:', error)
      return NextResponse.json({ error: 'Failed to update task' }, { status: 500 })
    }

    // Convert database snake_case to frontend camelCase
    const camelCaseTask = mapFieldsToFrontend(task)
    return NextResponse.json({ task: camelCaseTask })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting task:', error)
      return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}