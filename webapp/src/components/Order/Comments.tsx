import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const Comments = () => {
  return (
    <div className="flex items-center gap-2">
      <Switch checked={false} disabled={true} />
      <Label>Comments</Label>
    </div>
  );
};

export default Comments;
