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

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
    }

    const { data: topAds, error } = await supabase
      .from('top_ads')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching top ads:', error)
      return NextResponse.json({ error: 'Failed to fetch top ads' }, { status: 500 })
    }

    // Convert database snake_case to frontend camelCase
    const camelCaseTopAds = mapArrayToFrontend(topAds || [])
    
    return NextResponse.json({ topAds: camelCaseTopAds })
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
      project_id,
      ad_title,
      platform,
      campaign_name,
      ad_set_name,
      spend,
      revenue,
      roas,
      ctr,
      cpm,
      conversion_rate,
      cost_per_conversion,
      impressions,
      clicks,
      conversions,
      performance_start_date,
      performance_end_date,
      ad_copy,
      headline,
      call_to_action,
      creative_url,
      landing_page_url,
      angle,
      target_audience,
      placement,
      objective,
      notes,
      why_it_worked,
      key_insights,
      status
    } = dbData

    if (!project_id || !ad_title || !platform) {
      return NextResponse.json({ error: 'Project ID, ad title, and platform are required' }, { status: 400 })
    }

    const { data: topAd, error } = await supabase
      .from('top_ads')
      .insert({
        project_id,
        created_by: user.email,
        ad_title,
        platform,
        campaign_name,
        ad_set_name,
        spend: spend ? parseFloat(spend) : null,
        revenue: revenue ? parseFloat(revenue) : null,
        roas: roas ? parseFloat(roas) : null,
        ctr: ctr ? parseFloat(ctr) : null,
        cpm: cpm ? parseFloat(cpm) : null,
        conversion_rate: conversion_rate ? parseFloat(conversion_rate) : null,
        cost_per_conversion: cost_per_conversion ? parseFloat(cost_per_conversion) : null,
        impressions: impressions ? parseInt(impressions) : null,
        clicks: clicks ? parseInt(clicks) : null,
        conversions: conversions ? parseInt(conversions) : null,
        performance_start_date: performance_start_date || null,
        performance_end_date: performance_end_date || null,
        ad_copy,
        headline,
        call_to_action,
        creative_url,
        landing_page_url,
        angle,
        target_audience,
        placement,
        objective,
        notes,
        why_it_worked,
        key_insights,
        status: status || 'active'
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating top ad:', error)
      return NextResponse.json({ error: 'Failed to create top ad' }, { status: 500 })
    }

    // Convert database snake_case to frontend camelCase
    const camelCaseTopAd = mapFieldsToFrontend(topAd)
    return NextResponse.json({ topAd: camelCaseTopAd })
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
    // Convert frontend camelCase to database snake_case
    const dbData = mapFieldsToDatabase(body)
    const { 
      id,
      ad_title,
      platform,
      campaign_name,
      ad_set_name,
      spend,
      revenue,
      roas,
      ctr,
      cpm,
      conversion_rate,
      cost_per_conversion,
      impressions,
      clicks,
      conversions,
      performance_start_date,
      performance_end_date,
      ad_copy,
      headline,
      call_to_action,
      creative_url,
      landing_page_url,
      angle,
      target_audience,
      placement,
      objective,
      notes,
      why_it_worked,
      key_insights,
      status
    } = dbData

    if (!id || !ad_title || !platform) {
      return NextResponse.json({ error: 'ID, ad title, and platform are required' }, { status: 400 })
    }

    const { data: topAd, error } = await supabase
      .from('top_ads')
      .update({
        ad_title,
        platform,
        campaign_name,
        ad_set_name,
        spend: spend ? parseFloat(spend) : null,
        revenue: revenue ? parseFloat(revenue) : null,
        roas: roas ? parseFloat(roas) : null,
        ctr: ctr ? parseFloat(ctr) : null,
        cpm: cpm ? parseFloat(cpm) : null,
        conversion_rate: conversion_rate ? parseFloat(conversion_rate) : null,
        cost_per_conversion: cost_per_conversion ? parseFloat(cost_per_conversion) : null,
        impressions: impressions ? parseInt(impressions) : null,
        clicks: clicks ? parseInt(clicks) : null,
        conversions: conversions ? parseInt(conversions) : null,
        performance_start_date: performance_start_date || null,
        performance_end_date: performance_end_date || null,
        ad_copy,
        headline,
        call_to_action,
        creative_url,
        landing_page_url,
        angle,
        target_audience,
        placement,
        objective,
        notes,
        why_it_worked,
        key_insights,
        status: status || 'active'
      })
      .eq('id', id)
      .eq('created_by', user.email) // Ensure user can only update their own ads
      .select()
      .single()

    if (error) {
      console.error('Error updating top ad:', error)
      return NextResponse.json({ error: 'Failed to update top ad' }, { status: 500 })
    }

    // Convert database snake_case to frontend camelCase
    const camelCaseTopAd = mapFieldsToFrontend(topAd)
    return NextResponse.json({ topAd: camelCaseTopAd })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}