import { useState, useEffect, useCallback, memo, useRef, useMemo } from 'react';

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

import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { AlertCircle } from 'lucide-react';
import { useOrderEditStore } from '@/stores';
import { useLoadVisaTypes } from '@/hooks/useOrderEditData';
import { useSurcharge } from '@/hooks/useSurcharge';

interface OrderItemUpdate {
  serviceTypeId?: string;
  note?: string;
  basePrice?: number;
  finalPrice?: number;
  visaTypeId?: string;
}

interface VisaCardProps {
  orderData: any;
}

const VisaCard = memo(({ orderData }: VisaCardProps) => {
  // Access Zustand store directly
  const {
    optimisticOrder,
    optimisticPrimaryClientData,
    setErrorMessage,
    setLastSavedTime,
    setSaveStatus,
    setOptimisticOrder,
    updateOptimisticOrderItem,
    addOptimisticOrderItem,
    removeOptimisticOrderItem,
    setVisaApplications,
  } = useOrderEditStore();

  // Use optimistic data from Zustand store
  const currentPrimaryClientData = optimisticPrimaryClientData;

  // Stabilize citizenship ID to prevent unnecessary re-queries
  const stableCitizenshipId = useMemo(() => {
    const citizenshipId = currentPrimaryClientData?.client?.citizenshipId;
    return citizenshipId;
  }, [currentPrimaryClientData?.client?.citizenshipId]);
  const [addedCountryCards, setAddedCountryCards] = useState<Set<string>>(new Set());
  const [selectedVisaTypes, setSelectedVisaTypes] = useState<Record<string, string>>({});
  const [entryDates, setEntryDates] = useState<Record<string, Date | null>>({});
  const [entryTimes, setEntryTimes] = useState<Record<string, string>>({});
  const [localVisaApps, setLocalVisaApps] = useState<Record<string, any>>({});
  const [isMultientryEnabled, setIsMultientryEnabled] = useState<Record<string, boolean>>({});

  // Track when visa type updates are in progress
  const visaTypeUpdateInProgress = useRef<boolean>(false);

  // Track recent user selections to prevent server data from overwriting them
  const recentUserSelections = useRef<Map<string, { timestamp: number; visaTypeId: string }>>(
    new Map()
  );
  const recentMultiEntrySelections = useRef<
    Map<string, { timestamp: number; isMultientry: boolean }>
  >(new Map());
  const recentEntryDateSelections = useRef<Map<string, { timestamp: number; date: Date | null }>>(
    new Map()
  );
  const recentEntryTimeSelections = useRef<Map<string, { timestamp: number; time: string }>>(
    new Map()
  );
  const focusedTimeInputs = useRef<Set<string>>(new Set());

  // Get data from Zustand store
  const { countries: countriesData, visaApplications: visaApplicationsData } = useOrderEditStore();

  // State for selected countries and their cards
  const [createdOrderItems, setCreatedOrderItems] = useState<Record<string, string>>({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [countryToDelete, setCountryToDelete] = useState<string | null>(null);

  // Order item mutations
  const createOrderItemMutation = trpc.orderItem.create.useMutation({
    onSuccess: async data => {
      // Update save status in UI
      if (setLastSavedTime && setSaveStatus) {
        setLastSavedTime(new Date());
        setSaveStatus('saved');
      }
      // Update optimistic order with new data
      if (data.orderItem && setOptimisticOrder) {
        const updatedOrder = { ...orderData.order };
        const existingItemIndex = updatedOrder.items.findIndex(
          (item: any) => item.id === data.orderItem.id
        );

        if (existingItemIndex >= 0) {
          // Update existing item
          updatedOrder.items = updatedOrder.items.map((item: any) =>
            item.id === data.orderItem.id ? data.orderItem : item
          );
        } else {
          // Add new item
          updatedOrder.items = [...updatedOrder.items, data.orderItem];
        }
        setOptimisticOrder(updatedOrder);
      }
    },
  });
  const updateOrderItemMutation = trpc.orderItem.edit.useMutation({
    onSuccess: async data => {
      // Update save status in UI
      if (setLastSavedTime && setSaveStatus) {
        setLastSavedTime(new Date());
        setSaveStatus('saved');
      }
      if (visaTypeUpdateInProgress.current) {
        visaTypeUpdateInProgress.current = false;
      }
      // Update optimistic order with new data
      if (data.orderItem && setOptimisticOrder && orderData?.order) {
        const updatedOrder = { ...orderData.order };
        updatedOrder.items = updatedOrder.items.map((item: any) =>
          item.id === data.orderItem.id ? data.orderItem : item
        );
        setOptimisticOrder(updatedOrder);
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
        setSaveStatus('error');
      }
    },
  });
  const deleteOrderItemMutation = trpc.orderItem.delete.useMutation({
    onSuccess: async () => {
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
    onMutate: async variables => {
      // Optimistically update visa applications data immediately
      const { id, visaTypeId, isMultientry, plannedCountryEntryDate } = variables;

      // Find the visa application being updated
      const visaApps = visaApplicationsData || [];
      const updatedVisaApps = visaApps.map(app => {
        if (app.id === id) {
          return {
            ...app,
            ...(visaTypeId !== undefined && { visaTypeId }),
            ...(isMultientry !== undefined && { isMultientry }),
            ...(plannedCountryEntryDate !== undefined && {
              plannedCountryEntryDate: new Date(plannedCountryEntryDate),
            }),
          };
        }
        return app;
      });

      // Update the store with optimistic data
      setVisaApplications(updatedVisaApps);

      return { previousVisaApps: visaApps };
    },
    onSuccess: async () => {
      // Update save status in UI with optimistic update
      if (setLastSavedTime && setSaveStatus) {
        setLastSavedTime(new Date());
        setSaveStatus('saved');
      }

      // Clear recent user selections after successful server update
      setTimeout(() => {
        recentUserSelections.current.clear();
        recentMultiEntrySelections.current.clear();
        recentEntryDateSelections.current.clear();
        recentEntryTimeSelections.current.clear();
      }, 1000); // Clear after 1 second to allow for any pending effects
    },
    onError: (error, _variables, context) => {
      console.error('Failed to update visa application:', error);
      setErrorMessage('Failed to save visa changes. Please try again.');
      setSaveStatus('error');

      // Rollback optimistic update on error
      if (context?.previousVisaApps) {
        setVisaApplications(context.previousVisaApps);
      }
    },
  });

  // Non-blocking autosave function with request queuing
  const debouncedUpdateOrderItem = useCallback(
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

        // Fire and forget - completely non-blocking
        updateOrderItemMutation.mutate(
          {
            id: orderItemId,
            ...queuedRequest.updates,
          },
          {
            onSuccess: () => {
              // Success - show saved status
              if (setLastSavedTime && setSaveStatus) {
                setLastSavedTime(new Date());
                setSaveStatus('saved');
              }
            },
            onError: (error: any) => {
              console.error('Failed to autosave order item:', error);
              if (setSaveStatus) {
                setSaveStatus('error');
              }
            },
          }
        );
      }, 800); // Debounce delay
    },
    [
      updateOrderItemMutation,
      orderData?.order?.status,
      setSaveStatus,
      setErrorMessage,
      setLastSavedTime,
    ]
  );

  // CountryCard component to handle individual country logic with blacklist checking
  const CountryCard = memo(
    ({
      countryId,
      country,
      isBlacklisted,
      entryDate,
      entryTime,

      onEntryDateSelect,
      onEntryTimeBlur,
      onDeleteCountry,
    }: {
      countryId: string;
      country: { id: string; name: string };
      isBlacklisted: boolean;
      entryDate: Date | null;
      entryTime: string;
      onEntryDateSelect: (countryId: string, date: Date | null) => void;
      onEntryTimeBlur: (countryId: string, time: string) => void;
      onVisaTypeSelect: (countryId: string, visaType: string) => void;
      onMultiEntryToggle: (countryId: string, isMultientry: boolean) => void;
      onDeleteCountry: (countryId: string) => void;
    }) => {
      // Local state for time input to avoid re-renders during typing
      const [localTime, setLocalTime] = useState(entryTime);

      // Update local time when prop changes (but not during user input)
      useEffect(() => {
        if (!focusedTimeInputs.current.has(countryId)) {
          setLocalTime(entryTime);
        }
      }, [entryTime, countryId]);

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

      const handleTimeChange = useCallback((newTime: string) => {
        // Only update local state during typing
        setLocalTime(convertFromTimeInput(newTime));
      }, []);

      const handleTimeFocus = useCallback(() => {
        // Track that this input is focused
        focusedTimeInputs.current.add(countryId);
      }, [countryId]);

      const handleTimeBlur = useCallback(() => {
        // Remove from focused set and save the current value to parent
        focusedTimeInputs.current.delete(countryId);
        onEntryTimeBlur(countryId, convertFromTimeInput(localTime));
      }, [localTime, countryId, onEntryTimeBlur]);

      return (
        <Card className={cn('p-3 bg-secondary')}>
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Badge variant={isBlacklisted ? 'destructive' : 'accent'}>
                  Visa - {country.name}
                </Badge>
                <SurchargeDisplayBadge
                  countryId={countryId}
                  visaTypeId={selectedVisaTypes[countryId]}
                  citizenshipId={stableCitizenshipId}
                />
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
                    value={convertToTimeInput(localTime)}
                    onChange={e => handleTimeChange(e.target.value)}
                    onFocus={handleTimeFocus}
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
              <VisaFreeInfo countryId={countryId} clientCitizenshipId={stableCitizenshipId} />
            </div>
          </div>

          {/* Visa Type */}
          <div className={isBlacklisted ? 'opacity-50' : ''}>
            <MemoizedVisaTypeSelector
              countryId={countryId}
              selectedVisaType={selectedVisaTypes[countryId] || ''}
              onVisaTypeSelect={handleVisaTypeSelect}
              onMultiEntryToggle={handleMultiEntryToggle}
              currentMultientryState={isMultientryEnabled[countryId] || false}
              disabled={isBlacklisted}
              createdOrderItems={createdOrderItems}
              debouncedUpdateOrderItem={debouncedUpdateOrderItem}
              updateOptimisticOrderItem={updateOptimisticOrderItem}
              optimisticOrder={optimisticOrder}
              orderData={orderData}
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
    country: { id: string; name: string };
  }) => {
    // Load detailed country data to get blacklist information
    const { data: countryData } = trpc.country.getOne.useQuery(
      { id: countryId },
      { enabled: !!countryId }
    );

    // Check if current citizenship is blacklisted for this country
    const isBlacklisted = useMemo(() => {
      if (!countryData?.country?.blacklisted || !stableCitizenshipId) {
        return false;
      }

      return countryData.country.blacklisted.some(
        entry => entry.citizenshipId === stableCitizenshipId
      );
    }, [countryData?.country?.blacklisted, stableCitizenshipId]);

    return (
      <CountryCard
        countryId={countryId}
        country={country}
        isBlacklisted={isBlacklisted}
        entryDate={entryDates[countryId] || null}
        entryTime={entryTimes[countryId] || '10:00'}
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

    if (!orderData?.order || !currentPrimaryClientData?.client) {
      console.error('❌ Missing required data:', {
        hasOrder: !!orderData?.order,
        hasClient: !!currentPrimaryClientData?.client,
      });
      setErrorMessage('Order or client data not available');
      return;
    }

    try {
      const country = countriesData?.find(c => c.id === countryId);
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

      // Create order item directly without optimistic updates
      const basePrice = 0; // Default price for visa

      // Generate temporary ID for optimistic update
      const tempOrderItemId = `temp_${countryId}_${Date.now()}`;

      // Immediately add to optimistic order for Summary Section
      if (addOptimisticOrderItem) {
        addOptimisticOrderItem({
          id: tempOrderItemId,
          serviceType: 'visa',
          serviceTypeId: countryId,
          basePrice,
          finalPrice: basePrice,
          discountAmount: 0,
          note: `Visa service for ${country.name}`,
        });
      }

      // Clear any old visa application data for this country to prevent stale blacklist data
      setLocalVisaApps(prev => {
        const updated = { ...prev };
        delete updated[countryId];
        return updated;
      });

      try {
        // Create order item on server
        const orderItemResponse = await createOrderItemMutation.mutateAsync({
          orderId: orderData.order.id,
          clientId: currentPrimaryClientData.client.id,
          serviceType: 'visa' as const,
          serviceTypeId: countryId,
          basePrice,
          finalPrice: basePrice,
          discountAmount: 0,
          note: `Visa service for ${country.name}`,
          plannedCountryEntryDate: undefined,
          visaTypeId: undefined,
        });

        // Remove temporary optimistic item and replace with real one
        if (removeOptimisticOrderItem) {
          removeOptimisticOrderItem(tempOrderItemId);
        }

        // Store the actual order item ID
        const actualOrderItem = orderItemResponse.orderItem;
        setCreatedOrderItems(prev => ({ ...prev, [countryId]: actualOrderItem.id }));

        // Store visa application data if created
        if (orderItemResponse.visaApplication) {
          setLocalVisaApps(prev => ({
            ...prev,
            [countryId]: orderItemResponse.visaApplication as any,
          }));
        }

        // Force refresh visa applications to clear any stale blacklist data
        setTimeout(() => {
          // This ensures visa applications are refreshed with clean data
          setLocalVisaApps(prev => ({ ...prev }));
        }, 100);
      } catch (error) {
        console.error('Failed to create order item:', error);

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
    const currentOrder = optimisticOrder || orderData?.order;
    if (currentOrder?.items && visaApplicationsData && countriesData) {
      const visaOrderItems = currentOrder.items.filter((item: any) => item.serviceType === 'visa');

      // Start with current state to preserve user changes
      const newAddedCountries = new Set(addedCountryCards);
      const newCreatedOrderItems: Record<string, string> = { ...createdOrderItems };
      const newSelectedVisaTypes: Record<string, string> = { ...selectedVisaTypes };
      const newEntryDates: Record<string, Date | null> = { ...entryDates };
      const newEntryTimes: Record<string, string> = { ...entryTimes };
      const newVisaApplications: Record<string, any> = { ...localVisaApps };
      const newIsMultientryEnabled: Record<string, boolean> = { ...isMultientryEnabled };

      visaOrderItems.forEach((item: any) => {
        if (item.serviceTypeId) {
          // For visa items, serviceTypeId should be countryId
          const countryId = item.serviceTypeId;
          const isCountry = countriesData.some(c => c.id === countryId);

          if (isCountry) {
            newAddedCountries.add(countryId);
            newCreatedOrderItems[countryId] = item.id;

            // Find corresponding visa application for this order item
            const visaApp = visaApplicationsData.find((app: any) => app.orderItemId === item.id);

            if (visaApp) {
              // Store visa application data
              newVisaApplications[countryId] = visaApp;

              // Set selected visa type from visa application, but only if user hasn't selected something recently
              if (visaApp.visaTypeId) {
                const recentSelection = recentUserSelections.current.get(countryId);
                const currentTime = Date.now();
                const isRecentSelection =
                  recentSelection && currentTime - recentSelection.timestamp < 30000; // 30 seconds

                if (!isRecentSelection && !newSelectedVisaTypes[countryId]) {
                  newSelectedVisaTypes[countryId] = visaApp.visaTypeId;
                } else if (isRecentSelection) {
                  // Keep the recent user selection
                  newSelectedVisaTypes[countryId] = recentSelection.visaTypeId;
                }
              }

              // Set multi-entry status from visa application, but only if user hasn't selected something recently
              const recentMultiEntrySelection = recentMultiEntrySelections.current.get(countryId);
              const currentTime = Date.now();
              const isRecentMultiEntrySelection =
                recentMultiEntrySelection &&
                currentTime - recentMultiEntrySelection.timestamp < 30000;

              if (!isRecentMultiEntrySelection && newIsMultientryEnabled[countryId] === undefined) {
                newIsMultientryEnabled[countryId] = (visaApp as any).isMultientry || false;
              } else if (isRecentMultiEntrySelection) {
                // Keep the recent user selection
                newIsMultientryEnabled[countryId] = recentMultiEntrySelection.isMultientry;
              }

              // Parse planned entry date and time, but only if user hasn't selected something recently
              const recentDateSelection = recentEntryDateSelections.current.get(countryId);
              const recentTimeSelection = recentEntryTimeSelections.current.get(countryId);
              const isRecentDateSelection =
                recentDateSelection && currentTime - recentDateSelection.timestamp < 30000;
              const isRecentTimeSelection =
                recentTimeSelection && currentTime - recentTimeSelection.timestamp < 30000;
              const isTimeInputFocused = focusedTimeInputs.current.has(countryId);

              if (visaApp.plannedCountryEntryDate) {
                const entryDateTime = new Date(visaApp.plannedCountryEntryDate);

                if (!isRecentDateSelection && !newEntryDates[countryId]) {
                  newEntryDates[countryId] = entryDateTime;
                } else if (isRecentDateSelection) {
                  newEntryDates[countryId] = recentDateSelection.date;
                }

                // Extract time in HH:MM format
                const hours = entryDateTime.getHours().toString().padStart(2, '0');
                const minutes = entryDateTime.getMinutes().toString().padStart(2, '0');
                const serverTime = `${hours}:${minutes}`;

                if (!isRecentTimeSelection && !isTimeInputFocused && !newEntryTimes[countryId]) {
                  newEntryTimes[countryId] = serverTime;
                } else if (isRecentTimeSelection) {
                  newEntryTimes[countryId] = recentTimeSelection.time;
                } else if (isTimeInputFocused) {
                  // Keep current value if input is focused
                  newEntryTimes[countryId] = entryTimes[countryId] || serverTime;
                }
              } else {
                if (!isRecentDateSelection && newEntryDates[countryId] === undefined) {
                  newEntryDates[countryId] = null;
                } else if (isRecentDateSelection) {
                  newEntryDates[countryId] = recentDateSelection.date;
                }

                if (!isRecentTimeSelection && !isTimeInputFocused && !newEntryTimes[countryId]) {
                  newEntryTimes[countryId] = '10:00';
                } else if (isRecentTimeSelection) {
                  newEntryTimes[countryId] = recentTimeSelection.time;
                } else if (isTimeInputFocused) {
                  // Keep current value if input is focused
                  newEntryTimes[countryId] = entryTimes[countryId] || '10:00';
                }
              }
            }
          }
        }
      });

      setAddedCountryCards(newAddedCountries);
      setCreatedOrderItems(newCreatedOrderItems);
      setLocalVisaApps(newVisaApplications);
      setSelectedVisaTypes(newSelectedVisaTypes);
      setEntryDates(newEntryDates);
      setEntryTimes(newEntryTimes);
      setIsMultientryEnabled(newIsMultientryEnabled);
    }
  }, [optimisticOrder, orderData?.order, visaApplicationsData, countriesData, setVisaApplications]);

  const handleVisaTypeSelect = useCallback(
    (countryId: string, visaType: string) => {
      // Track this as a recent user selection
      recentUserSelections.current.set(countryId, {
        timestamp: Date.now(),
        visaTypeId: visaType,
      });

      // Update UI state immediately for instant feedback using functional update
      setSelectedVisaTypes(prev => {
        // Force a new object reference to ensure React detects the change
        const newState = { ...prev };
        newState[countryId] = visaType;
        return newState;
      });

      // Show saving status immediately
      if (setSaveStatus) {
        setSaveStatus('saving');
      }

      // Use requestAnimationFrame for better timing of server update
      requestAnimationFrame(() => {
        const visaApp = localVisaApps[countryId];
        if (visaApp && visaType) {
          updateVisaApplicationMutation.mutate({
            id: visaApp.id,
            visaTypeId: visaType,
          });
        }
      });
    },
    [localVisaApps, updateVisaApplicationMutation, setSaveStatus]
  );

  const handleMultiEntryToggle = useCallback(
    (countryId: string, isMultientry: boolean) => {
      // Track this as a recent user selection
      recentMultiEntrySelections.current.set(countryId, {
        timestamp: Date.now(),
        isMultientry: isMultientry,
      });

      // Update UI state immediately for instant feedback
      setIsMultientryEnabled(prev => {
        const newState = { ...prev };
        newState[countryId] = isMultientry;
        return newState;
      });

      // Show saving status immediately
      if (setSaveStatus) {
        setSaveStatus('saving');
      }

      // Use requestAnimationFrame for better timing of server update
      requestAnimationFrame(() => {
        const visaApp = localVisaApps[countryId];
        if (visaApp) {
          updateVisaApplicationMutation.mutate({
            id: visaApp.id,
            isMultientry: isMultientry,
          });
        }
      });
    },
    [localVisaApps, updateVisaApplicationMutation, setSaveStatus]
  );

  const handleEntryDateSelect = useCallback(
    (countryId: string, date: Date | null) => {
      // Track this as a recent user selection
      recentEntryDateSelections.current.set(countryId, {
        timestamp: Date.now(),
        date: date,
      });

      setEntryDates(prev => ({ ...prev, [countryId]: date }));

      // Show saving status immediately
      if (setSaveStatus) {
        setSaveStatus('saving');
      }

      // Update visa application with entry date and time
      const visaApp = localVisaApps[countryId];

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
    [localVisaApps, entryTimes, updateVisaApplicationMutation, setSaveStatus]
  );

  const handleEntryTimeBlur = useCallback(
    (countryId: string, time: string) => {
      // Track this as a recent user selection
      recentEntryTimeSelections.current.set(countryId, {
        timestamp: Date.now(),
        time: time,
      });

      // Update local state
      setEntryTimes(prev => {
        const newState = { ...prev, [countryId]: time };
        return newState;
      });

      // Show saving status immediately
      if (setSaveStatus) {
        setSaveStatus('saving');
      }

      // Update visa application with entry time
      const visaApp = localVisaApps[countryId];
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
    [localVisaApps, entryDates, updateVisaApplicationMutation, setSaveStatus]
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
      visaApplications: { ...localVisaApps },
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

      setLocalVisaApps(prev => {
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
          const country = countriesData?.find(c => c.id === countryToDeleteRef);
          if (country) {
            addOptimisticOrderItem({
              id: orderItemId,
              serviceType: 'visa',
              serviceTypeId: countryToDeleteRef,
              basePrice: 0,
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
      setLocalVisaApps(currentState.visaApplications);
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
    // Load detailed country data to get blacklist information
    const { data: countryData } = trpc.country.getOne.useQuery(
      { id: country.id },
      { enabled: !!country.id }
    );

    const actuallyBlacklisted = useMemo(() => {
      if (!countryData?.country?.blacklisted || !stableCitizenshipId) {
        return false;
      }
      return countryData.country.blacklisted.some(
        entry => entry.citizenshipId === stableCitizenshipId
      );
    }, [countryData?.country?.blacklisted, stableCitizenshipId]);

    const isDisabled = isAdded || isLoading || actuallyBlacklisted;

    return (
      <Button
        variant={isAdded ? 'accent' : actuallyBlacklisted ? 'destructive' : 'secondary'}
        size="sm"
        onClick={event => {
          onClick(event, country.id);
        }}
        disabled={isDisabled}
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
    // Load detailed country data to get visa free and blacklist information
    const { data: countryData } = trpc.country.getOne.useQuery(
      { id: countryId },
      { enabled: !!countryId }
    );
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
    optimisticOrder,
    orderData,
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
    optimisticOrder: any;
    orderData: any;
  }) => {
    const visaTypes = useLoadVisaTypes(countryId);

    const selectedVisaTypeData = useMemo(
      () => visaTypes?.find(vt => vt.id === selectedVisaType),
      [visaTypes, selectedVisaType]
    );

    const handleVisaTypeClick = useCallback(
      (visaTypeId: string) => {
        // Prevent double-clicks and ensure immediate response
        if (selectedVisaType === visaTypeId) {
          return;
        }

        // Update parent callback synchronously for immediate visual feedback
        onVisaTypeSelect(countryId, visaTypeId);

        // Update order item optimistically for instant UI feedback
        const orderItemId = createdOrderItems[countryId];
        if (orderItemId && visaTypes) {
          const selectedVisaTypeData = visaTypes.find((vt: any) => vt.id === visaTypeId);
          if (selectedVisaTypeData?.serviceCost) {
            const basePrice = selectedVisaTypeData.serviceCost;
            const isMultientry = currentMultientryState;
            const extraCost = isMultientry ? selectedVisaTypeData.multientryExtraCost || 0 : 0;

            const finalPrice = basePrice + extraCost;

            // Update optimistic UI immediately for instant feedback
            if (updateOptimisticOrderItem) {
              updateOptimisticOrderItem(orderItemId, {
                visaTypeId: visaTypeId,
                basePrice: disabled ? 0 : finalPrice,
              });
            }

            // Use requestAnimationFrame for better timing
            requestAnimationFrame(() => {
              debouncedUpdateOrderItem(
                orderItemId,
                {
                  visaTypeId: visaTypeId,
                  basePrice: disabled ? 0 : finalPrice,
                  // Don't send finalPrice - let backend calculate it with surcharges
                },
                countryId
              );
            });
          }
        }
      },
      [
        countryId,
        selectedVisaType,
        onVisaTypeSelect,
        createdOrderItems,
        updateOptimisticOrderItem,
        debouncedUpdateOrderItem,
        visaTypes,
        currentMultientryState,
        disabled,
      ]
    );

    const handleMultiToggle = useCallback(
      (isMultientry: boolean) => {
        // Prevent unnecessary updates if state is already correct
        if (currentMultientryState === isMultientry) {
          return;
        }

        // Update state immediately for instant UI feedback
        onMultiEntryToggle(countryId, isMultientry);

        // Update order item price optimistically first
        const orderItemId = createdOrderItems[countryId];
        if (orderItemId && selectedVisaTypeData?.serviceCost) {
          const basePrice = selectedVisaTypeData.serviceCost;
          const extraCost = isMultientry ? selectedVisaTypeData.multientryExtraCost || 0 : 0;

          const finalPrice = basePrice + extraCost;

          // Update optimistic UI immediately for instant feedback
          if (updateOptimisticOrderItem) {
            updateOptimisticOrderItem(orderItemId, {
              basePrice: disabled ? 0 : finalPrice,
            });
          }

          // Use requestAnimationFrame for better timing
          requestAnimationFrame(() => {
            debouncedUpdateOrderItem(
              orderItemId,
              {
                basePrice: disabled ? 0 : finalPrice,
                // Don't send finalPrice - let backend calculate it with surcharges
              },
              countryId
            );
          });
        }
      },
      [
        currentMultientryState,
        onMultiEntryToggle,
        countryId,
        createdOrderItems,
        selectedVisaTypeData,
        debouncedUpdateOrderItem,
        updateOptimisticOrderItem,
        disabled,
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
              visaTypes?.sort((a: any, b: any) => {
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
            const favorites = sortedVisaTypes.filter((vt: any) => vt.favourite);
            const nonFavorites = sortedVisaTypes.filter((vt: any) => !vt.favourite);
            const nonFavoritesDays = nonFavorites.filter((vt: any) => vt.processingUnit === 'days');
            const nonFavoritesHours = nonFavorites.filter(
              (vt: any) => vt.processingUnit === 'hours'
            );

            const renderVisaTypeButton = (visaType: any, isLastInGroup: boolean = false) => {
              const isSelected = selectedVisaType === visaType.id;

              return (
                <Button
                  key={visaType.id}
                  variant={isSelected ? 'accent' : 'secondary'}
                  size="sm"
                  type="button"
                  disabled={disabled}
                  onClick={event => {
                    event.preventDefault();
                    event.stopPropagation();
                    if (!disabled && selectedVisaType !== visaType.id) {
                      handleVisaTypeClick(visaType.id);
                    }
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
        </div>
      </div>
    );
  };

  const MemoizedVisaTypeSelector = memo(VisaTypeSelector, (prevProps, nextProps) => {
    return (
      prevProps.selectedVisaType === nextProps.selectedVisaType &&
      prevProps.currentMultientryState === nextProps.currentMultientryState &&
      prevProps.disabled === nextProps.disabled &&
      prevProps.countryId === nextProps.countryId
    );
  });

  MemoizedVisaTypeSelector.displayName = 'VisaTypeSelector';

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <Label className="text-sm">Add Visa</Label>
      </div>
      <div className="space-y-6">
        {/* Add Visa Header with Country Buttons */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex flex-wrap gap-2">
            {countriesData
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
            const countryA = countriesData?.find(c => c.id === countryIdA);
            const countryB = countriesData?.find(c => c.id === countryIdB);

            if (!countryA || !countryB) return 0;

            // Sort favorites first, then alphabetically
            if (countryA.favourite && !countryB.favourite) return -1;
            if (!countryA.favourite && countryB.favourite) return 1;
            return countryA.name.localeCompare(countryB.name);
          })
          .map(countryId => {
            const country = countriesData?.find(c => c.id === countryId);
            if (!country) return null;
            return (
              <CountryCardWithBlacklistCheck
                key={`country-card-${countryId}`}
                countryId={countryId}
                country={country}
              />
            );
          })
          .filter(Boolean)}
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
});

// Component for displaying surcharge badge
const SurchargeDisplayBadge = memo(
  ({
    countryId,
    visaTypeId,
    citizenshipId,
  }: {
    countryId: string;
    visaTypeId?: string;
    citizenshipId?: string;
  }) => {
    // Always call hooks at the top level
    const { surcharge: specificSurcharge, hasSurcharge: hasSpecificSurcharge } = useSurcharge(
      citizenshipId,
      countryId,
      visaTypeId
    );

    const { surcharge: globalSurcharge, hasSurcharge: hasGlobalSurcharge } = useSurcharge(
      citizenshipId,
      countryId,
      undefined
    );

    // If no citizenship ID, don't show anything
    if (!citizenshipId || !countryId) return null;

    // Priority: specific surcharge > global surcharge
    let surchargeToShow = null;
    let hasSurchargeToShow = false;

    if (visaTypeId && hasSpecificSurcharge) {
      // Show specific surcharge if visa type is selected and specific surcharge exists
      surchargeToShow = specificSurcharge;
      hasSurchargeToShow = true;
    } else if (hasGlobalSurcharge) {
      // Show global surcharge if no specific surcharge or no visa type selected
      surchargeToShow = globalSurcharge;
      hasSurchargeToShow = true;
    }

    if (!hasSurchargeToShow || !surchargeToShow) return null;

    const message = `Additional charge ${formatCurrency(surchargeToShow.surchargeAmount, 'VND')} is applied to citizens of ${surchargeToShow.citizenship.name}`;

    return <Badge variant="destructive">{message}</Badge>;
  }
);

export default VisaCard;
