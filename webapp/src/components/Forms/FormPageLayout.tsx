import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ChevronRight } from 'lucide-react';

interface Breadcrumb {
  label: string;
  onClick: () => void | Promise<void>;
}

interface FormPageLayoutProps {
  title?: string;
  onBack?: () => void;
  breadcrumbs?: Breadcrumb[];
  children: ReactNode;
}

const FormPageLayout = ({ title, onBack, breadcrumbs, children }: FormPageLayoutProps) => {
  return (
    <div className="space-y-6 p-6">
      {breadcrumbs ? (
        <div className="space-y-4">
          <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
            {breadcrumbs.map((breadcrumb, index) => (
              <div key={index} className="flex items-center space-x-2">
                {index > 0 && <ChevronRight className="h-4 w-4" />}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 text-sm font-normal hover:text-foreground"
                  onClick={breadcrumb.onClick}
                >
                  {breadcrumb.label}
                </Button>
              </div>
            ))}
          </nav>
        </div>
      ) : (
        title &&
        onBack && (
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          </div>
        )
      )}
      {children}
    </div>
  );
};

export default FormPageLayout;
