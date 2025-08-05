import { useState, useEffect, useCallback, memo, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { cn } from '@/lib/utils';
import { formatCurrency } from '@/utils/currency.js';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';

import { trpc } from '@/lib/trpc';
import { useDebouncedCallback } from '../../hooks/useDebounce';

import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { AlertCircle } from 'lucide-react';

interface OrderItemUpdate {
  serviceTypeId?: string;
  note?: string;
  basePrice?: number;
  finalPrice?: number;
  visaTypeId?: string;
}

interface VisaSectionProps {
  orderData: any;
  primaryClientData: any;
  setErrorMessage: (message: string) => void;
  updateOrderMutation?: any;
  setLastSavedTime?: (time: Date) => void;
  setSaveStatus?: (status: 'idle' | 'saving' | 'saved' | 'error') => void;

  updateOptimisticOrderItem?: (
    orderItemId: string,
    updates: { visaTypeId?: string; basePrice?: number; finalPrice?: number }
  ) => void;
  addOptimisticOrderItem?: (newOrderItem: any) => void;
  removeOptimisticOrderItem?: (orderItemId: string) => void;
}

const VisaSection = ({
  orderData,
  primaryClientData,
  setErrorMessage,
  updateOrderMutation,
  setLastSavedTime,
  setSaveStatus,
  updateOptimisticOrderItem,
  addOptimisticOrderItem,
  removeOptimisticOrderItem,
}: VisaSectionProps) => {
  const [addedCountryCards, setAddedCountryCards] = useState<Set<string>>(new Set());
  const [selectedVisaTypes, setSelectedVisaTypes] = useState<Record<string, string>>({});
  const [entryDates, setEntryDates] = useState<Record<string, Date | null>>({});
  const [entryTimes, setEntryTimes] = useState<Record<string, string>>({});
  const [autosaveStatus, setAutosaveStatus] = useState<
    Record<string, 'idle' | 'saving' | 'saved' | 'error'>
  >({});
  const [visaApplications, setVisaApplications] = useState<Record<string, any>>({});
  const [isMultientryEnabled, setIsMultientryEnabled] = useState<Record<string, boolean>>({});

  // Track when visa type updates are in progress
  const visaTypeUpdateInProgress = useRef<boolean>(false);

  // Query client for cache invalidation
  const queryClient = useQueryClient();

  // Fetch countries from database
  const { data: countriesData } = trpc.country.getAll.useQuery();

  // Fetch existing visa order items for this order
  const { data: visaOrderItemsData, refetch: refetchVisaOrderItems } =
    trpc.orderItem.getAllByOrderId.useQuery(
      { orderId: orderData?.order?.id || '' },
      { enabled: !!orderData?.order?.id }
    );

  // Fetch visa applications for this order
  const { data: visaApplicationsData, refetch: refetchVisaApplications } =
    trpc.visaApplication.getByOrderId.useQuery(
      { orderId: orderData?.order?.id || '' },
      { enabled: !!orderData?.order?.id }
    );

  // State for selected countries and their cards
  const [createdOrderItems, setCreatedOrderItems] = useState<Record<string, string>>({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [countryToDelete, setCountryToDelete] = useState<string | null>(null);

  // Order item mutations
  const createOrderItemMutation = trpc.orderItem.create.useMutation({
    onSuccess: async () => {
      await refetchVisaOrderItems();
      // Invalidate relevant queries for optimistic updates
      queryClient.invalidateQueries({ queryKey: ['orderItems'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      // Update order timestamp to reflect changes
      if (updateOrderMutation && orderData?.order) {
        try {
          await updateOrderMutation.mutateAsync({
            id: orderData.order.id,
            status: orderData.order.status,
          });
        } catch (error) {
          console.error('Failed to update order timestamp:', error);
        }
      }
      // Update save status in UI
      if (setLastSavedTime && setSaveStatus) {
        setLastSavedTime(new Date());
        setSaveStatus('saved');
      }
    },
  });
  const updateOrderItemMutation = trpc.orderItem.edit.useMutation({
    onSuccess: async () => {
      await refetchVisaOrderItems();
      await refetchVisaApplications();
      // Invalidate relevant queries for optimistic updates
      queryClient.invalidateQueries({ queryKey: ['orderItems'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['visaApplications'] });
      // Update order timestamp to reflect changes
      if (updateOrderMutation && orderData?.order) {
        try {
          await updateOrderMutation.mutateAsync({
            id: orderData.order.id,
            status: orderData.order.status,
          });
        } catch (error) {
          console.error('Failed to update order timestamp:', error);
        }
      }
      // Update save status in UI
      if (setLastSavedTime && setSaveStatus) {
        setLastSavedTime(new Date());
        setSaveStatus('saved');
      }
      // Note: Removed order refetch trigger - now using optimistic UI updates
      if (visaTypeUpdateInProgress.current) {
        visaTypeUpdateInProgress.current = false;
      }
    },
    onError: (error, variables) => {
      console.error('Failed to update order item:', error);
      setErrorMessage('Failed to save changes. Please try again.');
      // Update autosave status to error for the specific country
      const countryId = Object.keys(createdOrderItems).find(
        key => createdOrderItems[key] === variables.id
      );
      if (countryId) {
        setAutosaveStatus(prev => ({ ...prev, [countryId]: 'error' }));
      }
    },
  });
  const deleteOrderItemMutation = trpc.orderItem.delete.useMutation({
    onSuccess: async () => {
      await refetchVisaOrderItems();
      await refetchVisaApplications();
      // Invalidate relevant queries for optimistic updates
      queryClient.invalidateQueries({ queryKey: ['orderItems'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['visaApplications'] });
      // Update order timestamp to reflect changes
      if (updateOrderMutation && orderData?.order) {
        try {
          await updateOrderMutation.mutateAsync({
            id: orderData.order.id,
            status: orderData.order.status,
          });
        } catch (error) {
          console.error('Failed to update order timestamp:', error);
        }
      }
      // Update save status in UI
      if (setLastSavedTime && setSaveStatus) {
        setLastSavedTime(new Date());
        setSaveStatus('saved');
      }
    },
  });

  // Request queue to prevent race conditions
  const requestQueue = useRef<Map<string, { updates: OrderItemUpdate; timestamp: number }>>(
    new Map()
  );

  // Visa application mutations
  const updateVisaApplicationMutation = trpc.visaApplication.edit.useMutation({
    onSuccess: async () => {
      await refetchVisaApplications();
      // Update save status in UI with optimistic update
      if (setLastSavedTime && setSaveStatus) {
        setLastSavedTime(new Date());
        setSaveStatus('saved');
      }
    },
    onError: error => {
      console.error('Failed to update visa application:', error);
      setErrorMessage('Failed to save visa changes. Please try again.');
    },
  });

  // Optimistic autosave function with request queuing
  const debouncedUpdateOrderItem = useDebouncedCallback(
    (orderItemId: string, updates: OrderItemUpdate, countryId: string) => {
      // Validate inputs
      if (!orderItemId || !countryId || !updates) {
        console.warn('Invalid autosave parameters:', { orderItemId, countryId, updates });
        return;
      }

      // Check if order is still in draft status
      if (orderData?.order?.status !== 'draft') {
        setErrorMessage('Cannot save changes - order is no longer in draft status');
        return;
      }

      // Queue the request - newer requests override older ones for the same order item
      const timestamp = Date.now();
      requestQueue.current.set(orderItemId, { updates, timestamp });

      // Show saving status immediately (optimistic)
      setAutosaveStatus(prev => ({ ...prev, [countryId]: 'saving' }));
      if (setSaveStatus) {
        setSaveStatus('saving');
      }

      // Process the queue after a short delay to allow for rapid changes
      setTimeout(() => {
        const queuedRequest = requestQueue.current.get(orderItemId);

        // Only process if this is still the latest request for this order item
        if (!queuedRequest || queuedRequest.timestamp !== timestamp) {
          return;
        }

        // Remove from queue and process
        requestQueue.current.delete(orderItemId);

        // Fire and forget - don't await, don't block UI
        updateOrderItemMutation
          .mutateAsync({
            id: orderItemId,
            ...queuedRequest.updates,
          })
          .then(() => {
            // Success - show saved status
            setAutosaveStatus(prev => ({ ...prev, [countryId]: 'saved' }));
            if (setSaveStatus) {
              setSaveStatus('saved');
            }

            // If this update included price changes, trigger order refetch to update total
            // Note: Removed order refetch trigger - now using optimistic UI updates
            // Price updates are handled optimistically in the UI

            // Reset to idle after 2 seconds
            setTimeout(() => {
              setAutosaveStatus(prev => ({ ...prev, [countryId]: 'idle' }));
            }, 2000);
          })
          .catch(error => {
            console.error('Failed to autosave order item:', error);
            setAutosaveStatus(prev => ({ ...prev, [countryId]: 'error' }));
            if (setSaveStatus) {
              setSaveStatus('error');
            }

            // Provide more specific error messaging
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            if (errorMessage.includes('draft')) {
              setErrorMessage('Cannot save changes - order is no longer editable');
            } else if (errorMessage.includes('not found')) {
              setErrorMessage('Order item not found - please refresh the page');
            } else {
              setErrorMessage('Failed to save changes automatically. Please try again.');
            }

            // Reset error status after 5 seconds
            setTimeout(() => {
              setAutosaveStatus(prev => ({ ...prev, [countryId]: 'idle' }));
            }, 5000);
          });
      }, 100); // Small delay to allow for request batching
    },
    800 // Reduced debounce time since we have request queuing
  );

  // CountryCard component to handle individual country logic with blacklist checking
  const CountryCard = memo(
    ({
      countryId,
      country,
      isBlacklisted,
      entryDate,
      entryTime,
      selectedVisaType,
      onEntryDateSelect,
      onEntryTimeBlur,
      onVisaTypeSelect,
      onMultiEntryToggle,
      onDeleteCountry,
    }: {
      countryId: string;
      country: { id: string; name: string } | undefined;
      isBlacklisted: boolean;
      entryDate: Date | null;
      entryTime: string;
      selectedVisaType: string;
      autosaveStatus: 'idle' | 'saving' | 'saved' | 'error';
      onEntryDateSelect: (countryId: string, date: Date | null) => void;
      onEntryTimeBlur: (countryId: string, time: string) => void;
      onVisaTypeSelect: (countryId: string, visaType: string) => void;
      onMultiEntryToggle: (countryId: string, isMultientry: boolean) => void;
      onDeleteCountry: (countryId: string) => void;
    }) => {
      // Convert between "HH:MM" and "HH:MM:SS" formats
      const convertToTimeInput = (time: string) => {
        if (!time || time === '00:00') return '10:00';
        if (time.length === 5) return time; // Already in HH:MM format
        return time.substring(0, 5); // Convert HH:MM:SS to HH:MM
      };

      const convertFromTimeInput = (time: string) => {
        if (!time) return '00:00';
        return time; // Keep in HH:MM format
      };

      const [localTime, setLocalTime] = useState(convertToTimeInput(entryTime));
      const [isDirty, setIsDirty] = useState(false);

      // Update local time when prop changes from parent
      useEffect(() => {
        if (!isDirty) {
          setLocalTime(convertToTimeInput(entryTime));
        }
      }, [entryTime, isDirty]);

      const handleTimeChange = useCallback(
        (newTime: string) => {
          // Validate time if date is today
          const isToday = entryDate && entryDate.toDateString() === new Date().toDateString();

          if (isToday) {
            const now = new Date();
            const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

            if (newTime < currentTime) {
              // Don't allow past times for today
              return;
            }
          }

          setLocalTime(newTime);
          setIsDirty(true);
        },
        [entryDate]
      );

      const handleTimeBlur = useCallback(() => {
        if (isDirty && convertFromTimeInput(localTime) !== entryTime) {
          // Update parent with current local value
          onEntryTimeBlur(countryId, convertFromTimeInput(localTime));
        }
        setIsDirty(false);
      }, [isDirty, localTime, entryTime, countryId, onEntryTimeBlur]);

      if (!country) return null;

      return (
        <Card className={cn('p-3 bg-secondary')}>
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Badge variant={isBlacklisted ? 'destructive' : 'accent'}>
                  Visa - {country.name}
                </Badge>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={event => {
                event.preventDefault();
                event.stopPropagation();
                onDeleteCountry(countryId);
              }}
              className="h-8 w-8 p-0"
            >
              ×
            </Button>
          </div>

          {/* Entry Date */}
          <div className="space-y-3">
            <Label className={cn('text-sm font-medium', isBlacklisted && 'text-muted-foreground')}>
              Entry date & time
            </Label>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex gap-4">
                <div className="flex flex-col gap-3">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="secondary"
                        disabled={isBlacklisted}
                        className={cn(
                          'w-52 justify-between text-left font-normal',
                          !entryDate && 'text-muted-foreground',
                          isBlacklisted && 'opacity-50 cursor-not-allowed'
                        )}
                      >
                        {entryDate ? format(entryDate, 'dd.MM.yy') : 'Select date*'}
                        <CalendarIcon className="mr-2 h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={entryDate || undefined}
                        captionLayout="dropdown"
                        onSelect={date => onEntryDateSelect(countryId, date || null)}
                        fromDate={new Date()}
                        disabled={date => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex flex-col gap-3">
                  <Input
                    type="time"
                    step="60"
                    value={localTime}
                    onChange={e => handleTimeChange(e.target.value)}
                    onBlur={handleTimeBlur}
                    disabled={isBlacklisted}
                    min={
                      entryDate && entryDate.toDateString() === new Date().toDateString()
                        ? `${new Date().getHours().toString().padStart(2, '0')}:${new Date().getMinutes().toString().padStart(2, '0')}`
                        : undefined
                    }
                    className={cn(
                      'w-32 appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none',
                      isBlacklisted && 'opacity-50'
                    )}
                  />
                </div>
              </div>
              <VisaFreeInfo
                countryId={countryId}
                clientCitizenshipId={primaryClientData?.client?.citizenshipId}
              />
            </div>
          </div>

          {/* Visa Type */}
          <div className={isBlacklisted ? 'opacity-50' : ''}>
            <VisaTypeSelector
              countryId={countryId}
              selectedVisaType={selectedVisaType}
              onVisaTypeSelect={onVisaTypeSelect}
              onMultiEntryToggle={onMultiEntryToggle}
              currentMultientryState={isMultientryEnabled[countryId] || false}
              disabled={isBlacklisted}
              createdOrderItems={createdOrderItems}
              debouncedUpdateOrderItem={debouncedUpdateOrderItem}
              updateOptimisticOrderItem={updateOptimisticOrderItem}
            />
          </div>
        </Card>
      );
    }
  );

  CountryCard.displayName = 'CountryCard';

  // Wrapper component to handle blacklist checking
  const CountryCardWithBlacklistCheck = ({
    countryId,
    country,
  }: {
    countryId: string;
    country: { id: string; name: string } | undefined;
  }) => {
    const { data: countryData } = trpc.country.getOne.useQuery({ id: countryId });

    const [isBlacklisted, setIsBlacklisted] = useState(
      countryData?.country?.blacklisted?.some(
        entry => entry.citizenshipId === primaryClientData?.client?.citizenshipId
      ) || false
    );

    useEffect(() => {
      console.log('CitizenshipId:', primaryClientData?.client?.citizenshipId);
      console.log('Is blacklisted: ' + isBlacklisted);
      setIsBlacklisted(
        countryData?.country?.blacklisted?.some(
          entry => entry.citizenshipId === primaryClientData?.client?.citizenshipId
        ) || false
      );
    }, [countryData, primaryClientData?.client?.citizenshipId]);

    // Reset visa type when country becomes blacklisted
    useEffect(() => {
      if (isBlacklisted && selectedVisaTypes[countryId] && country) {
        setSelectedVisaTypes(prev => ({ ...prev, [countryId]: '' }));

        // Update order item to remove visa type
        const orderItemId = createdOrderItems[countryId];
        if (orderItemId) {
          const entryDate = entryDates[countryId];
          const entryTime = entryTimes[countryId] || '00:00';
          const baseNote = `Visa service for ${country.name}`;
          const dateTimeNote = entryDate
            ? ` - Entry: ${format(entryDate, 'dd.MM.yy')} at ${entryTime}`
            : '';

          debouncedUpdateOrderItem(orderItemId, { note: `${baseNote}${dateTimeNote}` }, countryId);
        }
      }
    }, [isBlacklisted, countryId, country]);

    return (
      <CountryCard
        countryId={countryId}
        country={country}
        isBlacklisted={isBlacklisted}
        entryDate={entryDates[countryId] || null}
        entryTime={entryTimes[countryId] || '10:00'}
        selectedVisaType={selectedVisaTypes[countryId] || ''}
        autosaveStatus={autosaveStatus[countryId] || 'idle'}
        onEntryDateSelect={handleEntryDateSelect}
        onEntryTimeBlur={handleEntryTimeBlur}
        onVisaTypeSelect={handleVisaTypeSelect}
        onMultiEntryToggle={handleMultiEntryToggle}
        onDeleteCountry={handleDeleteCountry}
      />
    );
  };

  const handleCountryClick = async (event: React.MouseEvent, countryId: string) => {
    event.preventDefault();
    event.stopPropagation();

    if (!orderData?.order || !primaryClientData?.client) {
      setErrorMessage('Order or client data not available');
      return;
    }

    try {
      const country = countriesData?.countries?.find(c => c.id === countryId);
      if (!country) {
        setErrorMessage('Country not found');
        return;
      }

      // Immediately add to UI state for instant feedback
      setAddedCountryCards(prev => new Set([...prev, countryId]));
      setSelectedVisaTypes(prev => ({ ...prev, [countryId]: '' }));
      setEntryDates(prev => ({ ...prev, [countryId]: null }));
      setEntryTimes(prev => ({ ...prev, [countryId]: '10:00' }));
      setIsMultientryEnabled(prev => ({ ...prev, [countryId]: false }));

      // Set saving status
      if (setSaveStatus) {
        setSaveStatus('saving');
      }

      // Create optimistic order item first
      const basePrice = 0; // Default price for visa
      const tempOrderItemId = `temp-${Date.now()}-${countryId}`;
      const optimisticOrderItem = {
        id: tempOrderItemId,
        orderId: orderData.order.id,
        clientId: primaryClientData.client.id,
        serviceType: 'visa' as const,
        serviceTypeId: countryId,
        basePrice,
        finalPrice: basePrice,
        discountAmount: 0,
        note: `Visa service for ${country.name}`,
        plannedCountryEntryDate: undefined,
        visaTypeId: undefined,
      };

      // Add to optimistic state immediately
      if (addOptimisticOrderItem) {
        addOptimisticOrderItem(optimisticOrderItem);
      }

      // Store temp ID for tracking
      setCreatedOrderItems(prev => ({ ...prev, [countryId]: tempOrderItemId }));

      try {
        // Create order item on server
        const orderItemResponse = await createOrderItemMutation.mutateAsync({
          orderId: orderData.order.id,
          clientId: primaryClientData.client.id,
          serviceType: 'visa' as const,
          serviceTypeId: countryId,
          basePrice,
          finalPrice: basePrice,
          discountAmount: 0,
          note: `Visa service for ${country.name}`,
          plannedCountryEntryDate: undefined,
          visaTypeId: undefined,
        });

        // Replace temp item with actual order item
        const actualOrderItem = orderItemResponse.orderItem;

        // Remove the temporary optimistic item
        if (removeOptimisticOrderItem) {
          removeOptimisticOrderItem(tempOrderItemId);
        }

        // Add the real item
        if (addOptimisticOrderItem) {
          addOptimisticOrderItem(actualOrderItem);
        }

        // Update with actual order item ID
        setCreatedOrderItems(prev => ({ ...prev, [countryId]: actualOrderItem.id }));

        // Store visa application data if created
        if (orderItemResponse.visaApplication) {
          setVisaApplications(prev => ({
            ...prev,
            [countryId]: orderItemResponse.visaApplication as any,
          }));
        }

        // Refetch visa applications to get the latest data
        await refetchVisaApplications();
      } catch (error) {
        console.error('Failed to create order item:', error);

        // Remove the optimistic item on error
        if (removeOptimisticOrderItem) {
          removeOptimisticOrderItem(tempOrderItemId);
        }

        // Revert UI state
        setAddedCountryCards(prev => {
          const updated = new Set(prev);
          updated.delete(countryId);
          return updated;
        });
        setCreatedOrderItems(prev => {
          const updated = { ...prev };
          delete updated[countryId];
          return updated;
        });

        setErrorMessage('Failed to add country. Please try again.');
        throw error;
      }

      // Update save status in UI
      if (setLastSavedTime && setSaveStatus) {
        setLastSavedTime(new Date());
        setSaveStatus('saved');
      }
    } catch (error) {
      console.error('Failed to create order item:', error);
      // Check if it's a blacklist error
      if (error instanceof Error && error.message.includes('blacklist')) {
        setErrorMessage('Cannot add visa for this country - citizenship is blacklisted');
      } else {
        setErrorMessage('Failed to add country. Please try again.');
      }

      // Remove from state if creation failed
      setAddedCountryCards(prev => {
        const updated = new Set(prev);
        updated.delete(countryId);
        return updated;
      });
      setSelectedVisaTypes(prev => {
        const updated = { ...prev };
        delete updated[countryId];
        return updated;
      });
      setEntryDates(prev => {
        const updated = { ...prev };
        delete updated[countryId];
        return updated;
      });
      setEntryTimes(prev => {
        const updated = { ...prev };
        delete updated[countryId];
        return updated;
      });
    }
  };

  // Load existing visa order items and their visa applications
  useEffect(() => {
    if (
      visaOrderItemsData?.orderItems &&
      visaApplicationsData?.visaApplications &&
      countriesData?.countries
    ) {
      const visaOrderItems = visaOrderItemsData.orderItems.filter(
        item => item.serviceType === 'visa'
      );

      const newAddedCountries = new Set<string>();
      const newCreatedOrderItems: Record<string, string> = {};
      const newSelectedVisaTypes: Record<string, string> = {};
      const newEntryDates: Record<string, Date | null> = {};
      const newEntryTimes: Record<string, string> = {};
      const newVisaApplications: Record<string, any> = {};
      const newIsMultientryEnabled: Record<string, boolean> = {};

      visaOrderItems.forEach(item => {
        if (item.serviceTypeId) {
          // For visa items, serviceTypeId should be countryId
          const countryId = item.serviceTypeId;
          const isCountry = countriesData.countries.some(c => c.id === countryId);

          if (isCountry) {
            newAddedCountries.add(countryId);
            newCreatedOrderItems[countryId] = item.id;

            // Find corresponding visa application for this order item
            const visaApp = visaApplicationsData.visaApplications.find(
              (app: any) => app.orderItemId === item.id
            );

            if (visaApp) {
              // Store visa application data
              newVisaApplications[countryId] = visaApp;

              // Set selected visa type from visa application
              if (visaApp.visaTypeId) {
                newSelectedVisaTypes[countryId] = visaApp.visaTypeId;
              }

              // Set multi-entry status from visa application
              newIsMultientryEnabled[countryId] = (visaApp as any).isMultientry || false;

              // Parse planned entry date and time
              if (visaApp.plannedCountryEntryDate) {
                const entryDateTime = new Date(visaApp.plannedCountryEntryDate);
                newEntryDates[countryId] = entryDateTime;

                // Extract time in HH:MM format
                const hours = entryDateTime.getHours().toString().padStart(2, '0');
                const minutes = entryDateTime.getMinutes().toString().padStart(2, '0');
                newEntryTimes[countryId] = `${hours}:${minutes}`;
              } else {
                newEntryDates[countryId] = null;
                newEntryTimes[countryId] = '10:00';
              }
            }
          }
        }
      });

      setAddedCountryCards(newAddedCountries);
      setCreatedOrderItems(newCreatedOrderItems);
      setVisaApplications(newVisaApplications);
      setSelectedVisaTypes(newSelectedVisaTypes);
      setEntryDates(newEntryDates);
      setEntryTimes(newEntryTimes);
      setIsMultientryEnabled(newIsMultientryEnabled);
    }
  }, [
    visaOrderItemsData?.orderItems,
    visaApplicationsData?.visaApplications,
    countriesData?.countries,
  ]);

  const handleVisaTypeSelect = useCallback(
    (countryId: string, visaType: string) => {
      // Mark that a visa type update is in progress
      visaTypeUpdateInProgress.current = true;

      setSelectedVisaTypes(prev => ({ ...prev, [countryId]: visaType }));

      // Update visa application with selected visa type
      const visaApp = visaApplications[countryId];
      if (visaApp && visaType) {
        updateVisaApplicationMutation.mutate({
          id: visaApp.id,
          visaTypeId: visaType,
        });
      }
    },
    [visaApplications, updateVisaApplicationMutation]
  );

  const handleMultiEntryToggle = useCallback(
    (countryId: string, isMultientry: boolean) => {
      setIsMultientryEnabled(prev => ({ ...prev, [countryId]: isMultientry }));

      // Update visa application with multi-entry status
      const visaApp = visaApplications[countryId];
      if (visaApp) {
        updateVisaApplicationMutation.mutate({
          id: visaApp.id,
          isMultientry: isMultientry,
        });
      }

      // Note: Price update will be handled by the VisaTypeSelector component
      // when the multi-entry state changes, and order refetch will happen
      // after the price is successfully updated on the server
    },
    [visaApplications, updateVisaApplicationMutation]
  );

  const handleEntryDateSelect = useCallback(
    (countryId: string, date: Date | null) => {
      setEntryDates(prev => ({ ...prev, [countryId]: date }));

      // Update visa application with entry date and time
      const visaApp = visaApplications[countryId];

      if (visaApp && date) {
        const time = entryTimes[countryId] || '10:00';
        const [hours, minutes] = time.split(':');
        const plannedEntryDate = new Date(date);
        plannedEntryDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        // Send as ISO string for TRPC serialization
        updateVisaApplicationMutation.mutate({
          id: visaApp.id,
          plannedCountryEntryDate: plannedEntryDate.toISOString(),
        });
      }
    },
    [visaApplications, entryTimes, updateVisaApplicationMutation]
  );

  const handleEntryTimeBlur = useCallback(
    (countryId: string, time: string) => {
      setEntryTimes(prev => ({ ...prev, [countryId]: time }));

      // Update visa application with entry time
      const visaApp = visaApplications[countryId];
      const date = entryDates[countryId];

      if (visaApp && date && time && time !== '00:00') {
        const [hours, minutes] = time.split(':');
        const plannedEntryDate = new Date(date);
        plannedEntryDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        // Send as ISO string for TRPC serialization
        updateVisaApplicationMutation.mutate({
          id: visaApp.id,
          plannedCountryEntryDate: plannedEntryDate.toISOString(),
        });
      }
    },
    [visaApplications, entryDates, updateVisaApplicationMutation]
  );

  const handleDeleteCountry = (countryId: string) => {
    setCountryToDelete(countryId);
    setShowDeleteModal(true);
  };

  const confirmDeleteCountry = async () => {
    if (!countryToDelete) return;

    const countryToDeleteRef = countryToDelete;
    const orderItemId = createdOrderItems[countryToDeleteRef];

    // Store current state for potential rollback
    const currentState = {
      addedCountryCards: new Set(addedCountryCards),
      createdOrderItems: { ...createdOrderItems },
      selectedVisaTypes: { ...selectedVisaTypes },
      entryDates: { ...entryDates },
      entryTimes: { ...entryTimes },
      isMultientryEnabled: { ...isMultientryEnabled },
      autosaveStatus: { ...autosaveStatus },
      visaApplications: { ...visaApplications },
    };

    try {
      // Set saving status
      if (setSaveStatus) {
        setSaveStatus('saving');
      }

      // Remove from optimistic state immediately
      if (removeOptimisticOrderItem && orderItemId) {
        removeOptimisticOrderItem(orderItemId);
      }

      // Clear local state immediately for optimistic UI
      setAddedCountryCards(prev => {
        const updated = new Set(prev);
        updated.delete(countryToDeleteRef);
        return updated;
      });
      setCreatedOrderItems(prev => {
        const updated = { ...prev };
        delete updated[countryToDeleteRef];
        return updated;
      });
      setSelectedVisaTypes(prev => {
        const updated = { ...prev };
        delete updated[countryToDeleteRef];
        return updated;
      });
      setEntryDates(prev => {
        const updated = { ...prev };
        delete updated[countryToDeleteRef];
        return updated;
      });
      setEntryTimes(prev => {
        const updated = { ...prev };
        delete updated[countryToDeleteRef];
        return updated;
      });
      setIsMultientryEnabled(prev => {
        const updated = { ...prev };
        delete updated[countryToDeleteRef];
        return updated;
      });
      setAutosaveStatus(prev => {
        const updated = { ...prev };
        delete updated[countryToDeleteRef];
        return updated;
      });
      setVisaApplications(prev => {
        const updated = { ...prev };
        delete updated[countryToDeleteRef];
        return updated;
      });

      // Delete from server
      if (orderItemId) {
        await deleteOrderItemMutation.mutateAsync({ id: orderItemId });
      }

      // Update save status in UI
      if (setLastSavedTime && setSaveStatus) {
        setLastSavedTime(new Date());
        setSaveStatus('saved');
      }
    } catch (error) {
      console.error('Failed to delete order item:', error);
      setErrorMessage('Failed to delete country. Please try again.');

      // Rollback optimistic changes on error
      if (addOptimisticOrderItem && orderItemId) {
        // Re-add the item to optimistic state
        const orderItem = currentState.createdOrderItems[countryToDeleteRef];
        if (orderItem) {
          // We need to reconstruct the order item - this is a simplified version
          // In a real app, you might want to store the full order item data
          const country = countriesData?.countries?.find(c => c.id === countryToDeleteRef);
          if (country) {
            addOptimisticOrderItem({
              id: orderItemId,
              serviceType: 'visa',
              serviceTypeId: countryToDeleteRef,
              basePrice: 0,
              finalPrice: 0,
              note: `Visa service for ${country.name}`,
            });
          }
        }
      }

      // Restore local state
      setAddedCountryCards(currentState.addedCountryCards);
      setCreatedOrderItems(currentState.createdOrderItems);
      setSelectedVisaTypes(currentState.selectedVisaTypes);
      setEntryDates(currentState.entryDates);
      setEntryTimes(currentState.entryTimes);
      setIsMultientryEnabled(currentState.isMultientryEnabled);
      setAutosaveStatus(currentState.autosaveStatus);
      setVisaApplications(currentState.visaApplications);
    } finally {
      setShowDeleteModal(false);
      setCountryToDelete(null);
    }
  };

  // Country Button Component with blacklist check
  const CountryButton = ({
    country,
    isAdded,
    isLoading,
    onClick,
  }: {
    country: { id: string; name: string };
    isAdded: boolean;
    isLoading: boolean;
    onClick: (event: React.MouseEvent, countryId: string) => void;
  }) => {
    const { data: countryData } = trpc.country.getOne.useQuery(
      { id: country.id },
      {
        enabled: !!primaryClientData?.client?.citizenshipId,
        select: data => ({
          isBlacklisted:
            data?.country?.blacklisted?.some(
              entry => entry.citizenshipId === primaryClientData?.client?.citizenshipId
            ) || false,
        }),
      }
    );

    const actuallyBlacklisted = countryData?.isBlacklisted || false;

    return (
      <Button
        variant={isAdded ? 'accent' : actuallyBlacklisted ? 'destructive' : 'secondary'}
        size="sm"
        onClick={event => onClick(event, country.id)}
        disabled={isAdded || isLoading || actuallyBlacklisted}
        title={actuallyBlacklisted ? 'Entry prohibited - blacklisted citizenship' : undefined}
      >
        {actuallyBlacklisted ? '' : '+'} {country.name}
      </Button>
    );
  };

  // Visa Free Info Component
  const VisaFreeInfo = ({
    countryId,
    clientCitizenshipId,
  }: {
    countryId: string;
    clientCitizenshipId?: string | null;
  }) => {
    const { data: countryData } = trpc.country.getOne.useQuery({ id: countryId });
    const entryDate = entryDates[countryId];

    if (!clientCitizenshipId || !countryData?.country?.visaFree) {
      return null;
    }

    const visaFreeEntry = countryData.country.visaFree.find(
      entry => entry.citizenshipId === clientCitizenshipId
    );

    // Check if citizenship is blacklisted
    const blacklistedEntry = countryData.country.blacklisted?.find(
      entry => entry.citizenshipId === clientCitizenshipId
    );

    if (blacklistedEntry) {
      return (
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="destructive">Entry Prohibited - Blacklisted Citizenship</Badge>
        </div>
      );
    }

    if (!visaFreeEntry) {
      return <></>;
    }

    // Calculate exit deadline
    let exitDeadline = null;
    if (entryDate) {
      const deadline = new Date(entryDate);
      deadline.setDate(deadline.getDate() + visaFreeEntry.stampDuration);
      exitDeadline = deadline;
    }

    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-md text-xs font-medium">
          visa free entry for {visaFreeEntry.stampDuration} days allowed
        </span>
        {exitDeadline && (
          <span className="bg-red-100 text-red-800 px-2 py-1 rounded-md text-xs font-medium">
            {format(exitDeadline, 'dd.MM.yy')} Exit deadline
          </span>
        )}
      </div>
    );
  };

  // Visa Type Selector Component
  const VisaTypeSelector = ({
    countryId,
    selectedVisaType,
    onVisaTypeSelect,
    onMultiEntryToggle,
    currentMultientryState,
    disabled = false,
    createdOrderItems,
    debouncedUpdateOrderItem,
    updateOptimisticOrderItem,
  }: {
    countryId: string;
    selectedVisaType: string;
    onVisaTypeSelect: (countryId: string, visaType: string) => void;
    onMultiEntryToggle: (countryId: string, isMultientry: boolean) => void;
    currentMultientryState: boolean;
    disabled?: boolean;
    createdOrderItems: Record<string, string>;
    debouncedUpdateOrderItem: (
      orderItemId: string,
      updates: OrderItemUpdate,
      countryId: string
    ) => void;
    updateOptimisticOrderItem?: (
      orderItemId: string,
      updates: { visaTypeId?: string; basePrice?: number; finalPrice?: number }
    ) => void;
  }) => {
    const { data: visaTypesData } = trpc.visaType.getByCountry.useQuery({ countryId });

    const selectedVisaTypeData = visaTypesData?.visaTypes?.find(vt => vt.id === selectedVisaType);

    const handleVisaTypeClick = useCallback(
      (visaTypeId: string) => {
        // Update UI state immediately (optimistic) - no blocking
        onVisaTypeSelect(countryId, visaTypeId);

        // Update order item with correct price from VisaType
        const orderItemId = createdOrderItems[countryId];
        if (orderItemId && visaTypesData?.visaTypes) {
          const selectedVisaTypeData = visaTypesData.visaTypes.find(vt => vt.id === visaTypeId);
          if (selectedVisaTypeData?.serviceCost) {
            const basePrice = selectedVisaTypeData.serviceCost;
            const isMultientry = currentMultientryState;
            const extraCost = isMultientry ? selectedVisaTypeData.multientryExtraCost || 0 : 0;
            const finalPrice = basePrice + extraCost;

            // Update optimistic UI immediately
            if (updateOptimisticOrderItem) {
              updateOptimisticOrderItem(orderItemId, {
                visaTypeId: visaTypeId,
                basePrice: finalPrice,
                finalPrice: finalPrice,
              });
            }

            debouncedUpdateOrderItem(
              orderItemId,
              {
                visaTypeId: visaTypeId,
                basePrice: finalPrice,
                finalPrice: finalPrice,
              },
              countryId
            );
          }
        }
      },
      [
        countryId,
        onVisaTypeSelect,
        createdOrderItems,
        visaTypesData,
        debouncedUpdateOrderItem,
        updateOptimisticOrderItem,
      ]
    );

    const handleMultiToggle = useCallback(
      (isMultientry: boolean) => {
        onMultiEntryToggle(countryId, isMultientry);

        // Update order item price immediately
        const orderItemId = createdOrderItems[countryId];
        if (orderItemId && selectedVisaTypeData?.serviceCost) {
          const basePrice = selectedVisaTypeData.serviceCost;
          const extraCost = isMultientry ? selectedVisaTypeData.multientryExtraCost || 0 : 0;
          const finalPrice = basePrice + extraCost;

          // Update optimistic UI immediately
          if (updateOptimisticOrderItem) {
            updateOptimisticOrderItem(orderItemId, {
              basePrice: finalPrice,
              finalPrice: finalPrice,
            });
          }

          debouncedUpdateOrderItem(
            orderItemId,
            {
              basePrice: finalPrice,
              finalPrice: finalPrice,
            },
            countryId
          );
        }
      },
      [
        onMultiEntryToggle,
        countryId,
        createdOrderItems,
        selectedVisaTypeData,
        debouncedUpdateOrderItem,
        updateOptimisticOrderItem,
      ]
    );

    return (
      <div className="space-y-3">
        <Label className={cn('text-sm font-medium', disabled && 'text-muted-foreground')}>
          Visa type
        </Label>
        <div className="flex flex-wrap gap-2">
          {(() => {
            const sortedVisaTypes =
              visaTypesData?.visaTypes?.sort((a, b) => {
                // Sort favorites first
                if (a.favourite && !b.favourite) return -1;
                if (!a.favourite && b.favourite) return 1;

                // Then sort by processing unit: days first, then hours
                if (a.processingUnit === 'days' && b.processingUnit === 'hours') return -1;
                if (a.processingUnit === 'hours' && b.processingUnit === 'days') return 1;

                // Finally sort alphabetically
                return a.name.localeCompare(b.name);
              }) || [];

            // Group visa types
            const favorites = sortedVisaTypes.filter(vt => vt.favourite);
            const nonFavorites = sortedVisaTypes.filter(vt => !vt.favourite);
            const nonFavoritesDays = nonFavorites.filter(vt => vt.processingUnit === 'days');
            const nonFavoritesHours = nonFavorites.filter(vt => vt.processingUnit === 'hours');

            const renderVisaTypeButton = (visaType: any, isLastInGroup: boolean = false) => (
              <Button
                key={visaType.id}
                variant={selectedVisaType === visaType.id ? 'accent' : 'secondary'}
                size="sm"
                type="button"
                disabled={disabled}
                onClick={event => {
                  event.preventDefault();
                  event.stopPropagation();
                  if (!disabled) {
                    handleVisaTypeClick(visaType.id);
                  }
                }}
                className={`transition-all duration-200 ${isLastInGroup ? 'mr-2' : ''}`}
              >
                {visaType.name}
              </Button>
            );

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
          {/* Multi Switch */}
          {selectedVisaTypeData?.isMultientry && selectedVisaType && (
            <div className="ps-2 flex items-center justify-start gap-2">
              <Switch
                checked={currentMultientryState}
                onCheckedChange={handleMultiToggle}
                disabled={disabled}
              />
              <Label className={cn('text-sm font-medium', disabled && 'text-muted-foreground')}>
                Multi
              </Label>
            </div>
          )}
        </div>

        <div className="flex justify-end items-center">
          <span className="font-semibold">
            {(() => {
              const basePrice = selectedVisaTypeData?.serviceCost || 0;
              const isMultientry = currentMultientryState;
              const extraCost = isMultientry ? selectedVisaTypeData?.multientryExtraCost || 0 : 0;
              return formatCurrency(basePrice + extraCost, 'VND');
            })()}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <Label className="text-sm">Add Visa</Label>
      </div>
      <div className="space-y-6">
        {/* Add Visa Header with Country Buttons */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex flex-wrap gap-2">
            {countriesData?.countries
              ?.filter(country => country.eVisaAvailable)
              ?.sort((a, b) => {
                // Sort favorites first, then alphabetically
                if (a.favourite && !b.favourite) return -1;
                if (!a.favourite && b.favourite) return 1;
                return a.name.localeCompare(b.name);
              })
              ?.map(country => (
                <CountryButton
                  key={country.id}
                  country={country}
                  isAdded={addedCountryCards.has(country.id)}
                  isLoading={createOrderItemMutation.isPending}
                  onClick={handleCountryClick}
                />
              ))}
          </div>
        </div>

        {/* Country Cards */}
        {Array.from(addedCountryCards)
          .sort((countryIdA, countryIdB) => {
            const countryA = countriesData?.countries?.find(c => c.id === countryIdA);
            const countryB = countriesData?.countries?.find(c => c.id === countryIdB);

            if (!countryA || !countryB) return 0;

            // Sort favorites first, then alphabetically
            if (countryA.favourite && !countryB.favourite) return -1;
            if (!countryA.favourite && countryB.favourite) return 1;
            return countryA.name.localeCompare(countryB.name);
          })
          .map(countryId => {
            const country = countriesData?.countries?.find(c => c.id === countryId);
            return (
              <CountryCardWithBlacklistCheck
                key={`country-card-${countryId}`}
                countryId={countryId}
                country={country}
              />
            );
          })}
      </div>
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={showDeleteModal}
        onOpenChange={open => {
          if (!open) {
            setShowDeleteModal(false);
            setCountryToDelete(null);
          }
        }}
      >
        <DialogContent className="max-w-md bg-secondary">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              Delete Visa Application
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed">
              Are you sure you want to delete this visa application? This action cannot be undone
              and will also remove the associated order item from your order.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="secondary"
              disabled={deleteOrderItemMutation.isPending}
              onClick={() => {
                setShowDeleteModal(false);
                setCountryToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteCountry}
              disabled={deleteOrderItemMutation.isPending}
            >
              {deleteOrderItemMutation.isPending ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Deleting...
                </div>
              ) : (
                'Delete Visa'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VisaSection;
