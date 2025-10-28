import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import BankingDetailsUpload from '@/components/Order/sections/CurrencyExchangeSection/BankingDetailsUpload';
import { useState } from 'react';

type BankingDetailsProps = {
  saveBankingDetails: (
    bankingDetailsType: 'card' | 'file',
    bankName: string,
    cardOrPhoneNumber: string,
    holderName: string,
    holderSurname: string,
    documentUrl: string | null
  ) => void;
  existingBankingDetails?:
    | {
        id: string;
        content?: string | null;
        documentUrl?: string | null;
        clientId: string;
      }
    | undefined;
};

const BankingDetailsCard = ({
  saveBankingDetails,
  existingBankingDetails,
}: BankingDetailsProps) => {
  const [bankingDetailsType, setBankingDetailsType] = useState<'card' | 'file'>(
    existingBankingDetails?.documentUrl ? 'file' : 'card'
  );
  const handleBankingDetailsTypeChange = (value: string) => {
    if (value === 'card' || value === 'file') setBankingDetailsType(value);
  };

  const [bankName, setBankName] = useState(existingBankingDetails?.content?.split('|')[0] || '');
  const [cardOrPhoneNumber, setCardOrPhoneNumber] = useState(
    existingBankingDetails?.content?.split('|')[1] || ''
  );
  const [holderName, setHolderName] = useState(
    existingBankingDetails?.content?.split('|')[2] || ''
  );
  const [holderSurname, setHolderSurname] = useState(
    existingBankingDetails?.content?.split('|')[3] || ''
  );

  const handleOnBlur = () => {
    saveBankingDetails(
      bankingDetailsType,
      bankName,
      cardOrPhoneNumber,
      holderName,
      holderSurname,
      ''
    );
  };

  const handleDocumentUpload = (documentUrl: string) => {
    saveBankingDetails(
      bankingDetailsType,
      bankName,
      cardOrPhoneNumber,
      holderName,
      holderSurname,
      documentUrl
    );
  };

  const handleDocumentDelete = () => {
    saveBankingDetails(
      bankingDetailsType,
      bankName,
      cardOrPhoneNumber,
      holderName,
      holderSurname,
      null
    );
  };

  return (
    <Card className="p-3 bg-secondary gap-5">
      {/*Tabs Card or File*/}
      <div>
        <Tabs
          value={bankingDetailsType}
          className="w-[400px]"
          onValueChange={handleBankingDetailsTypeChange}
        >
          <TabsList>
            <TabsTrigger value="card">Card/Phone</TabsTrigger>
            <TabsTrigger value="file">QR/File</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {bankingDetailsType == 'card' ? (
        <div className="flex flex-wrap justify-start items-center gap-6">
          {/*Bank section*/}
          <div>
            <Label htmlFor="bank-name-input" className="mb-2">
              Bank
            </Label>
            <div className="flex flex-wrap gap-1.5">
              <Input
                placeholder="Bank name"
                value={bankName}
                onChange={e => {
                  setBankName(e.target.value);
                }}
                onBlur={handleOnBlur}
                className={
                  'bg-secondary appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none'
                }
              />
            </div>
          </div>

          {/*Card section*/}
          <div>
            <Label htmlFor="card-input" className="mb-2">
              Card / phone number
            </Label>
            <div className="flex flex-wrap gap-1.5">
              <Input
                placeholder="Card or phone number"
                value={cardOrPhoneNumber}
                onChange={e => {
                  setCardOrPhoneNumber(e.target.value);
                }}
                onBlur={handleOnBlur}
                className={
                  'bg-secondary appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none'
                }
              />
            </div>
          </div>

          {/*Holder section*/}
          <div>
            <Label htmlFor="holder-input" className="mb-2">
              Holder name
            </Label>
            <div className="flex flex-wrap gap-1.5">
              <div>
                <Input
                  placeholder="Name"
                  value={holderName}
                  onChange={e => {
                    setHolderName(e.target.value);
                  }}
                  onBlur={handleOnBlur}
                  className={
                    'bg-secondary appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none'
                  }
                />
              </div>
              <div>
                <Input
                  placeholder="Surname"
                  value={holderSurname}
                  onChange={e => {
                    setHolderSurname(e.target.value);
                  }}
                  onBlur={handleOnBlur}
                  className={
                    'bg-secondary appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none'
                  }
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap justify-start items-center gap-6">
          {/*File section*/}
          <div className="w-full">
            <Label htmlFor="bank-name-input" className="mb-2">
              QR/File
            </Label>
            <div className="flex flex-wrap gap-1.5">
              <BankingDetailsUpload
                existingBankingDetails={existingBankingDetails}
                handleDocumentUpload={handleDocumentUpload}
                handleDocumentDelete={handleDocumentDelete}
              />
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default BankingDetailsCard;
