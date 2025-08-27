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

const ClientSection = ({
  client,
  totalAmount,
  activeStep,
}: {
  client: StoreClient;
  totalAmount: number;
  activeStep: any;
}) => {
  const {
    order,
    clients,
    activeClientId,
    setActiveClientId,
    visaApplications,
    orderItems,
    setClients,
  } = useOrderStore();

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

  // Get visa type IDs and country IDs from visa applications for this client - memoized to prevent unnecessary re-renders
  const clientVisaApplications = useMemo(() => {
    const filtered = visaApplications.filter(va => {
      const orderItem = orderItems.find(item => item.id === va.orderItemId);
      return orderItem?.clientId === client.id;
    });

    return filtered;
  }, [visaApplications, orderItems, client.id, client.firstName, client.lastName]);

  const visaTypeIds = useMemo(
    () => clientVisaApplications.map(va => va.visaType?.id).filter(Boolean),
    [clientVisaApplications]
  );

  const countryIds = useMemo(
    () => clientVisaApplications.map(va => va.country?.id).filter(Boolean),
    [clientVisaApplications]
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

  // Helper function to filter requirements based on client's countries
  const filterRequirementsForClient = useCallback(
    (requirements: any[]) => {
      if (!countryIds.length) return requirements;

      return requirements.filter(req => {
        // Always include global requirements
        if (req.applicationScope === 'global') {
          return true;
        }

        // Include country_all requirements if they match client's countries
        if (req.applicationScope === 'country_all' && req.countryId) {
          return countryIds.includes(req.countryId);
        }

        // Include specific requirements (they are already filtered by visaTypeId in the API call)
        if (req.applicationScope === 'specific') {
          return true;
        }

        // For requirements without applicationScope, include them (legacy support)
        if (!req.applicationScope) {
          return true;
        }

        return false;
      });
    },
    [countryIds]
  );

  // State to track requirements loading
  const [isLoadingRequirements, setIsLoadingRequirements] = useState(false);

  // Extract visa type IDs and country IDs to stable reference
  const visaTypeIdsString = useMemo(() => visaTypeIds.join(','), [visaTypeIds]);
  const countryIdsString = useMemo(() => countryIds.join(','), [countryIds]);

  useEffect(() => {
    // Reset flag when client, visa applications, visa type IDs, or country IDs change
    requirementsLoadedRef.current = false;
    documentsLoadedRef.current = false;
  }, [client.id, client.citizenship?.id, visaTypeIdsString, countryIdsString]);

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

          // Filter requirements based on client's countries
          const filteredRequirements = filterRequirementsForClient(uniqueRequirements);

          updateClientRequirements(filteredRequirements);
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
    countryIdsString,
    updateClientRequirements,
    filterRequirementsForClient,
    client.citizenship?.id,
    isLoadingRequirements,
    visaTypeIds,
    countryIds,
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

  useEffect(() => {
    if (activeStep?.status === 'draft' && activeClientId === client.id) {
      setEditMode(true);
    } else {
      setEditMode(false);
    }
  }, [activeStep, activeClientId]);

  return (
    <>
      {!editMode && (
        <ClientCard
          client={client}
          totalAmount={totalAmount}
          handleClientEditMode={handleClientEditMode}
          stepStatus={activeStep.status}
        />
      )}
      {editMode && (
        <Card className="bg-secondary m-0 p-6 border-x-0 border-t-0">
          <div className="flex items-center justify-between gap-2 text-lg">
            <ClientBadge client={client} showLinkedClients={false} stepStatus={activeStep.status} />
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
