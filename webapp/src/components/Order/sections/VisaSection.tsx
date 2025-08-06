import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import VisaCard from '@/components/Order/VisaCard';
import { shouldShowVisaCard, isPassportExpiringWithin6Months } from '@/stores';

interface VisaSectionProps {
  citizenshipId?: string;
  passportExpirationDate?: Date | null;
  orderData: any;
  primaryClientData: any;
}

export const VisaSection: React.FC<VisaSectionProps> = ({
  citizenshipId,
  passportExpirationDate,
  orderData,
}) => {
  return (
    <>
      {shouldShowVisaCard(citizenshipId, passportExpirationDate || null) ? (
        <VisaCard orderData={orderData} />
      ) : (
        <Alert className="bg-yellow-50 border-yellow-200">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            {!citizenshipId || citizenshipId === 'none'
              ? 'Please select a citizenship to add services.'
              : passportExpirationDate && isPassportExpiringWithin6Months(passportExpirationDate)
                ? 'Passport expires within 6 months. Client should renew their passport before applying for services.'
                : 'Please set passport expiration date to add services.'}
          </AlertDescription>
        </Alert>
      )}

      <hr className="my-6" />
    </>
  );
};
