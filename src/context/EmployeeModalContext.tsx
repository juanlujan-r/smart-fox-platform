'use client';

import React, { createContext, useContext, useState } from 'react';

interface EmployeeModalContextType {
  isOpen: boolean;
  employeeId: string | null;
  employeeName: string;
  userRole: string;
  openModal: (employeeId: string, employeeName: string, userRole: string) => void;
  closeModal: () => void;
}

const EmployeeModalContext = createContext<EmployeeModalContextType | undefined>(undefined);

export function EmployeeModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [employeeName, setEmployeeName] = useState('');
  const [userRole, setUserRole] = useState('');

  const openModal = (id: string, name: string, role: string) => {
    setEmployeeId(id);
    setEmployeeName(name);
    setUserRole(role);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setEmployeeId(null);
    setEmployeeName('');
    setUserRole('');
  };

  return (
    <EmployeeModalContext.Provider value={{ isOpen, employeeId, employeeName, userRole, openModal, closeModal }}>
      {children}
    </EmployeeModalContext.Provider>
  );
}

export function useEmployeeModal() {
  const context = useContext(EmployeeModalContext);
  if (!context) {
    throw new Error('useEmployeeModal must be used within EmployeeModalProvider');
  }
  return context;
}
