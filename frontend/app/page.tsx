'use client';

import dynamic from 'next/dynamic';
import React from 'react';

const DashboardApp = dynamic(() => import('@/components/DashboardApp'), {
  ssr: false,
});

export default function Page() {
  return <DashboardApp />;
}
