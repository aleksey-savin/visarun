import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

import AddVisarun from '@/components/Order/sections/VisarunSection/AddVisarun';
import AddVisa from '@/components/Order/sections/VisaSection/AddVisa';

import { Client } from '@/types/Client.js';

const ServicePuzzle = ({ client }: { client: Client }) => {
  const [activeService, setActiveService] = useState('visa');

  const isDisabled = !client.citizenshipId || !client.passportExpirationDate;

  const handleServiceButtonClick = (service: string) => {
    setActiveService(service);
  };

  return (
    <>
      {activeService === 'visa' && <AddVisa client={client} />}
      {activeService === 'visarun' && <AddVisarun />}
      <div className="flex justify-end mt-6">
        <Button type="button">Confirm</Button>
      </div>
      <Card className="mt-6 p-0 bg-muted border-none">
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="font-medium">Service puzzle</div>
            <Card className="flex items-center gap-1 p-1 bg-secondary rounded-md border-none">
              <div className="flex gap-2">
                <Button
                  disabled={isDisabled}
                  variant={activeService === 'visa' ? 'accent' : 'secondary'}
                  size="sm"
                  className="border-none"
                  onClick={() => handleServiceButtonClick('visa')}
                >
                  Visa
                </Button>
                <Button
                  disabled={isDisabled}
                  variant={activeService === 'visarun' ? 'accent' : 'secondary'}
                  size="sm"
                  className="border-none"
                  onClick={() => handleServiceButtonClick('visarun')}
                >
                  Visarun
                </Button>
                <Button disabled variant="secondary" size="sm" className="border-none">
                  Acceleration
                </Button>
              </div>
            </Card>
            <div className="flex gap-2">
              <Button disabled variant="secondary" size="sm" className="border-none">
                + Transfer
              </Button>
              <Button disabled variant="secondary" size="sm" className="border-none">
                + Currency Exchange
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default ServicePuzzle;
