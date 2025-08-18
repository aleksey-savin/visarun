import { Switch } from '@/components/ui/switch';

import { Label } from '../ui/label';

const OtherRequirements = ({ requirements }: { requirements: any[] }) => {
  // Filter requirements with inputType === 'boolean' (switch type)
  const switchRequirements = requirements.filter((req: any) => req.inputType === 'boolean');

  // If no switch requirements, don't render anything
  if (switchRequirements.length === 0) {
    return null;
  }

  return (
    <>
      <Label className="text-sm">Violations</Label>
      <div className="flex flex-wrap justify-start gap-46">
        {switchRequirements.map((requirement: any) => (
          <div key={requirement.id} className="flex gap-2">
            <Switch id={requirement.id} />
            <Label htmlFor={requirement.id}>{requirement.title}</Label>
          </div>
        ))}
      </div>
    </>
  );
};

export default OtherRequirements;
