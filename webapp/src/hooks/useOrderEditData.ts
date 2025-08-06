import React from 'react';
import { trpc } from '@/lib/trpc';
import { useOrderEditStore } from '@/stores/useOrderEditStore';

// Custom hook to load all data into Zustand store
export const useLoadOrderEditData = (orderId?: string, userId?: string) => {
  const {
    setCountries,
    setCitizenships,
    setContactMethods,
    setVisaApplications,
    setOptimisticPrimaryClientData,
    setCountriesLoading,
    setCitizenshipsLoading,
    setContactMethodsLoading,
    setVisaApplicationsLoading,
    countries,
    citizenships,
    contactMethods,
    visaApplications,
    optimisticPrimaryClientData,
  } = useOrderEditStore();

  // Load countries
  const { data: countriesData, isLoading: countriesLoading } = trpc.country.getAll.useQuery();

  // Load citizenships
  const { data: citizenshipsData, isLoading: citizenshipsLoadingQuery } =
    trpc.citizenship.getAll.useQuery({});

  // Load contact methods
  const { data: contactMethodsData, isLoading: contactMethodsLoadingQuery } =
    trpc.contactMethod.getAll.useQuery();

  // Load visa applications for this order
  const { data: visaApplicationsData, isLoading: visaApplicationsLoadingQuery } =
    trpc.visaApplication.getByOrderId.useQuery({ orderId: orderId || '' }, { enabled: !!orderId });

  // Load primary client data
  const { data: primaryClientData, isLoading: primaryClientLoading } =
    trpc.client.getByUserId.useQuery({ userId: userId || '' }, { enabled: !!userId });

  // Update store when data is loaded
  React.useEffect(() => {
    if (countriesData && !countries) {
      setCountries(countriesData.countries || []);
    }
  }, [countriesData, countries, setCountries]);

  React.useEffect(() => {
    if (citizenshipsData && !citizenships) {
      setCitizenships(citizenshipsData.citizenships || []);
    }
  }, [citizenshipsData, citizenships, setCitizenships]);

  React.useEffect(() => {
    if (contactMethodsData && !contactMethods) {
      setContactMethods(
        contactMethodsData.contactMethods?.map((cm: any) => ({
          ...cm,
          isActive: true, // Default to active since API doesn't provide this
        })) || []
      );
    }
  }, [contactMethodsData, contactMethods, setContactMethods]);

  React.useEffect(() => {
    if (visaApplicationsData && !visaApplications) {
      setVisaApplications(
        visaApplicationsData.visaApplications?.map((va: any) => ({
          ...va,
          visaTypeId: va.visaTypeId || undefined, // Convert null to undefined
          applicationCode: va.applicationCode || undefined, // Convert null to undefined
          plannedCountryEntryDate: va.plannedCountryEntryDate || undefined, // Convert null to undefined
        })) || []
      );
    }
  }, [visaApplicationsData, visaApplications, setVisaApplications]);

  React.useEffect(() => {
    if (primaryClientData && !optimisticPrimaryClientData) {
      setOptimisticPrimaryClientData(primaryClientData);
    }
  }, [primaryClientData, optimisticPrimaryClientData, setOptimisticPrimaryClientData]);

  // Update loading states
  React.useEffect(() => {
    setCountriesLoading(countriesLoading);
  }, [countriesLoading, setCountriesLoading]);

  React.useEffect(() => {
    setCitizenshipsLoading(citizenshipsLoadingQuery);
  }, [citizenshipsLoadingQuery, setCitizenshipsLoading]);

  React.useEffect(() => {
    setContactMethodsLoading(contactMethodsLoadingQuery);
  }, [contactMethodsLoadingQuery, setContactMethodsLoading]);

  React.useEffect(() => {
    setVisaApplicationsLoading(visaApplicationsLoadingQuery);
  }, [visaApplicationsLoadingQuery, setVisaApplicationsLoading]);

  return {
    isLoading:
      countriesLoading ||
      citizenshipsLoadingQuery ||
      contactMethodsLoadingQuery ||
      (!!orderId && visaApplicationsLoadingQuery) ||
      (!!userId && primaryClientLoading),
  };
};

// Hook to load visa types for a specific country
export const useLoadVisaTypes = (countryId: string) => {
  const { setVisaTypesForCountry, getVisaTypesForCountry } = useOrderEditStore();

  const existingVisaTypes = getVisaTypesForCountry(countryId);

  const { data: visaTypesData } = trpc.visaType.getByCountry.useQuery(
    { countryId },
    { enabled: !!countryId }
  );

  React.useEffect(() => {
    if (visaTypesData && existingVisaTypes.length === 0) {
      setVisaTypesForCountry(
        countryId,
        visaTypesData.visaTypes?.map((vt: any) => ({
          ...vt,
          multientryExtraCost: vt.multientryExtraCost || undefined, // Convert null to undefined
          processingValueFixed: vt.processingValueFixed || undefined, // Convert null to undefined
          processingValueMin: vt.processingValueMin || undefined, // Convert null to undefined
          processingValueMax: vt.processingValueMax || undefined, // Convert null to undefined
        })) || []
      );
    }
  }, [visaTypesData, countryId, existingVisaTypes.length, setVisaTypesForCountry]);

  return getVisaTypesForCountry(countryId);
};
