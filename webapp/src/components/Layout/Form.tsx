import { ReactNode } from 'react';

interface FormPageLayoutProps {
  children: ReactNode;
}

const FormPageLayout = ({ children }: FormPageLayoutProps) => {
  return <div className="space-y-6 p-6">{children}</div>;
};

export default FormPageLayout;
