import { useState, useEffect } from 'react';

import { trpc } from '@/lib/trpc';

import useOrderStore, { StoreClient } from '@/stores/order/order-store';

import DocumentsUpload from '../DocumentsUpload';

const PersonalData = ({ client }: { client: StoreClient }) => {
  const { visaApplications } = useOrderStore();

  const visaTypeIds = visaApplications.map(va => va.visaType?.id).filter(Boolean);

  const [visaRequirements, setVisaRequirements] = useState<Set<any>>(new Set());

  const requirementQueries = visaTypeIds.map(visaTypeId =>
    trpc.requirement.getByVisaType.useQuery({
      visaTypeId: visaTypeId || '',
      citizenshipId: client?.citizenship?.id,
      includeGeneral: true,
    })
  );

  useEffect(() => {
    // Check if all queries have data
    const allData = requirementQueries.map(query => query.data?.requirements).filter(Boolean);

    if (allData.length === visaTypeIds.length) {
      // Flatten all requirements arrays and remove duplicates by ID
      const allRequirements = allData.flat().filter((req): req is any => req !== undefined);
      const uniqueRequirements = allRequirements.filter(
        (requirement, index, array) => array.findIndex(r => r?.id === requirement?.id) === index
      );

      setVisaRequirements(new Set(uniqueRequirements));
    }
  }, [requirementQueries.map(q => q.data).join(',')]);

  const visaRequirmentsDocuments = Array.from(visaRequirements).filter(
    (item: any) => item.inputType === 'document'
  );

  return <DocumentsUpload requirements={visaRequirmentsDocuments} client={client} />;
};

export default PersonalData;
