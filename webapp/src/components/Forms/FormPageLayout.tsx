import { ReactNode } from 'react';

import { CardContent } from '@/components/ui/card';

interface FormPageLayoutProps {
  breadcrumbs: Array<{
    label: string;
    onClick: () => void;
  }>;
  children: ReactNode;
  saveStatus?: 'idle' | 'saving' | 'saved' | 'error';
  lastSavedTime?: Date | null;
  errorMessage?: string | null;
}

const FormPageLayout = ({ children }: FormPageLayoutProps) => {
  return (
    <>
      <CardContent>{children}</CardContent>
    </>
  );
};

export default FormPageLayout;
