import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

const Payment = () => {
  return (
    <>
      <div className="flex gap-3">
        <Button variant="accent">Full payment</Button>
        <Button variant="secondary">Partial payment</Button>
      </div>
      <div className="flex flex-col gap-3">
        <Label>Payment order</Label>
        <div className="flex items-center gap-3">
          <Input type="text" className="w-auto" placeholder="Enter payment order" />
          <div className="flex gap-2">
            <Switch />
            <Label>Cash</Label>
          </div>
        </div>
      </div>
    </>
  );
};

export default Payment;
