"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

interface ProjectContextType {
  projects: Project[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
  createProject: (data: Partial<Project>) => Promise<void>;
  updateProject: (id: string, data: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider = ({ children }: { children: ReactNode }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('adhub_token');
      const res = await fetch('/api/proxy/v1/projects', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setProjects(data.projects || []);
    } catch (e: any) {
      setError(e.message || 'Failed to fetch projects');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const refresh = fetchProjects;

  const createProject = async (data: Partial<Project>) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('adhub_token');
      const res = await fetch('/api/proxy/v1/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create project');
      await fetchProjects();
    } catch (e: any) {
      setError(e.message || 'Failed to create project');
    }
    setLoading(false);
  };

  const updateProject = async (id: string, data: Partial<Project>) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('adhub_token');
      const res = await fetch(`/api/proxy/v1/projects/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update project');
      await fetchProjects();
    } catch (e: any) {
      setError(e.message || 'Failed to update project');
    }
    setLoading(false);
  };

  const deleteProject = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('adhub_token');
      const res = await fetch(`/api/proxy/v1/projects/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete project');
      await fetchProjects();
    } catch (e: any) {
      setError(e.message || 'Failed to delete project');
    }
    setLoading(false);
  };

  const value: ProjectContextType = {
    projects,
    loading,
    error,
    refresh,
    createProject,
    updateProject,
    deleteProject,
  };

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
};

export const useProjects = () => {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error('useProjects must be used within a ProjectProvider');
  return ctx;
}; 