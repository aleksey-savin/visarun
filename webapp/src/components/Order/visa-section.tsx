import { useState } from 'react';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';

import { trpc } from '@/lib/trpc';

import { Badge } from '@/components/ui/badge';
import { Switch } from '../ui/switch';

const VisaSection = ({
  refetchOrder,
  orderData,
  primaryClientData,
  setErrorMessage,
}: {
  refetchOrder: () => void;
  orderData: any;
  primaryClientData: any;
  setErrorMessage: (message: string) => void;
}) => {
  const [addedCountryCards, setAddedCountryCards] = useState<Set<string>>(new Set());
  const [selectedVisaTypes, setSelectedVisaTypes] = useState<Record<string, string>>({});
  const [entryDates, setEntryDates] = useState<Record<string, Date | null>>({});
  const [entryTimes, setEntryTimes] = useState<Record<string, string>>({});

  // Fetch countries from database
  const { data: countriesData } = trpc.country.getAll.useQuery();

  // State for selected countries and their cards
  const [createdOrderItems, setCreatedOrderItems] = useState<Record<string, string>>({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [countryToDelete, setCountryToDelete] = useState<string | null>(null);

  // Order item mutations
  const createOrderItemMutation = trpc.orderItem.create.useMutation({
    onSuccess: () => {
      refetchOrder();
    },
  });
  const deleteOrderItemMutation = trpc.orderItem.delete.useMutation({
    onSuccess: () => {
      refetchOrder();
    },
  });

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

      // Create order item immediately when country is clicked
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
      });

      // Add to state
      setAddedCountryCards(prev => new Set([...prev, countryId]));
      setCreatedOrderItems(prev => ({ ...prev, [countryId]: orderItemResponse.orderItem.id }));

      // Initialize default values for new country
      setSelectedVisaTypes(prev => ({ ...prev, [countryId]: '' }));
      setEntryDates(prev => ({ ...prev, [countryId]: null }));
      setEntryTimes(prev => ({ ...prev, [countryId]: '00:00' }));
    } catch (error) {
      console.error('Failed to create order item:', error);
      setErrorMessage('Failed to add country. Please try again.');
    }
  };

  const handleVisaTypeSelect = (countryId: string, visaType: string) => {
    setSelectedVisaTypes(prev => ({ ...prev, [countryId]: visaType }));
  };

  const handleEntryDateSelect = (countryId: string, date: Date | null) => {
    setEntryDates(prev => ({ ...prev, [countryId]: date }));
  };

  const handleEntryTimeChange = (countryId: string, time: string) => {
    setEntryTimes(prev => ({ ...prev, [countryId]: time }));
  };

  const handleDeleteCountry = (countryId: string) => {
    setCountryToDelete(countryId);
    setShowDeleteModal(true);
  };

  const confirmDeleteCountry = async () => {
    if (!countryToDelete) return;

    try {
      const orderItemId = createdOrderItems[countryToDelete];
      if (orderItemId) {
        await deleteOrderItemMutation.mutateAsync({ id: orderItemId });
      }

      // Remove from state
      setAddedCountryCards(prev => {
        const updated = new Set(prev);
        updated.delete(countryToDelete);
        return updated;
      });
      setCreatedOrderItems(prev => {
        const updated = { ...prev };
        delete updated[countryToDelete];
        return updated;
      });
      setSelectedVisaTypes(prev => {
        const updated = { ...prev };
        delete updated[countryToDelete];
        return updated;
      });
      setEntryDates(prev => {
        const updated = { ...prev };
        delete updated[countryToDelete];
        return updated;
      });
      setEntryTimes(prev => {
        const updated = { ...prev };
        delete updated[countryToDelete];
        return updated;
      });
    } catch (error) {
      console.error('Failed to delete order item:', error);
      setErrorMessage('Failed to delete country. Please try again.');
    } finally {
      setShowDeleteModal(false);
      setCountryToDelete(null);
    }
  };

  // Visa Type Selector Component
  const VisaTypeSelector = ({
    countryId,
    selectedVisaType,
    onVisaTypeSelect,
  }: {
    countryId: string;
    selectedVisaType: string;
    onVisaTypeSelect: (countryId: string, visaType: string) => void;
  }) => {
    const { data: visaTypesData } = trpc.visaType.getByCountry.useQuery({ countryId });

    return (
      <div className="space-y-3">
        <Label className="text-sm font-medium">Visa type</Label>
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
                onClick={event => {
                  event.preventDefault();
                  event.stopPropagation();
                  onVisaTypeSelect(countryId, visaType.id);
                }}
                className="transition-all duration-200"
              >
                {visaType.name}
              </Button>
            ))}
        </div>
        <div className="flex justify-end items-center">
          <span className="font-semibold">
            {visaTypesData?.visaTypes?.find(vt => vt.id === selectedVisaType)?.serviceCost || 0} VND
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
              ?.sort((a, b) => {
                // Sort favorites first, then alphabetically
                if (a.favourite && !b.favourite) return -1;
                if (!a.favourite && b.favourite) return 1;
                return a.name.localeCompare(b.name);
              })
              ?.map(country => (
                <Button
                  key={country.id}
                  variant="secondary"
                  size="sm"
                  onClick={event => handleCountryClick(event, country.id)}
                  disabled={addedCountryCards.has(country.id) || createOrderItemMutation.isPending}
                >
                  + {country.name}
                </Button>
              ))}
          </div>
        </div>

        {/* Country Cards */}
        {Array.from(addedCountryCards).map(countryId => {
          const country = countriesData?.countries?.find(c => c.id === countryId);
          if (!country) return null;

          return (
            <Card key={countryId} className="p-3 bg-secondary">
              {/* Status Indicators */}
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap items-center gap-6 text-sm">
                  <Badge variant="accent">Visa - {country.name}</Badge>
                  <div className="flex items-center space-x-2">
                    <Switch name="client-in-country" />
                    <Label htmlFor="client-in-country">Client in {country.name}</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch name="recent-departure" />
                    <Label htmlFor="recent-departure">Recent departure &lt; 7d</Label>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={event => {
                    event.preventDefault();
                    event.stopPropagation();
                    handleDeleteCountry(countryId);
                  }}
                  className="h-8 w-8 p-0"
                >
                  ×
                </Button>
              </div>

              {/* Entry Date */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Entry date</Label>
                <div className="flex flex-wrap items-center gap-3">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="secondary"
                        className={cn(
                          'w-52 justify-between text-left font-normal',
                          !entryDates[countryId] && 'text-muted-foreground'
                        )}
                      >
                        {entryDates[countryId]
                          ? format(entryDates[countryId]!, 'dd.MM.yy')
                          : 'Select date*'}
                        <CalendarIcon className="mr-2 h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={entryDates[countryId] || undefined}
                        onSelect={date => handleEntryDateSelect(countryId, date || null)}
                        fromDate={new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                  <Input
                    placeholder="00:00"
                    className="w-20 text-center"
                    value={entryTimes[countryId] || '00:00'}
                    onChange={e => handleEntryTimeChange(countryId, e.target.value)}
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-md text-xs font-medium">
                      45 days allowed
                    </span>
                    <span className="bg-red-100 text-red-800 px-2 py-1 rounded-md text-xs font-medium">
                      25.08.25 Exit deadline
                    </span>
                  </div>
                </div>
              </div>

              {/* Visa Type */}
              <VisaTypeSelector
                countryId={countryId}
                selectedVisaType={selectedVisaTypes[countryId]}
                onVisaTypeSelect={handleVisaTypeSelect}
              />
            </Card>
          );
        })}
      </div>
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-sm mx-4">
            <h3 className="text-lg font-semibold mb-4">Delete Visa</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Are you sure you want to delete this visa? This action cannot be undone and will also
              remove the associated order item.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={event => {
                  event.preventDefault();
                  event.stopPropagation();
                  setShowDeleteModal(false);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                type="button"
                onClick={event => {
                  event.preventDefault();
                  event.stopPropagation();
                  confirmDeleteCountry();
                }}
                disabled={deleteOrderItemMutation.isPending}
              >
                {deleteOrderItemMutation.isPending ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VisaSection;
