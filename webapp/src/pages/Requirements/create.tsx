import { useNavigate } from 'react-router-dom';
import { FileText, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

import { useCreateRequirement } from '@/hooks/useRequirements';
import { getAllRequirementsRoute, getViewRequirementRoute } from '@/lib/routes';
import { RequirementForm } from '@/components/Requirements/RequirementForm';
import { Button } from '@/components/ui/button';

export default function CreateRequirementPage() {
  const navigate = useNavigate();

  // Mutations
  const createMutation = useCreateRequirement();

  async function handleSubmit(values: any) {
    try {
      const result = await createMutation.mutateAsync(values as any);
      toast.success('Requirement created successfully', {
        description: 'The new requirement has been added to the system.',
      });

      // Navigate to view page if it exists, otherwise go to all requirements
      if (result?.requirement?.id) {
        navigate(getViewRequirementRoute({ id: result.requirement.id }));
      } else {
        navigate(getAllRequirementsRoute());
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
      toast.error('Failed to create requirement', {
        description: errorMessage,
      });
      throw error; // Re-throw to let form handle it
    }
  }

  return (
    <>
      <div className="sticky top-0 z-10 bg-background border-b flex px-6 justify-between gap-2 items-center h-[45px]">
        <div className="flex gap-3 items-center text-sm min-h-[45px]">
          <FileText />
          <div className="flex gap-2 items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(getAllRequirementsRoute())}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              All Requirements
            </Button>
            <span className="text-muted-foreground">/</span>
            <span className="font-medium">Create Requirement</span>
          </div>
        </div>
      </div>

      <RequirementForm
        mode="create"
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending}
      />
    </>
  );
}
