import { useState, useMemo, useEffect } from 'react';
import { trpc } from '@/lib/trpc';

import useOrderStore, { StoreOrderPayment } from '@/stores/order/order-store';

import { createDocumentFromFileUrl } from '@/utils/fileUtils';

import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectTrigger,
  SelectValue,
  SelectItem,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { FileUpload } from '@/components/ui/file-upload';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

import { OrderItem, PaymentMethod } from '@visarun/backend/node_modules/@prisma/client';

import { formatCurrency } from '@/utils/currency';
import { useUploadPaymentDocument } from '@/hooks/useDocumentUpload';

const PaymentCard = ({ payment }: { payment: StoreOrderPayment }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const [selectedCurrencyId, setSelectedCurrencyId] = useState<string>(payment.currencyId || '');

  const [selectedPaymentAcceptorId, setSelectedPaymentAcceptorId] = useState<string>(
    payment.acceptedById || ''
  );

  const [paid, setPaid] = useState<boolean>(payment.confirmPaymentWithoutDocument || false);

  const [amountValue, setAmountValue] = useState<string>(
    payment.amount ? payment.amount.toString() : ''
  );

  // Sync amountValue with payment.amount changes
  useEffect(() => {
    setAmountValue(payment.amount ? payment.amount.toString() : '');
  }, [payment.amount]);

  const {
    order,
    orderPayments = [],
    setOrderPayments,
    setSaveStatus,
    orderItems,
  } = useOrderStore();

  const isFullPayment =
    orderItems.reduce((sum, item) => sum + item.finalPrice, 0) <= parseFloat(payment.amount || '0');

  const editOrderPaymentMutation = trpc.orderPayment.edit.useMutation();
  const deleteOrderPaymentMutation = trpc.orderPayment.delete.useMutation();

  const { data: currencyData } = trpc.currency.getAll.useQuery({
    search: '',
  });

  const { data: usersData } = trpc.user.getAll.useQuery({
    search: '',
    canAcceptPayments: true,
  });

  const uploadPaymentDocumentMutation = useUploadPaymentDocument();

  const vndCurrency = useMemo(() => {
    return currencyData?.currencies?.find(curr => curr.name === 'VND');
  }, [currencyData?.currencies]);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    payment.paymentMethod || 'transfer'
  );

  const total = orderItems.reduce((sum: number, item: OrderItem) => {
    return sum + item.finalPrice;
  }, 0);

  const selectedCurrency = useMemo(() => {
    if (selectedCurrencyId) {
      return currencyData?.currencies?.find(curr => curr.id === selectedCurrencyId);
    }
    return vndCurrency; // Fallback to VND
  }, [currencyData?.currencies, selectedCurrencyId, vndCurrency]);

  const formattedAmount = useMemo(() => {
    const currency = selectedCurrency || vndCurrency;
    if (!currency) return total.toString();
    return formatCurrency(total, currency.name);
  }, [total, selectedCurrency, vndCurrency]);

  const handleCurrencyChange = async (value: string) => {
    setSelectedCurrencyId(value);

    setSaveStatus('saving');

    try {
      await editOrderPaymentMutation.mutateAsync({
        id: payment.id,
        currencyId: value,
      });

      // Update store
      const updatedPayments = orderPayments.map((payment, index) =>
        index === 0 ? { ...payment, currencyId: value } : payment
      );
      setOrderPayments(updatedPayments);

      setSaveStatus('saved');
    } catch (error) {
      console.error('Failed to update currency:', error);
      // Revert the state change on error
      setSelectedCurrencyId(selectedCurrencyId);
    }
  };

  const handleAmountChange = (value: string) => {
    // Allow only numbers and decimal point
    const numericValue = value.replace(/[^0-9.]/g, '');
    setAmountValue(numericValue);
  };

  const handleAmountBlur = async () => {
    const numericAmount = parseFloat(amountValue);
    const currentAmount = parseFloat(payment.amount || '0');

    // Don't save if the value is invalid or unchanged
    if (isNaN(numericAmount) || numericAmount === currentAmount) {
      return;
    }

    setSaveStatus('saving');

    try {
      await editOrderPaymentMutation.mutateAsync({
        id: payment.id,
        amount: numericAmount,
      });

      // Update store
      const updatedPayments = orderPayments.map(item =>
        item.id === payment.id ? { ...item, amount: numericAmount.toString() } : item
      );
      setOrderPayments(updatedPayments);
      setSaveStatus('saved');
    } catch (error) {
      setSaveStatus('error');
      console.error('Failed to update payment amount:', error);
      // Revert the state change on error
      setAmountValue(payment.amount ? payment.amount.toString() : '');
    }
  };

  const handlePaymentMethodChange = async () => {
    const newPaymentMethod: PaymentMethod = paymentMethod === 'transfer' ? 'cash' : 'transfer';
    setPaymentMethod(newPaymentMethod);

    // Create new OrderPayment if none exists, otherwise update existing
    const existingPayment = orderPayments[0];

    setSaveStatus('saving');

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

      setSaveStatus('saved');
    } catch (error) {
      setSaveStatus('error');
      console.error('Failed to update payment method:', error);
      // Revert the state change on error
      setPaymentMethod(paymentMethod);
    }
  };

  const handlePaymentAcceptorChange = async (value: string) => {
    setSelectedPaymentAcceptorId(value);

    setSaveStatus('saving');

    try {
      await editOrderPaymentMutation.mutateAsync({
        id: payment.id,
        acceptedById: value || undefined,
      });

      // Update store
      const updatedPayments = orderPayments.map(item =>
        item.id === payment.id ? { ...item, acceptedById: value } : item
      );
      setOrderPayments(updatedPayments);
      setSaveStatus('saved');
    } catch (error) {
      setSaveStatus('error');
      console.error('Failed to update payment acceptor:', error);
      // Revert the state change on error
      setSelectedPaymentAcceptorId(payment.acceptedById || '');
    }
  };

  const hasDocument = payment?.documentUrl;

  const handlePaidChange = async (checked: boolean) => {
    setPaid(checked);

    setSaveStatus('saving');

    try {
      await editOrderPaymentMutation.mutateAsync({
        id: payment.id,
        confirmPaymentWithoutDocument: checked,
      });

      // Update store
      const updatedPayments = orderPayments.map((payment, index) =>
        index === 0 ? { ...payment, confirmPaymentWithoutDocument: checked } : payment
      );
      setOrderPayments(updatedPayments);
      setSaveStatus('saved');
    } catch (error) {
      setSaveStatus('error');
      console.error('Failed to update payment confirmation:', error);
      // Revert the state change on error
      setPaid(!checked);
    }
  };

  const getDocumentUrl = () => {
    return payment?.documentUrl
      ? createDocumentFromFileUrl(payment.id, payment.documentUrl, 'payment-documents')
      : null;
  };

  const handleUploadSuccess = async (response: { fileUrl?: string }) => {
    if (!response.fileUrl) {
      console.error('No fileUrl in upload response');
      return;
    }

    const fileUrl = response.fileUrl;

    setSaveStatus('saving');

    try {
      await editOrderPaymentMutation.mutateAsync({
        id: payment.id,
        documentUrl: fileUrl,
      });

      const updatedPayments = orderPayments.map(item =>
        item.id === payment.id ? { ...item, documentUrl: fileUrl } : item
      );

      setOrderPayments(updatedPayments);
      setSaveStatus('saved');
    } catch (error) {
      setSaveStatus('error');
      console.error('Failed to create/update OrderPayment:', error);
    }
  };

  const handleReplaceFileSelect = async (file: File) => {
    // Validate file
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      console.error('File size must be less than 10MB');
      return;
    }

    const acceptedTypes = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.heic'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!acceptedTypes.includes(fileExtension)) {
      console.error('File type not supported. Accepted types: PDF, DOC, DOCX, JPG, PNG, HEIC');
      return;
    }

    if (!payment) return;

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
        id: payment.id,
        documentUrl: fileUrl,
      });

      // Update store
      const updatedPayments = orderPayments.map(item =>
        item.id === payment.id ? { ...item, documentUrl: fileUrl } : item
      );
      setOrderPayments(updatedPayments);
    } catch (error) {
      console.error('Failed to replace document:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDocument = async () => {
    if (!payment) return;

    try {
      // Remove document filename from existing payment
      await editOrderPaymentMutation.mutateAsync({
        id: payment.id,
        documentUrl: '',
      });

      // Update store
      const updatedPayments = orderPayments.map(item =>
        item.id === payment.id ? { ...item, documentUrl: null } : item
      );
      setOrderPayments(updatedPayments);
    } catch (error) {
      console.error('Failed to delete document:', error);
    }
  };

  const handleDeleteOrderPayment = async () => {
    if (!payment) return;

    setSaveStatus('saving');

    try {
      await deleteOrderPaymentMutation.mutateAsync({
        id: payment.id,
      });

      // Update store - remove the payment from the array
      const updatedPayments = orderPayments.filter(item => item.id !== payment.id);
      setOrderPayments(updatedPayments);

      setSaveStatus('saved');
      setShowDeleteDialog(false);
    } catch (error) {
      setSaveStatus('error');
      console.error('Failed to delete order payment:', error);
    }
  };

  return (
    <Card className="md:p-6 p-2 bg-secondary border-none shadow-none relative">
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 p-1 h-auto w-auto hover:bg-destructive hover:text-destructive-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Payment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this payment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteOrderPayment}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <div className="space-y-3 pr-8">
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
            disabled={isFullPayment}
            className="w-auto"
            value={isFullPayment ? formattedAmount : amountValue}
            onChange={e => handleAmountChange(e.target.value)}
            onBlur={handleAmountBlur}
            placeholder="Enter amount"
          />
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
            <Select value={selectedPaymentAcceptorId} onValueChange={handlePaymentAcceptorChange}>
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
                const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
                const response = {
                  fileUrl: filePath.startsWith('http') ? filePath : `${baseUrl}${filePath}`,
                };
                void handleUploadSuccess(response);
              }
            }}
            value={getDocumentUrl() || ''}
            handleReplaceFileSelect={(file: File) => handleReplaceFileSelect(file)}
            handleDeleteDocument={() => handleDeleteDocument()}
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
    </Card>
  );
};

export default PaymentCard;
