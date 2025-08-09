import { cn } from '@/lib/utils';

import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';

import { formatCurrency } from '@/utils/currency';

import useOrderStore from '@/stores/order/order-store';

import { trpc } from '@/lib/trpc';

import { OrderItem } from '@/types/OrderItem';
import { useState, useEffect } from 'react';

import { VisaApplication } from '@/types/VisaApplication';

const VisaTypeSelector = ({ item }: { item: OrderItem }) => {
  const { visaApplication } = item;
  const { orderItems, setOrderItems, setSaveStatus } = useOrderStore();

  const [visaTypes, setVisaTypes] = useState<any[]>([]);

  const [selected, setSelected] = useState(item.visaApplication?.visaType?.id);
  const [isMulti, setIsMulti] = useState(item.visaApplication?.isMultientry);

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

  const selectedVisaTypeObject = visaTypes.find(type => type.id === selected);

  const handleVisaTypeSelect = async (id: string) => {
    setSaveStatus('saving');

    setSelected(id);

    if (!item.visaApplication?.id) {
      setSaveStatus('error');
      return;
    }

    const visaTypeObject = visaTypes.find(type => type.id === id);

    const basePrice = visaTypeObject.serviceCost || 0;
    const extraCost = item?.visaApplication?.isMultientry
      ? visaTypeObject.multientryExtraCost || 0
      : 0;
    const itemPrice = basePrice + extraCost;

    const updatedOrderItems = orderItems.map(i =>
      i.id === item.id
        ? {
            ...item,
            basePrice: itemPrice,
            finalPrice: itemPrice,
            visaApplication: {
              ...item.visaApplication,
              visaType: visaTypeObject,
            } as VisaApplication,
          }
        : i
    );

    setOrderItems(updatedOrderItems);

    try {
      await editVisaApplicationMutation.mutateAsync({
        id: item.visaApplication?.id || '',
        visaTypeId: id,
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

  const handleMulti = async (isMultientry: boolean) => {
    setSaveStatus('saving');

    setIsMulti(isMultientry);

    if (!item.visaApplication?.id) {
      setSaveStatus('error');
      return;
    }

    const basePrice = selectedVisaTypeObject.serviceCost || 0;
    const extraCost = isMultientry ? selectedVisaTypeObject.multientryExtraCost || 0 : 0;
    const itemPrice = basePrice + extraCost;

    const updatedOrderItems = orderItems.map(i =>
      i.id === item.id
        ? {
            ...item,
            basePrice: itemPrice,
            finalPrice: itemPrice,
            visaApplication: {
              ...item.visaApplication,
              isMultientry: isMultientry,
            } as VisaApplication,
          }
        : i
    );

    setOrderItems(updatedOrderItems);

    try {
      await editVisaApplicationMutation.mutateAsync({
        id: item.visaApplication?.id || '',
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

  return (
    <>
      <Label className={cn('text-sm mb-2')}>Visa type</Label>
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex items-center gap-2">
          {(() => {
            const sortedVisaTypes =
              visaTypes?.sort((a: any, b: any) => {
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
            const favorites = sortedVisaTypes.filter((vt: any) => vt.favourite);
            const nonFavorites = sortedVisaTypes.filter((vt: any) => !vt.favourite);
            const nonFavoritesDays = nonFavorites.filter((vt: any) => vt.processingUnit === 'days');
            const nonFavoritesHours = nonFavorites.filter(
              (vt: any) => vt.processingUnit === 'hours'
            );

            const renderVisaTypeButton = (visaType: any, isLastInGroup: boolean = false) => {
              const isSelected = visaType.id === selected;

              return (
                <Button
                  key={visaType.id}
                  variant={isSelected ? 'accent' : 'secondary'}
                  size="sm"
                  type="button"
                  onClick={event => {
                    event?.preventDefault();
                    event?.stopPropagation();
                    handleVisaTypeSelect(visaType.id);
                  }}
                  className={`transition-all duration-200 ${isLastInGroup ? 'mr-2' : ''}`}
                >
                  {(visaType as any).name}
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

          <Switch
            checked={isMulti}
            onCheckedChange={() => handleMulti(!isMulti)}
            disabled={!selectedVisaTypeObject?.isMultientry}
            className="ml-2"
          />
          <Label>Multi</Label>
        </div>
        <span>{formatCurrency(item?.finalPrice || 0, 'VND')}</span>
      </div>
      {/**

      {/** <div className="flex justify-end items-center">
        <span className="font-semibold">
          {(() => {
            // If client is blacklisted, price is 0
            if (disabled) {
              return formatCurrency(0, 'VND');
            }

            // Check if we have an actual order item with finalPrice (includes surcharges)
            const orderItemId = createdOrderItems[countryId];
            const currentOrder = optimisticOrder || orderData?.order;

            if (orderItemId && currentOrder?.items) {
              const orderItem = currentOrder.items.find((item: any) => item.id === orderItemId);
              if (orderItem) {
                // Use finalPrice if > 0, otherwise fall back to basePrice
                const displayPrice =
                  orderItem.finalPrice > 0 ? orderItem.finalPrice : orderItem.basePrice;
                return formatCurrency(displayPrice, 'VND');
              }
            }

            // Fallback to calculated price if no order item exists yet
            const basePrice = selectedVisaTypeData?.serviceCost || 0;
            const isMultientry = currentMultientryState;
            const extraCost = isMultientry ? selectedVisaTypeData?.multientryExtraCost || 0 : 0;
            const totalPrice = basePrice + extraCost;

            return formatCurrency(totalPrice, 'VND');
          })()}
        </span>
      </div> **/}
    </>
  );
};

export default VisaTypeSelector;
