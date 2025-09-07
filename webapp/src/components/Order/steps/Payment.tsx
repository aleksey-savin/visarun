import { useState, useMemo, useEffect, useRef } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';

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
import { Eye, Replace, Trash2, File } from 'lucide-react';
import { FileUpload } from '@/components/ui/file-upload';
import { toast } from 'sonner';
import Comments from '../Comments';

const Payment = () => {
  const { order, orderItems, orderPayments = [], setOrderPayments } = useOrderStore();

  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewingDocument, setViewingDocument] = useState<{
    id: string;
    originalName: string;
    fileUrl: string;
  } | null>(null);
  const replaceInputRef = useRef<HTMLInputElement | null>(null);

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

  const formattedAmount = useMemo(() => {
    const currency = selectedCurrency || vndCurrency;
    if (!currency) return total.toString();
    return formatCurrency(total, currency.name);
  }, [total, selectedCurrency, vndCurrency]);

  // file upload
  const existingDoc = orderPayments[0]?.documentUrl
    ? {
        id: orderPayments[0].id,
        originalName: orderPayments[0].documentUrl,
        fileUrl: `${import.meta.env.VITE_API_URL}/upload/payment-documents/${orderPayments[0].documentUrl}`,
      }
    : null;
  const hasDocument = !!existingDoc;

  const isImageFile = (fileName: string) => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
    return imageExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
  };

  const handleViewDocument = (document: { id: string; originalName: string; fileUrl: string }) => {
    setViewingDocument(document);
    setViewModalOpen(true);
  };

  const handleReplaceClick = () => {
    if (replaceInputRef.current) {
      replaceInputRef.current.click();
    }
  };

  const handleReplaceFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    const existingPayment = orderPayments[0];
    if (!existingPayment) return;

    // Validate file
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error('File size must be less than 10MB');
      return;
    }

    const acceptedTypes = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!acceptedTypes.includes(fileExtension)) {
      toast.error('File type not supported. Accepted types: PDF, DOC, DOCX, JPG, PNG');
      return;
    }

    try {
      // Upload new file
      const formData = new FormData();
      formData.append('document', file);

      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${baseUrl}/upload/payment-document`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        // Extract just the filename from the response
        const fileUrl = result.filePath || result.fileUrl;
        const filename = fileUrl.split('/').pop() || fileUrl;

        // Update payment with new document filename
        await editOrderPaymentMutation.mutateAsync({
          id: existingPayment.id,
          documentUrl: filename,
        });

        // Update store
        const updatedPayments = orderPayments.map((payment, index) =>
          index === 0 ? { ...payment, documentUrl: filename } : payment
        );
        setOrderPayments(updatedPayments);
        toast.success('Document replaced successfully');
      } else {
        toast.error(result.error || 'Upload failed');
      }
    } catch (error) {
      toast.error('Failed to replace document. Please try again.');
      console.error('Failed to replace document:', error);
    }
  };

  const handleDeleteDocument = async () => {
    const existingPayment = orderPayments[0];
    if (!existingPayment) return;

    try {
      // Remove document filename from existing payment
      await editOrderPaymentMutation.mutateAsync({
        id: existingPayment.id,
        documentUrl: '',
      });

      // Update store
      const updatedPayments = orderPayments.map((payment, index) =>
        index === 0 ? { ...payment, documentUrl: null } : payment
      );
      setOrderPayments(updatedPayments);
    } catch (error) {
      console.error('Failed to delete document:', error);
    }
  };

  const handleUploadSuccess = async (response: { fileUrl?: string }) => {
    console.log('Upload success:', response);

    if (!response.fileUrl) {
      console.error('No fileUrl in upload response');
      return;
    }

    // Extract filename from the full path/URL
    const filename = response.fileUrl.split('/').pop() || response.fileUrl;

    try {
      const existingPayment = orderPayments[0];

      if (existingPayment) {
        // Update existing OrderPayment with just filename
        await editOrderPaymentMutation.mutateAsync({
          id: existingPayment.id,
          documentUrl: filename,
        });

        // Update store with updated payment
        const updatedPayments = orderPayments.map((payment, index) =>
          index === 0 ? { ...payment, documentUrl: filename || null } : payment
        );
        setOrderPayments(updatedPayments);
      } else {
        // Create new OrderPayment with default values
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
          documentUrl: filename,
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
      }
    } catch (error) {
      console.error('Failed to create/update OrderPayment:', error);
    }
  };

  return (
    <>
      <div className="flex flex-wrap gap-3">
        <Button variant="accent">Full payment</Button>
        <Button variant="secondary" disabled>
          Partial payment
        </Button>
      </div>
      <div className="flex flex-col gap-3">
        <Label>Payment Order</Label>
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
          {hasDocument ? (
            <Card className="bg-secondary p-3 rounded-md">
              {/* Show existing document */}
              <div className="flex items-center justify-between gap-2">
                {existingDoc && isImageFile(existingDoc.originalName) ? (
                  <div className="flex items-center justify-center border-dashed rounded-md">
                    <img
                      src={existingDoc.fileUrl}
                      alt={existingDoc.originalName}
                      className="max-w-full max-h-8 object-contain rounded"
                      onError={() => {
                        console.error('Image failed to load:', existingDoc.fileUrl);
                        console.error('Full URL:', existingDoc.fileUrl);
                      }}
                    />
                  </div>
                ) : (
                  <File className="w-6 h-6" />
                )}
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => existingDoc && handleViewDocument(existingDoc)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>

                  <Button variant="secondary" size="sm" onClick={handleReplaceClick}>
                    <Replace className="w-4 h-4" />
                  </Button>
                  <Button variant="secondary" size="sm" onClick={handleDeleteDocument}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              {/* Hidden file input for replace functionality */}
              <input
                ref={replaceInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={e => handleReplaceFileSelect(e.target.files)}
                className="hidden"
              />
            </Card>
          ) : (
            /* Upload new document */
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
              uploadEndpoint="/upload/payment-document"
              fileFieldName="document"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              maxSize={10 * 1024 * 1024} // 10MB
              placeholder="Drag or click to browse payment receipt"
              className="bg-secondary"
            />
          )}
        </div>
      </div>
      <Separator />
      <div className="flex flex-wrap justify-between align-center">
        <Comments />
      </div>
      {/* View Document Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="overflow-auto">
          <div className="flex items-center justify-center p-4">
            {viewingDocument && (
              <>
                {isImageFile(viewingDocument.originalName) ? (
                  <img
                    src={viewingDocument.fileUrl}
                    alt={viewingDocument.originalName}
                    className="max-w-full max-h-[70vh] object-contain rounded"
                    onError={() => {
                      console.error('Modal image failed to load:', viewingDocument.fileUrl);
                    }}
                  />
                ) : (
                  <div className="w-full h-[70vh]">
                    <iframe
                      src={viewingDocument.fileUrl}
                      className="w-full h-full border rounded"
                      title={viewingDocument.originalName}
                      onError={() => {
                        console.error('Failed to load:', viewingDocument.fileUrl);
                        console.error('Full URL:', viewingDocument.fileUrl);
                      }}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
export default Payment;
