import { useCallback, useRef, useEffect } from 'react';
import { useOrderEditStore } from './useOrderEditStore';
import { type OrderFormData } from './useOrderFormStore';
import { trpc } from '@/lib/trpc';
import { useQueryClient } from '@tanstack/react-query';

export interface SaveOperation {
  id: string;
  data: OrderFormData;
  saveType: 'user' | 'client' | 'both';
  timestamp: number;
  retries: number;
}

export interface AutoSaveQueueOptions {
  maxRetries?: number;
  retryDelay?: number;
  batchSize?: number;
  debounceDelay?: number;
}

export interface AutoSaveQueueResult {
  queueSave: (data: OrderFormData, saveType?: 'user' | 'client' | 'both') => void;
  forceSave: (data: OrderFormData, saveType?: 'user' | 'client' | 'both') => Promise<void>;
  clearQueue: () => void;
  isProcessing: boolean;
  queueSize: number;
}

export const useAutoSaveQueue = (
  orderData: any,
  primaryClientData: any,
  options: AutoSaveQueueOptions = {}
): AutoSaveQueueResult => {
  const { maxRetries = 3, retryDelay = 1000, batchSize = 1, debounceDelay = 1500 } = options;

  // Zustand stores
  const { setSaveStatus, setErrorMessage, setLastSavedTime } = useOrderEditStore();

  // tRPC mutations
  const updateClientMutation = trpc.client.edit.useMutation();
  const updateUserMutation = trpc.user.edit.useMutation();
  const updateContactMethodMutation = trpc.userContactMethod.edit.useMutation();
  const createContactMethodMutation = trpc.userContactMethod.create.useMutation();
  // deleteContactMethodMutation removed - not used in auto-save queue
  const updateOrderMutation = trpc.order.edit.useMutation();

  // Query client for cache invalidation
  const queryClient = useQueryClient();

  // Queue management
  const queueRef = useRef<Map<string, SaveOperation>>(new Map());
  const processingRef = useRef<boolean>(false);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const primaryClientDataRef = useRef(primaryClientData);

  // Update ref when data changes
  useEffect(() => {
    primaryClientDataRef.current = primaryClientData;
  }, [primaryClientData]);

  // Process save operation
  const processSaveOperation = useCallback(
    async (operation: SaveOperation): Promise<boolean> => {
      const currentOrderData = orderData?.order;
      const currentPrimaryClientData = primaryClientDataRef.current;

      if (!currentOrderData) {
        return false;
      }

      try {
        const order = currentOrderData as any;
        const user = order.user;
        const primaryClient = currentPrimaryClientData?.client;
        const clientId = primaryClient?.id;

        if (!clientId && (operation.saveType === 'client' || operation.saveType === 'both')) {
          throw new Error('Client ID is required for client update');
        }

        // Save user data if requested
        if (operation.saveType === 'user' || operation.saveType === 'both') {
          await updateUserMutation.mutateAsync({
            id: user.id,
            firstName: operation.data.firstName || '',
            lastName: operation.data.lastName || '',
          });

          // Update contact method if provided
          if (operation.data.contactMethodId && operation.data.contactValue) {
            // Find existing contact method of the same type
            const existingContactMethod = user.contactMethods?.find(
              (cm: any) => cm.method.id === operation.data.contactMethodId
            );

            if (existingContactMethod) {
              // Contact method of this type exists - just update the value
              // Only update if the value has actually changed to avoid unnecessary requests
              if (existingContactMethod.value !== operation.data.contactValue) {
                await updateContactMethodMutation.mutateAsync({
                  id: existingContactMethod.id,
                  value: operation.data.contactValue,
                });
              }
            } else {
              // No contact method of this type exists - create new one
              await createContactMethodMutation.mutateAsync({
                userId: user.id,
                contactMethodId: operation.data.contactMethodId,
                value: operation.data.contactValue,
              });
            }
          }
        }

        // Save client data if requested
        if (operation.saveType === 'client' || operation.saveType === 'both') {
          let passportExpirationDate = null;
          if (operation.data.passportExpirationDate) {
            if (operation.data.passportExpirationDate instanceof Date) {
              passportExpirationDate = operation.data.passportExpirationDate.toISOString();
            } else if (typeof operation.data.passportExpirationDate === 'string') {
              try {
                passportExpirationDate = new Date(
                  operation.data.passportExpirationDate
                ).toISOString();
              } catch {
                passportExpirationDate = null;
              }
            }
          }

          const clientUpdateData = {
            id: clientId,
            firstName: operation.data.firstName || '',
            lastName: operation.data.lastName || '',
            citizenshipId:
              operation.data.citizenshipId === 'none' ? null : operation.data.citizenshipId || null,
            passportExpirationDate,
          };

          await updateClientMutation.mutateAsync(clientUpdateData);
        }

        // Update order timestamp
        await updateOrderMutation.mutateAsync({
          id: order.id,
          status: order.status,
        });

        // Invalidate queries if needed
        if (operation.saveType === 'client' || operation.saveType === 'both') {
          await queryClient.invalidateQueries({
            queryKey: ['client', 'getByUserId', { userId: user.id }],
          });
        }

        return true;
      } catch (error) {
        console.error('Save operation failed:', error);
        return false;
      }
    },
    [
      orderData,
      updateUserMutation,
      updateClientMutation,
      updateContactMethodMutation,
      createContactMethodMutation,
      updateOrderMutation,
      queryClient,
    ]
  );

  // Process queue
  const processQueue = useCallback(async () => {
    if (processingRef.current || queueRef.current.size === 0) {
      return;
    }

    processingRef.current = true;
    setSaveStatus('saving');

    try {
      // Get operations to process (up to batch size)
      const operations = Array.from(queueRef.current.values())
        .sort((a, b) => a.timestamp - b.timestamp)
        .slice(0, batchSize);

      // Process operations
      for (const operation of operations) {
        const success = await processSaveOperation(operation);

        if (success) {
          // Remove successful operation from queue
          queueRef.current.delete(operation.id);
        } else {
          // Retry failed operation
          if (operation.retries < maxRetries) {
            operation.retries++;
            operation.timestamp = Date.now() + retryDelay;
          } else {
            // Max retries reached, remove from queue
            queueRef.current.delete(operation.id);
            setErrorMessage('Failed to save after multiple attempts');
          }
        }
      }

      // Update save status
      if (queueRef.current.size === 0) {
        setSaveStatus('saved');
        setLastSavedTime(new Date());
        setErrorMessage(null);
      }

      // Continue processing if queue is not empty
      if (queueRef.current.size > 0) {
        setTimeout(() => {
          processingRef.current = false;
          processQueue();
        }, 100);
      } else {
        processingRef.current = false;
      }
    } catch (error) {
      processingRef.current = false;
      setSaveStatus('error');
      setErrorMessage('Auto-save failed');
      console.error('Queue processing failed:', error);
    }
  }, [
    batchSize,
    maxRetries,
    retryDelay,
    processSaveOperation,
    setSaveStatus,
    setLastSavedTime,
    setErrorMessage,
  ]);

  // Queue save operation
  const queueSave = useCallback(
    (data: OrderFormData, saveType: 'user' | 'client' | 'both' = 'both') => {
      // Create unique ID for this field type and save type
      const operationId = `${saveType}-${Date.now()}`;

      // Create save operation
      const operation: SaveOperation = {
        id: operationId,
        data: { ...data },
        saveType,
        timestamp: Date.now(),
        retries: 0,
      };

      // Remove any existing operations of the same type to avoid duplicates
      const existingKeys = Array.from(queueRef.current.keys()).filter(key =>
        key.startsWith(saveType)
      );
      existingKeys.forEach(key => queueRef.current.delete(key));

      // Add new operation to queue
      queueRef.current.set(operationId, operation);

      // Clear existing debounce timeout
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      // Set new debounce timeout
      debounceTimeoutRef.current = setTimeout(() => {
        processQueue();
      }, debounceDelay);
    },
    [debounceDelay, processQueue]
  );

  // Force immediate save
  const forceSave = useCallback(
    async (data: OrderFormData, saveType: 'user' | 'client' | 'both' = 'both') => {
      // Clear debounce timeout
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      // Create immediate operation
      const operation: SaveOperation = {
        id: `force-${Date.now()}`,
        data: { ...data },
        saveType,
        timestamp: Date.now(),
        retries: 0,
      };

      // Process immediately
      setSaveStatus('saving');
      const success = await processSaveOperation(operation);

      if (success) {
        setSaveStatus('saved');
        setLastSavedTime(new Date());
        setErrorMessage(null);
      } else {
        setSaveStatus('error');
        setErrorMessage('Save failed');
        throw new Error('Force save failed');
      }
    },
    [processSaveOperation, setSaveStatus, setLastSavedTime, setErrorMessage]
  );

  // Clear queue
  const clearQueue = useCallback(() => {
    queueRef.current.clear();
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    processingRef.current = false;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearQueue();
    };
  }, [clearQueue]);

  return {
    queueSave,
    forceSave,
    clearQueue,
    isProcessing: processingRef.current,
    queueSize: queueRef.current.size,
  };
};
