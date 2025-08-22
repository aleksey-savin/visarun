// import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

import ContactData from '@/components/Order/sections/ClientSection/ContactData';
import ClientData from '@/components/Order/sections/ClientSection/ClientData';

import useOrderStore, { StoreClient } from '@/stores/order/order-store';

import ClientBadge from '@/components/Order/sections/ClientSection/ClientBadge';
import ClientCard from '@/components/Order/sections/ClientSection/ClientCard';

import { formatCurrency } from '@/utils/currency';
import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { trpc, trpcClient } from '@/lib/trpc';

const ClientSection = ({ client, totalAmount }: { client: StoreClient; totalAmount: number }) => {
  const { order, clients, activeClientId, setActiveClientId, visaApplications, setClients } =
    useOrderStore();

  const [editMode, setEditMode] = useState(
    clients.length === 1 && !client.citizenship?.id && !client.passportExpirationDate
  );

  const requirementsLoadedRef = useRef(false);
  const documentsLoadedRef = useRef(false);

  const { data: clientDocumentsData } = trpc.clientDocument.getAll.useQuery({
    clientId: client.id,
  });

  // Helper function to transform document response to store format
  const transformDocumentForStore = useCallback(
    (docResponse: any) => ({
      id: docResponse.id,
      clientId: docResponse.clientId,
      requirementId: docResponse.requirementId,
      fileName: docResponse.fileName,
      originalName: docResponse.originalName,
      fileUrl: docResponse.fileUrl,
      fileType: docResponse.fileType,
      fileSize: docResponse.fileSize,
      uploadedAt: docResponse.uploadedAt,
      uploadedById: docResponse.uploadedById,
      isValid: docResponse.isValid,
      expiresAt: docResponse.expiresAt,
      tags: docResponse.tags,
      comment: docResponse.comment,
      reviewedAt: docResponse.reviewedAt || null,
      reviewedById: docResponse.reviewedById || null,
    }),
    []
  );

  // Get visa type IDs from visa applications - memoized to prevent unnecessary re-renders
  const visaTypeIds = useMemo(
    () => visaApplications.map(va => va.visaType?.id).filter(Boolean),
    [visaApplications]
  );

  // Create a stable callback for updating requirements
  const updateClientRequirements = useCallback(
    (requirements: any[]) => {
      const currentClients = useOrderStore.getState().clients;
      const currentClient = currentClients.find(c => c.id === client.id);

      // Only update if requirements are actually different
      const currentReqIds =
        currentClient?.visaRequirements
          ?.map(r => r.id)
          .sort()
          .join(',') || '';
      const newReqIds = requirements
        .map(r => r.id)
        .sort()
        .join(',');

      if (currentReqIds !== newReqIds) {
        setClients(
          currentClients.map(c =>
            c.id === client.id ? { ...c, visaRequirements: requirements } : c
          )
        );
      }
    },
    [client.id, setClients]
  );

  // State to track requirements loading
  const [isLoadingRequirements, setIsLoadingRequirements] = useState(false);

  // Extract visa type IDs to stable reference
  const visaTypeIdsString = useMemo(() => visaTypeIds.join(','), [visaTypeIds]);

  useEffect(() => {
    // Reset flag when client, visa applications, or visa type IDs change
    requirementsLoadedRef.current = false;
    documentsLoadedRef.current = false;
  }, [client.id, client.citizenship?.id, visaTypeIdsString]);

  useEffect(() => {
    const hasValidCitizenship = !!client.citizenship?.id;
    const hasVisaTypes = visaTypeIds.length > 0;

    // Clear requirements if client has no citizenship
    if (!hasValidCitizenship && client.visaRequirements?.length) {
      updateClientRequirements([]);
      return;
    }

    // Load requirements if we have valid citizenship and visa types
    if (
      hasValidCitizenship &&
      hasVisaTypes &&
      !requirementsLoadedRef.current &&
      !isLoadingRequirements
    ) {
      setIsLoadingRequirements(true);

      const fetchRequirements = async () => {
        try {
          const requirementPromises = visaTypeIds.map(visaTypeId =>
            trpcClient.requirement.getByVisaType.query({
              visaTypeId: visaTypeId || '',
              citizenshipId: client.citizenship?.id,
              includeGeneral: true,
            })
          );

          const requirementResults = await Promise.all(requirementPromises);

          // Flatten all requirements arrays and remove duplicates by ID
          const allRequirements = requirementResults
            .flatMap(result => result?.requirements || [])
            .filter((req): req is any => req !== undefined);

          const uniqueRequirements = allRequirements.filter(
            (requirement, index, array) => array.findIndex(r => r?.id === requirement?.id) === index
          );

          updateClientRequirements(uniqueRequirements);
          requirementsLoadedRef.current = true;
        } catch (error) {
          console.error('Error loading requirements:', error);
        } finally {
          setIsLoadingRequirements(false);
        }
      };

      fetchRequirements();
    }
  }, [
    visaTypeIdsString,
    updateClientRequirements,
    client.citizenship?.id,
    isLoadingRequirements,
    visaTypeIds,
    client.visaRequirements?.length,
  ]);

  useEffect(() => {
    if (!clientDocumentsData || documentsLoadedRef.current) return;

    if (clientDocumentsData.clientDocuments) {
      const transformedDocuments =
        clientDocumentsData.clientDocuments.map(transformDocumentForStore);

      const currentClients = useOrderStore.getState().clients;
      setClients(
        currentClients.map(c =>
          c.id === client.id ? { ...c, documents: transformedDocuments } : c
        )
      );
      documentsLoadedRef.current = true;
    }
  }, [setClients, client.id, clientDocumentsData, transformDocumentForStore]);

  const handleClientEditMode = () => {
    if (activeClientId === client.id && order.status !== 'draft') {
      setEditMode(true);
    }

    if (order.status === 'payment_pending' && !client.isPrimary) {
      setEditMode(true);
    }

    if (activeClientId !== client.id && order.status !== 'draft') {
      setActiveClientId(client.id);
    } else if (activeClientId !== client.id && order.status === 'draft') {
      setEditMode(true);
      setActiveClientId(client.id);
    }
  };

  useEffect(() => {
    if (activeClientId !== client.id) {
      setEditMode(false);
    }
  }, [activeClientId, client.id]);

  return (
    <>
      {!editMode && (
        <ClientCard
          client={client}
          totalAmount={totalAmount}
          handleClientEditMode={handleClientEditMode}
        />
      )}
      {editMode && (
        <Card className="bg-secondary m-0 p-6 border-x-0 border-t-0">
          <div className="flex items-center justify-between gap-2 text-lg">
            <ClientBadge client={client} showLinkedClients={false} />
            <span className="text-sm text-foreground">{formatCurrency(totalAmount, 'VND')}</span>
          </div>
          {client.isPrimary && <ContactData />}
          <div className="flex justify-between items-end">
            <ClientData client={client} />
            {order.status !== 'draft' && (
              <Button
                onClick={() => {
                  setEditMode(false);
                  if (order.status === 'payment_pending' && !client.isPrimary) {
                    setActiveClientId('');
                  }
                }}
              >
                Save
              </Button>
            )}
          </div>
        </Card>
      )}
    </>
  );
};

export default ClientSection;
