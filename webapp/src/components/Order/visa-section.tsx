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
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface OrderItemUpdate {
  serviceTypeId?: string;
  note?: string;
  basePrice?: number;
  finalPrice?: number;
  visaTypeId?: string;
}

interface VisaSectionProps {
  refetchOrder: () => void;
  orderData: {
    order: {
      id: string;
      status: string;
    };
    orderItems?: Array<{
      id: string;
      serviceType: string;
      serviceTypeId: string;
      note?: string;
    }>;
  };
  primaryClientData: any;
  setErrorMessage: (message: string) => void;
  updateOrderMutation?: any;
  setLastSavedTime?: (time: Date) => void;
  setSaveStatus?: (status: 'idle' | 'saving' | 'saved' | 'error') => void;
}

const VisaSection = ({
  refetchOrder,
  orderData,
  primaryClientData,
  setErrorMessage,
  updateOrderMutation,
  setLastSavedTime,
  setSaveStatus,
}: VisaSectionProps) => {
  const [addedCountryCards, setAddedCountryCards] = useState<Set<string>>(new Set());
  const [selectedVisaTypes, setSelectedVisaTypes] = useState<Record<string, string>>({});
  const [entryDates, setEntryDates] = useState<Record<string, Date | null>>({});
  const [entryTimes, setEntryTimes] = useState<Record<string, string>>({});
  const [autosaveStatus, setAutosaveStatus] = useState<
    Record<string, 'idle' | 'saving' | 'saved' | 'error'>
  >({});
  const [visaApplications, setVisaApplications] = useState<Record<string, any>>({});

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
      await refetchOrder();
      await refetchVisaOrderItems();
      // Invalidate relevant queries
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
      await refetchOrder();
      await refetchVisaOrderItems();
      await refetchVisaApplications();
      // Invalidate relevant queries
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
      await refetchOrder();
      await refetchVisaOrderItems();
      await refetchVisaApplications();
      // Invalidate relevant queries
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
      await refetchOrder();
      // Update save status in UI
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
      autosaveStatus,
      onEntryDateSelect,
      onEntryTimeBlur,
      onVisaTypeSelect,
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
                {/* Autosave Status Indicator */}
                {autosaveStatus === 'saving' && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3 animate-spin" />
                    <span>Saving...</span>
                  </div>
                )}
                {autosaveStatus === 'saved' && (
                  <div className="flex items-center gap-1 text-xs text-green-600">
                    <CheckCircle className="h-3 w-3" />
                    <span>Saved</span>
                  </div>
                )}
                {autosaveStatus === 'error' && (
                  <div className="flex items-center gap-1 text-xs text-red-600">
                    <AlertCircle className="h-3 w-3" />
                    <span>Save failed</span>
                  </div>
                )}
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
              disabled={isBlacklisted}
              createdOrderItems={createdOrderItems}
              debouncedUpdateOrderItem={debouncedUpdateOrderItem}
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

    const isBlacklisted =
      countryData?.country?.blacklisted?.some(
        entry => entry.citizenshipId === primaryClientData?.client?.citizenshipId
      ) || false;

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

      // Set saving status
      if (setSaveStatus) {
        setSaveStatus('saving');
      }

      // Create order item in background
      const basePrice = 100; // Default price for visa
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

      // Update with actual order item ID
      setCreatedOrderItems(prev => ({ ...prev, [countryId]: orderItemResponse.orderItem.id }));

      // Store visa application data if created
      if (orderItemResponse.visaApplication) {
        setVisaApplications(prev => ({
          ...prev,
          [countryId]: orderItemResponse.visaApplication as any,
        }));
      }

      // Refetch visa applications to get the latest data
      await refetchVisaApplications();

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

  // Load existing visa order items on component mount
  useEffect(() => {
    if (visaOrderItemsData?.orderItems && countriesData?.countries) {
      const visaOrderItems = visaOrderItemsData.orderItems.filter(
        item => item.serviceType === 'visa'
      );

      const newAddedCountries = new Set<string>();
      const newCreatedOrderItems: Record<string, string> = {};

      visaOrderItems.forEach(item => {
        if (item.serviceTypeId) {
          // For visa items, serviceTypeId should be countryId
          const countryId = item.serviceTypeId;
          const isCountry = countriesData.countries.some(c => c.id === countryId);

          if (isCountry) {
            newAddedCountries.add(countryId);
            newCreatedOrderItems[countryId] = item.id;
          }
        }
      });

      setAddedCountryCards(newAddedCountries);
      setCreatedOrderItems(newCreatedOrderItems);
    }
  }, [visaOrderItemsData?.orderItems, countriesData?.countries]);

  // Load visa application data
  useEffect(() => {
    if (visaApplicationsData?.visaApplications && countriesData?.countries) {
      const newSelectedVisaTypes: Record<string, string> = {};
      const newEntryDates: Record<string, Date | null> = {};
      const newEntryTimes: Record<string, string> = {};
      const newVisaApplications: Record<string, any> = {};

      visaApplicationsData.visaApplications.forEach((visaApp: any) => {
        const countryId = visaApp.countryId;

        // Store visa application data
        newVisaApplications[countryId] = visaApp as any;

        // Set selected visa type
        if (visaApp.visaTypeId) {
          newSelectedVisaTypes[countryId] = visaApp.visaTypeId;
        }

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
      });

      setVisaApplications(newVisaApplications);
      setSelectedVisaTypes(newSelectedVisaTypes);
      setEntryDates(newEntryDates);
      setEntryTimes(newEntryTimes);
    }
  }, [visaApplicationsData?.visaApplications, countriesData?.countries]);

  const handleVisaTypeSelect = useCallback(
    (countryId: string, visaType: string) => {
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

    try {
      // Set saving status
      if (setSaveStatus) {
        setSaveStatus('saving');
      }

      // Delete from server first
      if (orderItemId) {
        await deleteOrderItemMutation.mutateAsync({ id: orderItemId });
      }

      // Clear state after successful deletion
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

      // Update save status in UI
      if (setLastSavedTime && setSaveStatus) {
        setLastSavedTime(new Date());
        setSaveStatus('saved');
      }
    } catch (error) {
      console.error('Failed to delete order item:', error);
      setErrorMessage('Failed to delete country. Please try again.');
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
    disabled = false,
    createdOrderItems,
    debouncedUpdateOrderItem,
  }: {
    countryId: string;
    selectedVisaType: string;
    onVisaTypeSelect: (countryId: string, visaType: string) => void;
    disabled?: boolean;
    createdOrderItems: Record<string, string>;
    debouncedUpdateOrderItem: (
      orderItemId: string,
      updates: OrderItemUpdate,
      countryId: string
    ) => void;
  }) => {
    const { data: visaTypesData } = trpc.visaType.getByCountry.useQuery({ countryId });

    const handleVisaTypeClick = useCallback(
      (visaTypeId: string) => {
        // Update UI state immediately (optimistic) - no blocking
        onVisaTypeSelect(countryId, visaTypeId);

        // Update order item with correct price from VisaType
        const orderItemId = createdOrderItems[countryId];
        if (orderItemId && visaTypesData?.visaTypes) {
          const selectedVisaTypeData = visaTypesData.visaTypes.find(vt => vt.id === visaTypeId);
          if (selectedVisaTypeData?.serviceCost) {
            const newPrice = selectedVisaTypeData.serviceCost;
            debouncedUpdateOrderItem(
              orderItemId,
              {
                visaTypeId: visaTypeId,
                basePrice: newPrice,
                finalPrice: newPrice,
              },
              countryId
            );
          }
        }
      },
      [countryId, onVisaTypeSelect, createdOrderItems, visaTypesData, debouncedUpdateOrderItem]
    );

    return (
      <div className="space-y-3">
        <Label className={cn('text-sm font-medium', disabled && 'text-muted-foreground')}>
          Visa type
        </Label>
        <div className="flex flex-wrap gap-2">
          {visaTypesData?.visaTypes
            ?.sort((a, b) => {
              // Sort favorites first, then alphabetically
              if (a.favourite && !b.favourite) return -1;
              if (!a.favourite && b.favourite) return 1;
              return a.name.localeCompare(b.name);
            })
            ?.map(visaType => (
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
                className="transition-all duration-200"
              >
                {visaType.name}
              </Button>
            ))}
        </div>
        <div className="flex justify-end items-center">
          <span className="font-semibold">
            {formatCurrency(
              visaTypesData?.visaTypes?.find(vt => vt.id === selectedVisaType)?.serviceCost || 0,
              'VND'
            )}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div>
      <Label className="text-sm mb-2">Add Visa</Label>
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
