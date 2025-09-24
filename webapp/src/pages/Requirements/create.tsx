import { useNavigate } from 'react-router-dom';

import { toast } from 'sonner';

import { useCreateRequirement } from '@/hooks/useRequirements';
import { getAllRequirementsRoute, getViewRequirementRoute } from '@/lib/routes';
import { RequirementForm } from '@/components/Requirements/RequirementForm';

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
      <RequirementForm
        mode="create"
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending}
      />
    </>
  );
}
