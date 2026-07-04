'use client';

import { useEffect } from 'react';

export function OrgSwitcher({ defaultOrgId }: { defaultOrgId: string }) {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Check if there's a selected org in localStorage
    const selectedOrgId = localStorage.getItem('selectedOrgId');
    
    if (selectedOrgId && selectedOrgId !== defaultOrgId) {
      // Set cookie and reload
      document.cookie = `selectedOrgId=${selectedOrgId}; path=/; max-age=31536000; SameSite=Lax`;
      window.location.reload();
    } else if (!selectedOrgId) {
      // Set default in localStorage
      localStorage.setItem('selectedOrgId', defaultOrgId);
    }
  }, [defaultOrgId]);

  return null;
}
