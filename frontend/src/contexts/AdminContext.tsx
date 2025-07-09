"use client";

import React, { createContext, useContext } from "react";

// Create a context to share admin status across all admin pages
const AdminContext = createContext<{ isAdmin: boolean }>({ isAdmin: false });

export const useAdminContext = () => useContext(AdminContext);

export const AdminProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <AdminContext.Provider value={{ isAdmin: true }}>
      {children}
    </AdminContext.Provider>
  );
}; 