import { useCallback, useRef, useEffect } from 'react';
import { useOrderEditStore } from './useOrderEditStore';
import { useOrderFormStore, type OrderFormData } from './useOrderFormStore';
import { trpc } from '@/lib/trpc';
import { useQueryClient } from '@tanstack/react-query';

export interface AutoSaveOptions {
  delay?: number; // Delay in milliseconds before auto-save triggers
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export interface AutoSaveResult {
  performSave: (data: OrderFormData, saveType?: 'user' | 'client' | 'both') => Promise<void>;
  debouncedAutoSave: (data: OrderFormData, saveType?: 'user' | 'client' | 'both') => void;
  cancelAutoSave: () => void;
  isAutoSaving: boolean;
  saveInBackground: (data: OrderFormData, saveType?: 'user' | 'client' | 'both') => void;
}

export const useAutoSave = (
  orderData: any,
  primaryClientData: any,
  options: AutoSaveOptions = {}
): AutoSaveResult => {
  const { delay = 1000, onSuccess, onError } = options;

  // Zustand stores
  const {
    isSaving,
    setIsSaving,
    setSaveStatus,
    setErrorMessage,
    setLastSavedTime,
    optimisticPrimaryClientData,
    setOptimisticPrimaryClientData,
  } = useOrderEditStore();

  const { setLastAutoSaveTime, setAutoSaveTimeoutId, autoSaveTimeoutId } = useOrderFormStore();

  // Contact methods are handled within the auto-save logic

  // tRPC mutations
  const updateClientMutation = trpc.client.edit.useMutation({
    onError: () => {},
  });
  const updateUserMutation = trpc.user.edit.useMutation();
  const updateContactMethodMutation = trpc.userContactMethod.edit.useMutation();
  const createContactMethodMutation = trpc.userContactMethod.create.useMutation();
  const deleteContactMethodMutation = trpc.userContactMethod.delete.useMutation();
  const updateOrderMutation = trpc.order.edit.useMutation({});

  // Query client for cache invalidation
  const queryClient = useQueryClient();

  // Ref to store the latest primary client data
  const primaryClientDataRef = useRef(primaryClientData);

  // Ref to track ongoing contact method updates
  const contactMethodUpdatesRef = useRef<Set<string>>(new Set());

  // Update ref when data changes
  useEffect(() => {
    primaryClientDataRef.current = optimisticPrimaryClientData || primaryClientData;
  }, [primaryClientData, optimisticPrimaryClientData]);

  // Auto-save function - non-blocking
  const autoSave = useCallback(
    async (data: OrderFormData, saveType: 'user' | 'client' | 'both' = 'both') => {
      const currentOrderData = orderData?.order;
      const currentPrimaryClientData = primaryClientDataRef.current;

      if (!currentOrderData) {
        return;
      }

      // Use requestAnimationFrame to avoid blocking UI
      return new Promise<void>((resolve, reject) => {
        requestAnimationFrame(async () => {
          // Don't block if already saving
          if (isSaving) {
            console.log('Auto-save already in progress, skipping...');
            resolve();
            return;
          }

          setIsSaving(true);
          setSaveStatus('saving');
          setErrorMessage(null);

          try {
            const order = currentOrderData as any;
            const user = order.user;
            const primaryClient = currentPrimaryClientData?.client;
            const clientId = primaryClient?.id;

            if (!clientId && (saveType === 'client' || saveType === 'both')) {
              throw new Error('Client ID is required for client update');
            }

            // Save user data if requested
            if (saveType === 'user' || saveType === 'both') {
              // Update user name information
              await updateUserMutation.mutateAsync({
                id: user.id,
                firstName: data.firstName || '',
                lastName: data.lastName || '',
              });

              // Update contact method if provided
              if (data.contactMethodId && data.contactValue) {
                const existingContactMethods = user.contactMethods || [];

                if (existingContactMethods.length > 0) {
                  // Update the first existing contact method with new type and/or value
                  const firstContactMethod = existingContactMethods[0];
                  const updateKey = firstContactMethod.id;

                  // Check if we need to update (either type or value changed)
                  const needsUpdate =
                    firstContactMethod.method.id !== data.contactMethodId ||
                    firstContactMethod.value !== data.contactValue;

                  if (needsUpdate && !contactMethodUpdatesRef.current.has(updateKey)) {
                    contactMethodUpdatesRef.current.add(updateKey);
                    try {
                      await updateContactMethodMutation.mutateAsync({
                        id: firstContactMethod.id,
                        contactMethodId: data.contactMethodId,
                        value: data.contactValue,
                      });
                    } finally {
                      contactMethodUpdatesRef.current.delete(updateKey);
                    }
                  }
                } else {
                  // No existing contact method, create a new one
                  const createKey = `create-${user.id}-${data.contactMethodId}`;
                  if (!contactMethodUpdatesRef.current.has(createKey)) {
                    contactMethodUpdatesRef.current.add(createKey);
                    try {
                      await createContactMethodMutation.mutateAsync({
                        userId: user.id,
                        contactMethodId: data.contactMethodId,
                        value: data.contactValue,
                      });
                    } finally {
                      contactMethodUpdatesRef.current.delete(createKey);
                    }
                  }
                }
              }
            }

            // Save client data if requested
            if (saveType === 'client' || saveType === 'both') {
              // Safe date conversion for tRPC transmission - use ISO string
              let passportExpirationDate = null;
              if (data.passportExpirationDate) {
                if (data.passportExpirationDate instanceof Date) {
                  passportExpirationDate = data.passportExpirationDate.toISOString();
                } else if (typeof data.passportExpirationDate === 'string') {
                  try {
                    passportExpirationDate = new Date(data.passportExpirationDate).toISOString();
                  } catch {
                    console.error('Invalid date string:', data.passportExpirationDate);
                    passportExpirationDate = null;
                  }
                } else {
                  console.warn(
                    'Unexpected passport date format:',
                    typeof data.passportExpirationDate,
                    data.passportExpirationDate
                  );
                }
              }

              const clientUpdateData = {
                id: clientId,
                firstName: data.firstName || '',
                lastName: data.lastName || '',
                citizenshipId: data.citizenshipId === 'none' ? null : data.citizenshipId || null,
                passportExpirationDate,
              };

              try {
                await updateClientMutation.mutateAsync(clientUpdateData);
              } catch (clientError) {
                console.error('Primary client update failed:', clientError);
                throw clientError;
              }
            }

            // Always update order timestamp when any entity is updated
            await updateOrderMutation.mutateAsync({
              id: order.id,
              status: order.status,
            });

            // If citizenship was updated, invalidate primary client data to update blacklist state
            if (saveType === 'client' || saveType === 'both') {
              await queryClient.invalidateQueries({
                queryKey: ['client', 'getByUserId', { userId: user.id }],
              });
            }

            // Update timestamps
            const now = new Date();
            setLastSavedTime(now);
            setLastAutoSaveTime(now);
            setSaveStatus('saved');

            onSuccess?.();
            resolve();
          } catch (error) {
            setSaveStatus('error');
            setErrorMessage('Failed to auto-save. Please try again.');

            // Reset optimistic data only on client save errors
            if (saveType === 'client' || saveType === 'both') {
              setOptimisticPrimaryClientData(primaryClientData);
            }

            onError?.(error as Error);
            reject(error);
          } finally {
            setIsSaving(false);
          }
        });
      });
    },
    [
      orderData,
      isSaving,
      updateUserMutation.mutateAsync,
      updateClientMutation.mutateAsync,
      updateContactMethodMutation.mutateAsync,
      createContactMethodMutation.mutateAsync,
      deleteContactMethodMutation.mutateAsync,
      updateOrderMutation.mutateAsync,
      queryClient,
      primaryClientData,
      setIsSaving,
      setSaveStatus,
      setErrorMessage,
      setLastSavedTime,
      setLastAutoSaveTime,
      setOptimisticPrimaryClientData,
      onSuccess,
      onError,
    ]
  );

  // Perform immediate save
  const performSave = useCallback(
    async (data: OrderFormData, saveType: 'user' | 'client' | 'both' = 'both') => {
      await autoSave(data, saveType);
    },
    [autoSave]
  );

  // Debounced auto-save - non-blocking
  const debouncedAutoSave = useCallback(
    (data: OrderFormData, saveType: 'user' | 'client' | 'both' = 'both') => {
      // Clear existing timeout
      if (autoSaveTimeoutId) {
        clearTimeout(autoSaveTimeoutId);
      }

      // Set new timeout with immediate execution to prevent blocking
      const timeoutId = setTimeout(() => {
        // Use setTimeout(0) to push to next event loop tick
        setTimeout(() => {
          autoSave(data, saveType).catch(error => {
            console.error('Auto-save failed:', error);
          });
        }, 0);
        setAutoSaveTimeoutId(null);
      }, delay);

      setAutoSaveTimeoutId(timeoutId);
    },
    [autoSave, delay, setAutoSaveTimeoutId]
  );

  // Cancel auto-save
  const cancelAutoSave = useCallback(() => {
    if (autoSaveTimeoutId) {
      clearTimeout(autoSaveTimeoutId);
      setAutoSaveTimeoutId(null);
    }
  }, [setAutoSaveTimeoutId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutId) {
        clearTimeout(autoSaveTimeoutId);
      }
    };
  }, []);

  // Background save - doesn't block UI
  const saveInBackground = useCallback(
    (data: OrderFormData, saveType: 'user' | 'client' | 'both' = 'both') => {
      // Use setTimeout to push to next tick, preventing UI blocking
      setTimeout(() => {
        autoSave(data, saveType).catch(error => {
          console.error('Background save failed:', error);
        });
      }, 0);
    },
    [autoSave]
  );

  return {
    performSave,
    debouncedAutoSave,
    cancelAutoSave,
    isAutoSaving: isSaving,
    saveInBackground,
  };
};
