import { Switch } from '@/components/ui/switch';
import { Label } from '../ui/label';
import useOrderStore, { StoreClient } from '@/stores/order/order-store';
import { trpcClient } from '@/lib/trpc';
import type { Requirement } from '@visarun/backend/node_modules/@prisma/client';

const OtherRequirements = ({
  requirements,
  client,
}: {
  requirements: Requirement[];
  client: StoreClient;
}) => {
  const { activeClientId, clients, setClients, setSaveStatus } = useOrderStore();

  // Filter requirements with inputType === 'boolean' (switch type)
  const switchRequirements = requirements.filter((req: Requirement) => req.inputType === 'boolean');

  const handleSwitchChange = async (requirementId: string, checked: boolean) => {
    if (!client) return;

    setSaveStatus('saving');

    try {
      // Check if ClientRequirement already exists
      const existingRequirement = client.requirements?.find(
        req => req.requirementId === requirementId
      );

      if (existingRequirement) {
        // Update existing ClientRequirement
        await trpcClient.clientRequirement.update.mutate({
          id: existingRequirement.id,
          booleanValue: checked,
        });
      } else {
        // Create new ClientRequirement
        await trpcClient.clientRequirement.create.mutate({
          clientId: activeClientId,
          requirementId: requirementId,
          booleanValue: checked,
        });
      }

      // Update the client in the store with the new requirement data
      const updatedClients = clients.map(c => {
        if (c.id === activeClientId) {
          const updatedRequirements = c.requirements ? [...c.requirements] : [];

          if (existingRequirement) {
            // Update existing requirement
            const reqIndex = updatedRequirements.findIndex(
              req => req.requirementId === requirementId
            );
            if (reqIndex !== -1) {
              updatedRequirements[reqIndex] = {
                ...updatedRequirements[reqIndex],
                booleanValue: checked,
              };
            }
          } else {
            // Add new requirement
            updatedRequirements.push({
              id: Date.now().toString(),
              clientId: activeClientId,
              requirementId: requirementId,
              booleanValue: checked,
              textValue: null,
              dateValue: null,
              checkpointValue: null,
              reviewedById: null,
              comment: null,
              reviewedAt: null,
              submittedAt: null,
            });
          }

          return {
            ...c,
            requirements: updatedRequirements,
          };
        }
        return c;
      });

      setClients(updatedClients);
      setSaveStatus('saved');
    } catch (error) {
      console.error('Error updating client requirement:', error);
      setSaveStatus('error');
    }
  };

  const getRequirementValue = (requirementId: string) => {
    if (!client?.requirements) return false;
    const requirement = client.requirements.find(req => req.requirementId === requirementId);
    return requirement?.booleanValue === true;
  };

  return (
    <>
      <Label className="text-sm">Violations</Label>
      <div className="flex flex-wrap justify-start gap-46">
        {switchRequirements.map((requirement: Requirement) => {
          const isChecked = getRequirementValue(requirement.id);

          return (
            <div key={requirement.id} className="flex gap-2">
              <Switch
                id={requirement.id}
                checked={isChecked}
                onCheckedChange={checked => handleSwitchChange(requirement.id, checked)}
              />
              <Label htmlFor={requirement.id}>{requirement.title}</Label>
            </div>
          );
        })}
      </div>
    </>
  );
};

export default OtherRequirements;
