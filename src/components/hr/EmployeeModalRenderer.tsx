'use client';

import { useEmployeeModal } from '@/context/EmployeeModalContext';
import EmployeeDetailModal from './EmployeeDetailModal';

export default function EmployeeModalRenderer() {
  const { isOpen, employeeId, employeeName, userRole } = useEmployeeModal();

  if (!isOpen || !employeeId) return null;

  return (
    <EmployeeDetailModal
      employeeId={employeeId}
      employeeName={employeeName}
      userRole={userRole}
      onClose={() => {
        // Close is handled by context via closeModal button
      }}
    />
  );
}
