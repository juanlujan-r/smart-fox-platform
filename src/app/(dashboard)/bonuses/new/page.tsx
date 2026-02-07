"use client";

import { Suspense } from 'react';
import BonusFormPage from '../[id]/edit/page';

export default function NewBonusPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BonusFormPage />
    </Suspense>
  );
}
