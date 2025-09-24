import { useParams, useNavigate } from 'react-router-dom';
import { FileText, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

import { useRequirement, useUpdateRequirement } from '@/hooks/useRequirements';
import { getAllRequirementsRoute, getViewRequirementRoute } from '@/lib/routes';
import { RequirementForm } from '@/components/Requirements/RequirementForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function EditRequirementPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Queries
  const { data: requirementData, isLoading: isRequirementLoading } = useRequirement(id!);

  // Mutations
  const editMutation = useUpdateRequirement();

  async function handleSubmit(values: Record<string, any>) {
    try {
      // Ensure ID is included for edit mode
      const submitData = { ...values, id: id! };
      const result = await editMutation.mutateAsync(submitData);
      toast.success('Requirement updated successfully', {
        description: 'The requirement information has been saved.',
      });

      // Navigate to view page if it exists, otherwise go to all requirements
      if (result?.requirement?.id) {
        navigate(getViewRequirementRoute({ id: result.requirement.id }));
      } else {
        navigate(getAllRequirementsRoute());
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
      toast.error('Failed to update requirement', {
        description: errorMessage,
      });
      throw error; // Re-throw to let form handle it
    }
  }

  if (isRequirementLoading) {
    return (
      <>
        <div className="sticky top-0 z-10 bg-background border-b flex px-6 justify-between gap-2 items-center h-[45px]">
          <div className="flex gap-3 items-center text-sm min-h-[45px]">
            <FileText />
            <span className="text-muted-foreground">Loading requirement...</span>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-9">
              <Card className="bg-secondary mr-2.5 p-6 mb-2.5">
                <div className="space-y-4">
                  <div className="h-8 bg-muted rounded animate-pulse" />
                  <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
                  <div className="h-4 bg-muted rounded w-1/2 animate-pulse" />
                </div>
              </Card>
            </div>
            <div className="lg:col-span-3">
              <Card>
                <CardHeader>
                  <div className="h-6 bg-muted rounded animate-pulse" />
                </CardHeader>
                <CardContent>
                  <div className="h-20 bg-muted rounded animate-pulse" />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!requirementData) {
    return (
      <>
        <div className="sticky top-0 z-10 bg-background border-b flex px-6 justify-between gap-2 items-center h-[45px]">
          <div className="flex gap-3 items-center text-sm min-h-[45px]">
            <FileText />
            <span className="text-destructive">Requirement not found</span>
          </div>
        </div>
        <div className="p-6">
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-700">Requirement Not Found</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-600">The requirement with ID {id} could not be found.</p>
              <div className="mt-4">
                <Button variant="secondary" onClick={() => navigate(getAllRequirementsRoute())}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to All Requirements
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <RequirementForm
        mode="edit"
        requirement={requirementData as any}
        onSubmit={handleSubmit}
        isSubmitting={editMutation.isPending}
      />
    </>
  );
}
