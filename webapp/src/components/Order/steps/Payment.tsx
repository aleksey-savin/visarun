import { useState, useMemo, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';

import { createDocumentFromFileUrl } from '@/utils/fileUtils';
import { useUploadPaymentDocument } from '@/hooks/useDocumentUpload';

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { OrderItem, PaymentMethod } from '@visarun/backend/node_modules/@prisma/client';

import { trpc } from '@/lib/trpc';

import useOrderStore, { StoreOrderPayment } from '@/stores/order/order-store';

import { formatCurrency } from '@/utils/currency';

import { FileUpload } from '@/components/ui/file-upload';
import { toast } from 'sonner';
import Comments from '../Comments';

const Payment = () => {
  const {
    order,
    orderItems,
    orderPayments = [],
    visarunPassengers = [],
    setOrderPayments,
    setSaveStatus,
  } = useOrderStore();

  const [isUploading, setIsUploading] = useState(false);
  const [currentUploadPaymentIndex, setCurrentUploadPaymentIndex] = useState<number | null>(null);
  const [isPartialPayment, setIsPartialPayment] = useState(false);
  const [paymentAmounts, setPaymentAmounts] = useState<number[]>([]);
  const [hasUserMadeSelection, setHasUserMadeSelection] = useState(false);

  const { data: currencyData } = trpc.currency.getAll.useQuery({
    search: '',
  });

  const { data: usersData } = trpc.user.getAll.useQuery({
    search: '',
    canAcceptPayments: true,
  });

  const [selectedCurrencyId, setSelectedCurrencyId] = useState<string>(
    orderPayments[0]?.currencyId || ''
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    orderPayments[0]?.paymentMethod || 'transfer'
  );
  const [selectedPaymentAcceptorId, setSelectedPaymentAcceptorId] = useState<string>(
    orderPayments[0]?.acceptedById || ''
  );

  const [paid, setPaid] = useState<boolean>(
    orderPayments[0]?.confirmPaymentWithoutDocument || false
  );

  // Separate states for partial payments
  const [partialPaymentMethods, setPartialPaymentMethods] = useState<PaymentMethod[]>([
    'transfer',
    'transfer',
  ]);
  const [partialPaymentAcceptorIds, setPartialPaymentAcceptorIds] = useState<string[]>(['', '']);
  const [partialPaymentPaid, setPartialPaymentPaid] = useState<boolean[]>([false, false]);

  // tRPC mutations for OrderPayment
  const createOrderPaymentMutation = trpc.orderPayment.create.useMutation();
  const editOrderPaymentMutation = trpc.orderPayment.edit.useMutation();

  const handlePaymentMethodChange = async () => {
    const newPaymentMethod: PaymentMethod = paymentMethod === 'transfer' ? 'cash' : 'transfer';
    setPaymentMethod(newPaymentMethod);

    // Create new OrderPayment if none exists, otherwise update existing
    const existingPayment = orderPayments[0];
    if (!existingPayment) {
      try {
        const currency = selectedCurrency || vndCurrency;
        if (!currency) {
          console.error('No currency selected for payment creation');
          return;
        }

        const newPayment = await createOrderPaymentMutation.mutateAsync({
          orderId: order.id,
          amount: total,
          amountInSelectedCurrency: total,
          currencyId: currency.id,
          paidAt: new Date().toISOString(),
          paymentMethod: newPaymentMethod,
          acceptedById: selectedPaymentAcceptorId || undefined,
          confirmPaymentWithoutDocument: paid,
        });

        // Add new payment to store
        const newOrderPayment = newPayment.orderPayment;
        const updatedPayments = [
          ...orderPayments,
          {
            id: newOrderPayment.id,
            orderId: newOrderPayment.orderId,
            currencyId: newOrderPayment.currencyId,
            amount: newOrderPayment.amount,
            amountInSelectedCurrency: newOrderPayment.amount,
            paymentMethod: newOrderPayment.paymentMethod as PaymentMethod,
            documentUrl: newOrderPayment.documentUrl,
            acceptedById: newOrderPayment.acceptedById,
            acceptedAt: null,
            paidAt: newOrderPayment.paidAt ? new Date(newOrderPayment.paidAt) : undefined,
            createdAt: new Date(),
            updatedAt: new Date(),
            confirmPaymentWithoutDocument: newOrderPayment.confirmPaymentWithoutDocument || false,
            acceptedByUser: newOrderPayment.acceptedByUser || null,
            currency: newOrderPayment.currency || currency,
          },
        ] as StoreOrderPayment[];
        setOrderPayments(updatedPayments);
      } catch (error) {
        console.error('Failed to create OrderPayment:', error);
        // Revert the state change on error
        setPaymentMethod(paymentMethod);
      }
    } else {
      try {
        await editOrderPaymentMutation.mutateAsync({
          id: existingPayment.id,
          paymentMethod: newPaymentMethod,
        });

        // Update store
        const updatedPayments = orderPayments.map((payment, index) =>
          index === 0 ? { ...payment, paymentMethod: newPaymentMethod } : payment
        );
        setOrderPayments(updatedPayments);
      } catch (error) {
        console.error('Failed to update payment method:', error);
        // Revert the state change on error
        setPaymentMethod(paymentMethod);
      }
    }
  };

  // Set VND as default currency when currencies are loaded
  const vndCurrency = useMemo(() => {
    return currencyData?.currencies?.find(curr => curr.name === 'VND');
  }, [currencyData?.currencies]);

  // Set VND as default when available
  useEffect(() => {
    if (vndCurrency && !selectedCurrencyId) {
      setSelectedCurrencyId(vndCurrency.id);
    }
  }, [vndCurrency, selectedCurrencyId]);

  const handleCurrencyChange = async (value: string) => {
    setSelectedCurrencyId(value);

    // Create new OrderPayment if none exists
    const existingPayment = orderPayments[0];
    if (!existingPayment) {
      try {
        const currency = currencyData?.currencies?.find(curr => curr.id === value);
        if (!currency) {
          console.error('Currency not found for payment creation');
          return;
        }

        const newPayment = await createOrderPaymentMutation.mutateAsync({
          orderId: order.id,
          amount: total,
          amountInSelectedCurrency: total,
          currencyId: currency.id,
          paidAt: new Date().toISOString(),
          paymentMethod: paymentMethod,
          acceptedById: selectedPaymentAcceptorId || undefined,
          confirmPaymentWithoutDocument: paid,
        });

        // Add new payment to store
        const newOrderPayment = newPayment.orderPayment;
        const updatedPayments = [
          ...orderPayments,
          {
            id: newOrderPayment.id,
            orderId: newOrderPayment.orderId,
            currencyId: newOrderPayment.currencyId,
            amount: newOrderPayment.amount,
            amountInSelectedCurrency: newOrderPayment.amount,
            paymentMethod: newOrderPayment.paymentMethod as PaymentMethod,
            documentUrl: newOrderPayment.documentUrl,
            acceptedById: newOrderPayment.acceptedById,
            acceptedAt: null,
            paidAt: newOrderPayment.paidAt ? new Date(newOrderPayment.paidAt) : undefined,
            createdAt: new Date(),
            updatedAt: new Date(),
            confirmPaymentWithoutDocument: newOrderPayment.confirmPaymentWithoutDocument || false,
            acceptedByUser: newOrderPayment.acceptedByUser || null,
            currency: newOrderPayment.currency || currency,
          },
        ] as StoreOrderPayment[];
        setOrderPayments(updatedPayments);
      } catch (error) {
        console.error('Failed to create OrderPayment:', error);
        // Revert the state change on error
        setSelectedCurrencyId(selectedCurrencyId);
      }
    } else {
      // Update existing payment currency
      try {
        await editOrderPaymentMutation.mutateAsync({
          id: existingPayment.id,
          currencyId: value,
        });

        // Update store
        const updatedPayments = orderPayments.map((payment, index) =>
          index === 0 ? { ...payment, currencyId: value } : payment
        );
        setOrderPayments(updatedPayments);
      } catch (error) {
        console.error('Failed to update currency:', error);
        // Revert the state change on error
        setSelectedCurrencyId(selectedCurrencyId);
      }
    }
  };

  const handlePaymentAcceptorChange = async (value: string) => {
    setSelectedPaymentAcceptorId(value);

    // Create new OrderPayment if none exists, otherwise update existing
    const existingPayment = orderPayments[0];
    if (!existingPayment) {
      try {
        const currency = selectedCurrency || vndCurrency;
        if (!currency) {
          console.error('No currency selected for payment creation');
          return;
        }

        const newPayment = await createOrderPaymentMutation.mutateAsync({
          orderId: order.id,
          amount: total,
          amountInSelectedCurrency: total,
          currencyId: currency.id,
          paidAt: new Date().toISOString(),
          paymentMethod: paymentMethod,
          acceptedById: value || undefined,
          confirmPaymentWithoutDocument: paid,
        });

        // Add new payment to store
        const newOrderPayment = newPayment.orderPayment;
        const updatedPayments = [
          ...orderPayments,
          {
            id: newOrderPayment.id,
            orderId: newOrderPayment.orderId,
            currencyId: newOrderPayment.currencyId,
            amount: newOrderPayment.amount,
            amountInSelectedCurrency: newOrderPayment.amount,
            paymentMethod: newOrderPayment.paymentMethod as PaymentMethod,
            documentUrl: newOrderPayment.documentUrl,
            acceptedById: newOrderPayment.acceptedById,
            acceptedAt: null,
            paidAt: newOrderPayment.paidAt ? new Date(newOrderPayment.paidAt) : undefined,
            createdAt: new Date(),
            updatedAt: new Date(),
            confirmPaymentWithoutDocument: newOrderPayment.confirmPaymentWithoutDocument || false,
            acceptedByUser: newOrderPayment.acceptedByUser || null,
            currency: newOrderPayment.currency || currency,
          },
        ] as StoreOrderPayment[];
        setOrderPayments(updatedPayments);
      } catch (error) {
        console.error('Failed to create OrderPayment:', error);
        // Revert the state change on error
        setSelectedPaymentAcceptorId('');
      }
    } else {
      try {
        await editOrderPaymentMutation.mutateAsync({
          id: existingPayment.id,
          acceptedById: value || undefined,
        });

        // Update store
        const updatedPayments = orderPayments.map((payment, index) =>
          index === 0 ? { ...payment, acceptedById: value } : payment
        );
        setOrderPayments(updatedPayments);
      } catch (error) {
        console.error('Failed to update payment acceptor:', error);
        // Revert the state change on error
        setSelectedPaymentAcceptorId(existingPayment.acceptedById || '');
      }
    }
  };

  const handlePaidChange = async (checked: boolean) => {
    setPaid(checked);

    // Create new OrderPayment if none exists, otherwise update existing
    const existingPayment = orderPayments[0];
    if (!existingPayment) {
      try {
        const currency = selectedCurrency || vndCurrency;
        if (!currency) {
          console.error('No currency selected for payment creation');
          return;
        }

        const newPayment = await createOrderPaymentMutation.mutateAsync({
          orderId: order.id,
          amount: total,
          amountInSelectedCurrency: total,
          currencyId: currency.id,
          paidAt: new Date().toISOString(),
          paymentMethod: paymentMethod,
          acceptedById: selectedPaymentAcceptorId || undefined,
          confirmPaymentWithoutDocument: checked,
        });

        // Add new payment to store
        const newOrderPayment = newPayment.orderPayment;
        const updatedPayments = [
          ...orderPayments,
          {
            id: newOrderPayment.id,
            orderId: newOrderPayment.orderId,
            currencyId: newOrderPayment.currencyId,
            amount: newOrderPayment.amount,
            amountInSelectedCurrency: newOrderPayment.amount,
            paymentMethod: newOrderPayment.paymentMethod as PaymentMethod,
            documentUrl: newOrderPayment.documentUrl,
            acceptedById: newOrderPayment.acceptedById,
            acceptedAt: null,
            paidAt: newOrderPayment.paidAt ? new Date(newOrderPayment.paidAt) : undefined,
            createdAt: new Date(),
            updatedAt: new Date(),
            confirmPaymentWithoutDocument: newOrderPayment.confirmPaymentWithoutDocument || false,
            acceptedByUser: newOrderPayment.acceptedByUser || null,
            currency: newOrderPayment.currency || currency,
          },
        ] as StoreOrderPayment[];
        setOrderPayments(updatedPayments);
      } catch (error) {
        console.error('Failed to create OrderPayment:', error);
        // Revert the state change on error
        setPaid(!checked);
      }
    } else {
      try {
        await editOrderPaymentMutation.mutateAsync({
          id: existingPayment.id,
          confirmPaymentWithoutDocument: checked,
        });

        // Update store
        const updatedPayments = orderPayments.map((payment, index) =>
          index === 0 ? { ...payment, confirmPaymentWithoutDocument: checked } : payment
        );
        setOrderPayments(updatedPayments);
      } catch (error) {
        console.error('Failed to update payment confirmation:', error);
        // Revert the state change on error
        setPaid(!checked);
      }
    }
  };

  const selectedCurrency = useMemo(() => {
    if (selectedCurrencyId) {
      return currencyData?.currencies?.find(curr => curr.id === selectedCurrencyId);
    }
    return vndCurrency; // Fallback to VND
  }, [currencyData?.currencies, selectedCurrencyId, vndCurrency]);

  const total = orderItems.reduce((sum: number, item: OrderItem) => {
    return sum + item.finalPrice;
  }, 0);

  const hasVisarunPassengers = visarunPassengers.length > 0;

  // Set partial payment as default for visarun passengers (only if user hasn't made a selection)
  useEffect(() => {
    if (hasVisarunPassengers && !hasUserMadeSelection) {
      setIsPartialPayment(true);
    }
  }, [hasVisarunPassengers, hasUserMadeSelection]);

  // Initialize payment amounts when component mounts or when orderPayments change
  useEffect(() => {
    if (isPartialPayment) {
      // Initialize from existing payments or default values
      const amounts = [
        orderPayments[0] ? Number(orderPayments[0].amount) : 0,
        orderPayments[1] ? Number(orderPayments[1].amount) : 0,
      ];
      setPaymentAmounts(amounts);

      // Initialize partial payment states from existing payments
      setPartialPaymentMethods([
        orderPayments[0]?.paymentMethod || 'transfer',
        orderPayments[1]?.paymentMethod || 'transfer',
      ]);
      setPartialPaymentAcceptorIds([
        orderPayments[0]?.acceptedById || '',
        orderPayments[1]?.acceptedById || '',
      ]);
      setPartialPaymentPaid([
        orderPayments[0]?.confirmPaymentWithoutDocument || false,
        orderPayments[1]?.confirmPaymentWithoutDocument || false,
      ]);
    } else if (!isPartialPayment && paymentAmounts.length === 0) {
      setPaymentAmounts([total, 0]);
    }
  }, [orderPayments, isPartialPayment, total, paymentAmounts.length]);

  const formattedAmount = useMemo(() => {
    const currency = selectedCurrency || vndCurrency;
    if (!currency) return total.toString();
    return formatCurrency(total, currency.name);
  }, [total, selectedCurrency, vndCurrency]);

  // file upload
  const uploadPaymentDocumentMutation = useUploadPaymentDocument();

  const getExistingDocForPayment = (paymentIndex: number) => {
    const payment = orderPayments[paymentIndex];
    return payment?.documentUrl
      ? createDocumentFromFileUrl(payment.id, payment.documentUrl, 'payment-documents')
      : null;
  };

  const hasDocument = orderPayments.some(payment => !!payment?.documentUrl);

  const handleReplaceFileSelect = async (file: File, paymentIndex: number = 0) => {
    const existingPayment = orderPayments[paymentIndex];
    if (!existingPayment) return;

    // Validate file
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error('File size must be less than 10MB');
      return;
    }

    const acceptedTypes = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.heic'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!acceptedTypes.includes(fileExtension)) {
      toast.error('File type not supported. Accepted types: PDF, DOC, DOCX, JPG, PNG, HEIC');
      return;
    }

    if (!orderPayments[0]) return;

    setIsUploading(true);
    try {
      // Upload new file using shared hook with server-side filename generation
      const result = await uploadPaymentDocumentMutation.mutateAsync({
        file,
        orderId: order.id,
      });

      const fileUrl = result.filePath;

      // Update payment with new document URL
      await editOrderPaymentMutation.mutateAsync({
        id: existingPayment.id,
        documentUrl: fileUrl,
      });

      // Update store
      const updatedPayments = orderPayments.map((payment, index) =>
        index === paymentIndex ? { ...payment, documentUrl: fileUrl } : payment
      );
      setOrderPayments(updatedPayments);
      toast.success('Document replaced successfully');
    } catch (error) {
      toast.error('Failed to replace document. Please try again.');
      console.error('Failed to replace document:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDocument = async (_documentId: string, paymentIndex: number = 0) => {
    const existingPayment = orderPayments[paymentIndex];
    if (!existingPayment) return;

    try {
      // Remove document filename from existing payment
      await editOrderPaymentMutation.mutateAsync({
        id: existingPayment.id,
        documentUrl: '',
      });

      // Update store
      const updatedPayments = orderPayments.map((payment, index) =>
        index === paymentIndex ? { ...payment, documentUrl: null } : payment
      );
      setOrderPayments(updatedPayments);
    } catch (error) {
      console.error('Failed to delete document:', error);
    }
  };

  const handleUploadSuccess = async (response: { fileUrl?: string }) => {
    if (!response.fileUrl) {
      console.error('No fileUrl in upload response');
      return;
    }

    // Use the full URL instead of just filename
    const fileUrl = response.fileUrl;

    try {
      const paymentIndex = currentUploadPaymentIndex !== null ? currentUploadPaymentIndex : 0;
      const existingPayment = orderPayments[paymentIndex];

      if (existingPayment) {
        // Update existing OrderPayment with full URL
        await editOrderPaymentMutation.mutateAsync({
          id: existingPayment.id,
          documentUrl: fileUrl,
        });

        // Update store
        const updatedPayments = orderPayments.map((payment, index) =>
          index === paymentIndex ? { ...payment, documentUrl: fileUrl } : payment
        );
        setOrderPayments(updatedPayments);
      } else if (!isPartialPayment) {
        // Create new OrderPayment with default values for full payment mode
        const currency = selectedCurrency || vndCurrency;
        if (!currency) {
          console.error('No currency selected for payment creation');
          return;
        }

        const newPayment = await createOrderPaymentMutation.mutateAsync({
          orderId: order.id,
          amount: total,
          amountInSelectedCurrency: total,
          currencyId: currency.id,
          paidAt: new Date().toISOString(),
          paymentMethod: 'transfer',
          documentUrl: fileUrl,
        });

        // Add new payment to store
        const newOrderPayment = newPayment.orderPayment;
        const updatedPayments = [
          ...orderPayments,
          {
            id: newOrderPayment.id,
            orderId: newOrderPayment.orderId,
            currencyId: newOrderPayment.currencyId,
            amount: newOrderPayment.amount,
            amountInSelectedCurrency: newOrderPayment.amount,
            paymentMethod: newOrderPayment.paymentMethod as PaymentMethod,
            documentUrl: newOrderPayment.documentUrl,
            acceptedById: newOrderPayment.acceptedById,
            acceptedAt: null,
            paidAt: newOrderPayment.paidAt ? new Date(newOrderPayment.paidAt) : undefined,
            createdAt: new Date(),
            updatedAt: new Date(),
            confirmPaymentWithoutDocument: newOrderPayment.confirmPaymentWithoutDocument || false,
            acceptedByUser: newOrderPayment.acceptedByUser || null,
            currency: newOrderPayment.currency || currency,
          },
        ] as StoreOrderPayment[];
        setOrderPayments(updatedPayments);
      }
    } catch (error) {
      console.error('Failed to create/update OrderPayment:', error);
    } finally {
      setCurrentUploadPaymentIndex(null);
    }
  };

  const handlePaymentModeChange = (isPartial: boolean) => {
    setIsPartialPayment(isPartial);
    setHasUserMadeSelection(true); // Mark that user has made a manual selection
    if (isPartial) {
      // Initialize with existing payments or half amounts
      if (orderPayments.length >= 2) {
        const amounts = [
          Number(orderPayments[0]?.amount || 0),
          Number(orderPayments[1]?.amount || 0),
        ];
        setPaymentAmounts(amounts);
      } else {
        const halfAmount = Math.floor(total / 2);
        setPaymentAmounts([halfAmount, total - halfAmount]);
      }
    } else {
      // For full payment mode, reset to full amount
      setPaymentAmounts([total, 0]);
    }
  };

  const handlePartialPaymentMethodChange = async (paymentIndex: number) => {
    const currentMethod = partialPaymentMethods[paymentIndex];
    const newMethod: PaymentMethod = currentMethod === 'transfer' ? 'cash' : 'transfer';

    const newMethods = [...partialPaymentMethods];
    newMethods[paymentIndex] = newMethod;
    setPartialPaymentMethods(newMethods);

    const existingPayment = orderPayments[paymentIndex];
    if (existingPayment) {
      try {
        await editOrderPaymentMutation.mutateAsync({
          id: existingPayment.id,
          paymentMethod: newMethod,
        });

        const updatedPayments = orderPayments.map((payment, i) =>
          i === paymentIndex ? { ...payment, paymentMethod: newMethod } : payment
        );
        setOrderPayments(updatedPayments);
      } catch (error) {
        console.error('Failed to update partial payment method:', error);
        // Revert on error
        newMethods[paymentIndex] = currentMethod;
        setPartialPaymentMethods(newMethods);
      }
    }
  };

  const handlePartialPaymentAcceptorChange = async (paymentIndex: number, value: string) => {
    const newAcceptorIds = [...partialPaymentAcceptorIds];
    newAcceptorIds[paymentIndex] = value;
    setPartialPaymentAcceptorIds(newAcceptorIds);

    const existingPayment = orderPayments[paymentIndex];
    if (existingPayment) {
      try {
        await editOrderPaymentMutation.mutateAsync({
          id: existingPayment.id,
          acceptedById: value || undefined,
        });

        const updatedPayments = orderPayments.map((payment, i) =>
          i === paymentIndex ? { ...payment, acceptedById: value } : payment
        );
        setOrderPayments(updatedPayments);
      } catch (error) {
        console.error('Failed to update partial payment acceptor:', error);
        // Revert on error
        newAcceptorIds[paymentIndex] = existingPayment.acceptedById || '';
        setPartialPaymentAcceptorIds(newAcceptorIds);
      }
    }
  };

  const handlePartialPaymentPaidChange = async (paymentIndex: number, checked: boolean) => {
    const newPaidStates = [...partialPaymentPaid];
    newPaidStates[paymentIndex] = checked;
    setPartialPaymentPaid(newPaidStates);

    const existingPayment = orderPayments[paymentIndex];
    if (existingPayment) {
      try {
        await editOrderPaymentMutation.mutateAsync({
          id: existingPayment.id,
          confirmPaymentWithoutDocument: checked,
        });

        const updatedPayments = orderPayments.map((payment, i) =>
          i === paymentIndex ? { ...payment, confirmPaymentWithoutDocument: checked } : payment
        );
        setOrderPayments(updatedPayments);
      } catch (error) {
        console.error('Failed to update partial payment paid status:', error);
        // Revert on error
        newPaidStates[paymentIndex] = !checked;
        setPartialPaymentPaid(newPaidStates);
      }
    }
  };

  const handlePaymentAmountChange = (index: number, value: string) => {
    const numericValue = value === '' ? 0 : parseFloat(value) || 0;
    const newAmounts = [...paymentAmounts];
    newAmounts[index] = numericValue;
    setPaymentAmounts(newAmounts);
  };

  const handlePaymentAmountUpdate = async (index: number, value: number) => {
    if (!isPartialPayment) return;

    setSaveStatus('saving');

    try {
      const currency = selectedCurrency || vndCurrency;
      if (!currency) {
        console.error('No currency selected for payment creation');
        setSaveStatus('error');
        return;
      }

      const existingPayment = orderPayments[index];

      if (existingPayment) {
        // Update existing payment
        await editOrderPaymentMutation.mutateAsync({
          id: existingPayment.id,
          amount: value,
        });

        // Update store
        const updatedPayments = [...orderPayments];
        updatedPayments[index] = {
          ...updatedPayments[index],
          amount: value.toString(),
        };
        setOrderPayments(updatedPayments);
      } else {
        // Create new payment for any value, including 0
        const newPayment = await createOrderPaymentMutation.mutateAsync({
          orderId: order.id,
          amount: value,
          amountInSelectedCurrency: value,
          currencyId: currency.id,
          paidAt: new Date().toISOString(),
          paymentMethod: partialPaymentMethods[index],
          acceptedById: partialPaymentAcceptorIds[index] || undefined,
          confirmPaymentWithoutDocument: partialPaymentPaid[index],
        });

        const newOrderPayment = newPayment.orderPayment;
        const newStorePayment: StoreOrderPayment = {
          id: newOrderPayment.id,
          orderId: newOrderPayment.orderId,
          currencyId: newOrderPayment.currencyId,
          amount: newOrderPayment.amount,
          amountInSelectedCurrency: newOrderPayment.amount,
          paymentMethod: newOrderPayment.paymentMethod as PaymentMethod,
          documentUrl: newOrderPayment.documentUrl,
          acceptedById: newOrderPayment.acceptedById,
          acceptedAt: null,
          paidAt: newOrderPayment.paidAt ? new Date(newOrderPayment.paidAt) : undefined,
          createdAt: new Date(),
          updatedAt: new Date(),
          confirmPaymentWithoutDocument: newOrderPayment.confirmPaymentWithoutDocument || false,
          acceptedByUser: newOrderPayment.acceptedByUser || null,
          currency: newOrderPayment.currency || currency,
        };

        // Update the payments array maintaining order
        const updatedPayments = [...orderPayments];
        updatedPayments[index] = newStorePayment;
        setOrderPayments(updatedPayments);
      }

      setSaveStatus('saved');
    } catch (error) {
      console.error('Failed to save partial payment:', error);
      setSaveStatus('error');

      // Revert the local state on error
      const revertedAmounts = [...paymentAmounts];
      const existingPayment = orderPayments[index];
      revertedAmounts[index] = existingPayment ? Number(existingPayment.amount) : 0;
      setPaymentAmounts(revertedAmounts);
    }
  };

  const handlePaymentAmountBlur = (index: number) => {
    const currentValue = paymentAmounts[index] || 0;
    const existingPayment = orderPayments[index];
    const existingValue = existingPayment ? Number(existingPayment.amount) : 0;

    if (currentValue !== existingValue) {
      handlePaymentAmountUpdate(index, currentValue);
    }
  };

  return (
    <>
      <div className="flex flex-wrap gap-3">
        <Button
          variant={!isPartialPayment ? 'accent' : 'secondary'}
          onClick={() => handlePaymentModeChange(false)}
        >
          Full payment
        </Button>
        <Button
          variant={isPartialPayment ? 'accent' : 'secondary'}
          disabled={!hasVisarunPassengers}
          onClick={() => handlePaymentModeChange(true)}
        >
          Partial payment
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        <Label>Payment Order</Label>
        {isPartialPayment ? (
          // Partial Payment Mode - Show 2 payment sections
          <div className="flex flex-wrap justify-between gap-4">
            {[0, 1].map(paymentIndex => {
              const existingPayment = orderPayments[paymentIndex] || null;
              return (
                <div key={paymentIndex} className="space-y-3">
                  <Label className="text-sm font-medium">
                    {paymentIndex === 0 ? 'Pre-payment' : 'Post-payment'}
                  </Label>
                  <div className="flex flex-wrap gap-3 md:gap-2">
                    <Select
                      value={selectedCurrencyId || vndCurrency?.id || ''}
                      onValueChange={handleCurrencyChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Currency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {currencyData?.currencies
                            ?.filter(c => c.name === 'VND')
                            .map(currency => (
                              <SelectItem key={currency.id} value={currency.id}>
                                {currency.name}
                              </SelectItem>
                            ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <Input
                      className="w-auto"
                      type="number"
                      value={
                        paymentAmounts[paymentIndex] === 0 ? '' : paymentAmounts[paymentIndex] || ''
                      }
                      onChange={e => handlePaymentAmountChange(paymentIndex, e.target.value)}
                      onBlur={() => handlePaymentAmountBlur(paymentIndex)}
                      placeholder="Payment amount"
                    />
                    <div className="flex gap-2 items-center">
                      <Switch
                        checked={partialPaymentMethods[paymentIndex] === 'cash'}
                        onCheckedChange={() => handlePartialPaymentMethodChange(paymentIndex)}
                      />
                      <Label>Cash</Label>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3 items-center">
                    <div className="flex gap-2 items-center">
                      <Select
                        value={
                          (existingPayment && existingPayment.acceptedById) ||
                          partialPaymentAcceptorIds[paymentIndex]
                        }
                        onValueChange={value =>
                          handlePartialPaymentAcceptorChange(paymentIndex, value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Payment accepted by" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {usersData?.users?.map(user => (
                              <SelectItem key={user.id} value={user.id}>
                                {`${user.firstName} ${user.middleName || ''} ${user.lastName}`
                                  .replace(/\s+/g, ' ')
                                  .trim()}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      {/* Only show Paid switch if there's a document OR user has permission to confirm without document */}
                      {(hasDocument || usersData?.users?.length) && (
                        <>
                          <Switch
                            checked={
                              (existingPayment && existingPayment.confirmPaymentWithoutDocument) ||
                              partialPaymentPaid[paymentIndex]
                            }
                            onCheckedChange={checked =>
                              handlePartialPaymentPaidChange(paymentIndex, checked)
                            }
                          />
                          <Label>Paid</Label>
                        </>
                      )}
                    </div>
                  </div>
                  <div>
                    <FileUpload
                      onChange={filePath => {
                        if (filePath) {
                          setCurrentUploadPaymentIndex(paymentIndex);
                          const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
                          const response = {
                            fileUrl: filePath.startsWith('http')
                              ? filePath
                              : `${baseUrl}${filePath}`,
                          };
                          void handleUploadSuccess(response);
                        }
                      }}
                      value={getExistingDocForPayment(paymentIndex) || ''}
                      handleReplaceFileSelect={(file: File) =>
                        handleReplaceFileSelect(file, paymentIndex)
                      }
                      handleDeleteDocument={docId => handleDeleteDocument(docId, paymentIndex)}
                      uploadEndpoint="/upload/payment-document"
                      fileFieldName="document"
                      placeholder="Drag or click to browse payment receipt"
                      disabled={isUploading}
                    />
                    {isUploading && (
                      <div className="flex items-center justify-center gap-2 text-sm mt-2">
                        <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"></div>
                        <span>Uploading document...</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // Full Payment Mode - Show single payment section
          <div className="space-y-3">
            <div className="flex flex-wrap gap-3 md:gap-2">
              <Select
                value={selectedCurrencyId || vndCurrency?.id || ''}
                onValueChange={handleCurrencyChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {currencyData?.currencies
                      ?.filter(c => c.name === 'VND')
                      .map(currency => (
                        <SelectItem key={currency.id} value={currency.id}>
                          {currency.name}
                        </SelectItem>
                      ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <Input disabled className="w-auto" value={formattedAmount} />
              <div className="flex gap-2 items-center">
                <Switch
                  checked={paymentMethod === 'cash'}
                  onCheckedChange={handlePaymentMethodChange}
                />
                <Label>Cash</Label>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex gap-2 items-center">
                <Select
                  value={selectedPaymentAcceptorId}
                  onValueChange={handlePaymentAcceptorChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Payment accepted by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {usersData?.users?.map(user => (
                        <SelectItem key={user.id} value={user.id}>
                          {`${user.firstName} ${user.middleName || ''} ${user.lastName}`
                            .replace(/\s+/g, ' ')
                            .trim()}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                {/* Only show Paid switch if there's a document OR user has permission to confirm without document */}
                {(hasDocument || usersData?.users?.length) && (
                  <>
                    <Switch checked={paid} onCheckedChange={handlePaidChange} />
                    <Label>Paid</Label>
                  </>
                )}
              </div>
            </div>
            <div>
              <FileUpload
                onChange={filePath => {
                  if (filePath) {
                    setCurrentUploadPaymentIndex(0);
                    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
                    const response = {
                      fileUrl: filePath.startsWith('http') ? filePath : `${baseUrl}${filePath}`,
                    };
                    void handleUploadSuccess(response);
                  }
                }}
                value={getExistingDocForPayment(0) || ''}
                handleReplaceFileSelect={(file: File) => handleReplaceFileSelect(file, 0)}
                handleDeleteDocument={docId => handleDeleteDocument(docId, 0)}
                uploadEndpoint="/upload/payment-document"
                fileFieldName="document"
                placeholder="Drag or click to browse payment receipt"
                disabled={isUploading}
              />
              {isUploading && (
                <div className="flex items-center justify-center gap-2 text-sm mt-2">
                  <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"></div>
                  <span>Uploading document...</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <Separator />
      <div className="flex flex-wrap justify-between align-center">
        <Comments />
      </div>
    </>
  );
};
export default Payment;
