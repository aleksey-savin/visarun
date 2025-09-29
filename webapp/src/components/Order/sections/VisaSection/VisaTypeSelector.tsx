import { useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';

import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';

import useOrderStore, { StoreVisaApplication } from '@/stores/order/order-store';

import { trpc } from '@/lib/trpc';
import {
  calculatePlannedCompletionDate,
  isVisaTypeDisabled,
} from '@/utils/visa-completion-calculator';

import type { OrderItem, VisaType } from '@visarun/backend/node_modules/@prisma/client';

const VisaTypeSelector = ({ item, isReadOnly }: { item: OrderItem; isReadOnly: boolean }) => {
  const {
    clients,
    orderItems,
    visaApplications,
    setOrderItems,
    setVisaApplications,
    setSaveStatus,
  } = useOrderStore();

  const visaApplication = visaApplications.find(
    (application: StoreVisaApplication) => application.orderItemId === item.id
  );

  const client = clients.find(c => c.id === item.clientId);

  const [visaTypes, setVisaTypes] = useState<VisaType[]>([]);
  const [selected, setSelected] = useState(visaApplication?.visaType?.id);
  const [isMulti, setIsMulti] = useState(visaApplication?.isMultientry);

  const { data } = trpc.visaType.getAll.useQuery({
    countryId: visaApplication?.country?.id || '',
  });

  useEffect(() => {
    if (data) {
      setVisaTypes(data.visaTypes);
    }
  }, [data]);

  const editVisaApplicationMutation = trpc.visaApplication.edit.useMutation();
  const editOrderItemMutation = trpc.orderItem.edit.useMutation();

  const selectedVisaTypeObject = visaTypes.find((type: VisaType) => type.id === selected);

  // Check if country is blacklisted for this citizenship
  const isCountryBlacklisted = useMemo(() => {
    if (!client?.citizenship?.blacklisted || !visaApplication?.country?.id) {
      return false;
    }
    return client.citizenship.blacklisted.some(
      blacklistedEntry => blacklistedEntry.countryId === visaApplication.country.id
    );
  }, [client?.citizenship?.blacklisted, visaApplication?.country?.id]);

  // Calculate surcharge amount based on client citizenship and visa application country
  const surchargeAmount = useMemo(() => {
    if (!client?.citizenship?.surcharges || !visaApplication?.country?.id || !selected) {
      return 0;
    }

    // First, try to find a specific surcharge for this visa type
    const specificSurcharge = client.citizenship.surcharges.find(
      surcharge => surcharge.countryId === visaApplication.country.id && !surcharge.isGlobal
      // Note: We'd need visaTypeId in the surcharge object to match specific visa types
      // For now, we'll check isGlobal: false for specific surcharges
    );

    if (specificSurcharge) {
      return specificSurcharge.surchargeAmount;
    }

    // Fall back to global surcharge for this country
    const globalSurcharge = client.citizenship.surcharges.find(
      surcharge => surcharge.countryId === visaApplication.country.id && surcharge.isGlobal
    );

    return globalSurcharge?.surchargeAmount || 0;
  }, [client?.citizenship?.surcharges, visaApplication?.country?.id, selected]);

  // Recalculate prices when citizenship or surcharge amount changes
  useEffect(() => {
    const recalculatePrices = async () => {
      if (!visaApplication?.visaType || !visaApplication?.id) {
        return;
      }

      // If country is blacklisted, set prices to 0
      let itemPrice = 0;
      if (!isCountryBlacklisted) {
        const basePrice = visaApplication.visaType.serviceCost || 0;
        const extraCost = visaApplication.isMultientry
          ? visaApplication.visaType.multientryExtraCost || 0
          : 0;
        itemPrice = basePrice + extraCost + surchargeAmount;
      }

      // Only update if the price has actually changed
      if (item.finalPrice !== itemPrice) {
        setSaveStatus('saving');

        const updatedOrderItems = orderItems.map(i =>
          i.id === item.id
            ? {
                ...item,
                basePrice: itemPrice,
                finalPrice: itemPrice,
              }
            : i
        );

        setOrderItems(updatedOrderItems);

        try {
          await editOrderItemMutation.mutateAsync({
            id: item.id || '',
            basePrice: itemPrice,
            finalPrice: itemPrice,
          });

          setSaveStatus('saved');
        } catch {
          setSaveStatus('error');
        }
      }
    };

    recalculatePrices();
  }, [
    client?.citizenship?.id,
    isCountryBlacklisted,
    surchargeAmount,
    visaApplication?.visaType?.serviceCost,
    visaApplication?.visaType?.multientryExtraCost,
    visaApplication?.isMultientry,
    visaApplication?.id,
    visaApplication?.visaType,
    item,
    editOrderItemMutation,
    orderItems,
    setOrderItems,
    setSaveStatus,
  ]);

  const handleVisaTypeSelect = async (id: string) => {
    setSaveStatus('saving');

    setSelected(id);

    if (!visaApplication?.id) {
      setSaveStatus('error');
      return;
    }

    const visaTypeObject = visaTypes.find((type: VisaType) => type.id === id);

    if (!visaTypeObject) {
      setSaveStatus('error');
      return;
    }

    // If country is blacklisted, set prices to 0
    let itemPrice = 0;
    if (!isCountryBlacklisted) {
      const basePrice = visaTypeObject.serviceCost || 0;
      const extraCost = visaApplication?.isMultientry ? visaTypeObject.multientryExtraCost || 0 : 0;
      itemPrice = basePrice + extraCost + surchargeAmount;
    }

    const updatedOrderItems = orderItems.map(i =>
      i.id === item.id
        ? {
            ...item,
            basePrice: itemPrice,
            finalPrice: itemPrice,
          }
        : i
    );

    setOrderItems(updatedOrderItems);

    // Calculate planned completion date
    const plannedCompletionDate = calculatePlannedCompletionDate(
      visaTypeObject.processingMode && visaTypeObject.processingUnit
        ? {
            processingMode: visaTypeObject.processingMode,
            processingUnit: visaTypeObject.processingUnit,
            processingValueFixed: visaTypeObject.processingValueFixed,
            processingValueMax: visaTypeObject.processingValueMax,
          }
        : null,
      visaApplication?.plannedCountryExitDate
        ? new Date(visaApplication.plannedCountryExitDate)
        : null,
      visaApplication?.clientIsInTheCountry || false
    );

    const updatedVisaApplications = visaApplications.map(application =>
      application.orderItemId === item.id
        ? {
            ...application,
            visaType: visaTypeObject,
            ...(plannedCompletionDate && { plannedCompletionDate }),
          }
        : application
    );

    setVisaApplications(updatedVisaApplications);

    try {
      const mutationData: any = {
        id: visaApplication?.id || '',
        visaTypeId: id,
      };

      if (plannedCompletionDate) {
        mutationData.plannedCompletionDate = plannedCompletionDate.toISOString();
      }

      await editVisaApplicationMutation.mutateAsync(mutationData);

      await editOrderItemMutation.mutateAsync({
        id: item?.id || '',
        basePrice: itemPrice,
        finalPrice: itemPrice,
      });

      setSaveStatus('saved');
    } catch {
      setSaveStatus('error');
    }

    setSaveStatus('saved');
  };

  const handleMulti = async (isMultientry: boolean) => {
    setSaveStatus('saving');

    setIsMulti(isMultientry);

    if (!visaApplication?.id || !selectedVisaTypeObject) {
      setSaveStatus('error');
      return;
    }

    // If country is blacklisted, set prices to 0
    let itemPrice = 0;
    if (!isCountryBlacklisted) {
      const basePrice = selectedVisaTypeObject.serviceCost || 0;
      const extraCost = isMultientry ? selectedVisaTypeObject.multientryExtraCost || 0 : 0;
      itemPrice = basePrice + extraCost + surchargeAmount;
    }

    const updatedOrderItems = orderItems.map(i =>
      i.id === item.id
        ? {
            ...item,
            basePrice: itemPrice,
            finalPrice: itemPrice,
          }
        : i
    );

    setOrderItems(updatedOrderItems);

    const updatedVisaApplications = visaApplications.map(v =>
      v.id === visaApplication.id
        ? {
            ...v,
            isMultientry: isMultientry,
          }
        : v
    );

    setVisaApplications(updatedVisaApplications);

    try {
      await editVisaApplicationMutation.mutateAsync({
        id: visaApplication?.id || '',
        isMultientry: isMultientry,
      });

      await editOrderItemMutation.mutateAsync({
        id: item?.id || '',
        basePrice: itemPrice,
        finalPrice: itemPrice,
      });

      setSaveStatus('saved');
    } catch {
      setSaveStatus('error');
    }

    setSaveStatus('saved');
  };

  useEffect(() => {
    // Sync local state with visaApplication data whenever it changes
    setSelected(visaApplication?.visaType?.id);
    setIsMulti(visaApplication?.isMultientry);
  }, [visaApplication?.visaType?.id, visaApplication?.isMultientry]);

  return (
    <>
      <Label className={cn('text-sm mb-2')}>Visa type</Label>
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {(() => {
            const sortedVisaTypes =
              visaTypes?.sort((a: VisaType, b: VisaType) => {
                // Sort favorites first
                if (a.favourite && !b.favourite) return -1;
                if (!a.favourite && b.favourite) return 1;

                // Then sort by processing unit: days first, then hours
                if (a.processingUnit === 'days' && b.processingUnit === 'hours') return -1;
                if (a.processingUnit === 'hours' && b.processingUnit === 'days') return 1;

                // Finally sort alphabetically
                return b.name.localeCompare(a.name);
              }) || [];

            // Group visa types
            const favorites = sortedVisaTypes.filter((vt: VisaType) => vt.favourite);
            const nonFavorites = sortedVisaTypes.filter((vt: VisaType) => !vt.favourite);
            const nonFavoritesDays = nonFavorites.filter(
              (vt: VisaType) => vt.processingUnit === 'days'
            );
            const nonFavoritesHours = nonFavorites.filter(
              (vt: VisaType) => vt.processingUnit === 'hours'
            );

            const renderVisaTypeButton = (visaType: VisaType, isLastInGroup: boolean = false) => {
              const isSelected = visaType.id === selected;
              const isDisabled =
                visaType.processingMode && visaType.processingUnit
                  ? isVisaTypeDisabled(
                      {
                        processingMode: visaType.processingMode,
                        processingUnit: visaType.processingUnit,
                        processingValueFixed: visaType.processingValueFixed,
                        processingValueMax: visaType.processingValueMax,
                      },
                      visaApplication?.clientIsInTheCountry || false
                    )
                  : false;

              return (
                <Button
                  key={visaType.id}
                  variant={isSelected ? 'accent' : 'secondary'}
                  size="sm"
                  type="button"
                  disabled={isDisabled || isReadOnly}
                  onClick={event => {
                    event?.preventDefault();
                    event?.stopPropagation();
                    handleVisaTypeSelect(visaType.id);
                  }}
                  className={`transition-all duration-200 ${isLastInGroup ? 'mr-2' : ''} ${
                    isDisabled ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {visaType.name}
                </Button>
              );
            };

            const result: React.ReactElement[] = [];

            // Add favorites
            favorites.forEach((visaType, index) => {
              const isLastInGroup =
                index === favorites.length - 1 &&
                (nonFavoritesDays.length > 0 || nonFavoritesHours.length > 0);
              result.push(renderVisaTypeButton(visaType, isLastInGroup));
            });

            // Add days processing
            nonFavoritesDays.forEach((visaType, index) => {
              const isLastInGroup =
                index === nonFavoritesDays.length - 1 && nonFavoritesHours.length > 0;
              result.push(renderVisaTypeButton(visaType, isLastInGroup));
            });

            // Add hours processing
            nonFavoritesHours.forEach(visaType => {
              result.push(renderVisaTypeButton(visaType));
            });

            return result;
          })()}
          <div className="flex items-center gap-2">
            <Switch
              checked={isMulti}
              onCheckedChange={() => handleMulti(!isMulti)}
              disabled={!selectedVisaTypeObject?.isMultientry || isReadOnly}
              className="ml-2"
            />
            <Label>Multi</Label>
          </div>
        </div>
      </div>
    </>
  );
};

export default VisaTypeSelector;
