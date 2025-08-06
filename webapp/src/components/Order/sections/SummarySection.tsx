import React, { useState, memo, useMemo } from 'react';
import { ArrowRight, Check, Copy, Crown, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/utils/currency.js';
import { useOrderEditStore } from '@/stores';
import { trpc } from '@/lib/trpc';

interface SummarySectionProps {
  order: any;
  primaryClientData: any;
  countriesData: any;
  visaApplicationsData: any;
  firstName?: string;
  lastName?: string;
}

export const SummarySection: React.FC<SummarySectionProps> = memo(
  ({ order, primaryClientData, countriesData, visaApplicationsData, firstName, lastName }) => {
    const [isCopied, setIsCopied] = useState(false);

    // Access Zustand store directly
    const {
      optimisticOrder,
      optimisticPrimaryClientData,
      isSubmitting,
      isSaving,
      getVisaTypesForCountry,
    } = useOrderEditStore();

    const currentOrder = optimisticOrder || order;
    const allItems = currentOrder?.items || [];
    const visaItems = allItems.filter((item: any) => item.serviceType === 'visa');
    const clientCitizenshipId = primaryClientData?.client?.citizenshipId;

    // Get unique country IDs from visa items for blacklist checking
    const countryIds = [
      ...new Set(visaItems.map((item: any) => item.serviceTypeId).filter(Boolean)),
    ] as string[];

    // Load detailed data for countries that have visa items
    const countryQueries = countryIds.map(countryId =>
      trpc.country.getOne.useQuery(
        { id: countryId },
        { enabled: !!countryId && !!clientCitizenshipId }
      )
    );

    // Create blacklist status map
    const blacklistStatusMap = useMemo(() => {
      const map: Record<string, boolean> = {};
      countryIds.forEach((countryId, index) => {
        const countryData = countryQueries[index]?.data?.country;
        map[countryId] =
          countryData?.blacklisted?.some(
            (entry: any) => entry.citizenshipId === clientCitizenshipId
          ) || false;
      });
      return map;
    }, [countryQueries, clientCitizenshipId, countryIds]);

    // Create a blacklist check function
    const isCountryBlacklisted = (countryId: string) => {
      return blacklistStatusMap[countryId] || false;
    };

    const PrimaryClientBadge = ({ client }: { client: any }) => {
      // Use form state for optimistic updates, fallback to client data
      const displayFirstName = firstName || client.firstName;
      const displayLastName = lastName || client.lastName;

      return (
        <Badge variant="primary">
          <Crown />
          {(displayLastName || displayFirstName) && (
            <div className="flex items-center gap-2">
              {displayFirstName} {displayLastName}
            </div>
          )}
        </Badge>
      );
    };

    // Helper function to get the correct price for order items
    const calculateItemPrice = (item: any) => {
      // For visa items, check blacklist status
      if (item.serviceType === 'visa') {
        const isBlacklisted = isCountryBlacklisted(item.serviceTypeId);

        // If client is blacklisted, price should be 0
        if (isBlacklisted) {
          return 0;
        }
      }

      // Use finalPrice which includes surcharges calculated by backend
      return item.finalPrice || 0;
    };

    // Helper function to check if an item should be displayed as blacklisted
    const isItemBlacklisted = (item: any) => {
      if (item.serviceType !== 'visa') return false;
      return isCountryBlacklisted(item.serviceTypeId);
    };

    // Helper function to get service type display name
    const getServiceTypeName = (serviceType: string) => {
      switch (serviceType) {
        case 'visa':
          return 'Visa';
        case 'visarun':
          return 'Visarun';
        case 'transfer':
          return 'Transfer';
        default:
          return 'Service';
      }
    };

    const generateSummaryText = () => {
      const primaryClient = optimisticPrimaryClientData || primaryClientData?.client;
      const clientName = primaryClient
        ? `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim() || 'Client'
        : 'Client';
      const currentDate = new Date().toLocaleDateString('en-GB');

      let summary = `VISA SERVICE ORDER\n`;
      summary += `Date: ${currentDate}\n`;
      summary += `Client: ${clientName}\n`;

      if (visaItems.length > 0) {
        summary += `SERVICES:\n`;
        summary += `${'='.repeat(50)}\n`;

        allItems.forEach((item: any, index: number) => {
          const dynamicPrice = calculateItemPrice(item);
          const amount = formatCurrency(dynamicPrice, 'VND');
          const serviceTypeName = getServiceTypeName(item.serviceType);

          if (item.serviceType === 'visa') {
            const country = countriesData?.find((c: any) => c.id === item.serviceTypeId);
            const countryName = country?.name || 'Unknown Country';

            // Check if it's multi-entry from visa application data
            const visaApp = visaApplicationsData?.find(
              (app: any) => app.countryId === item.serviceTypeId
            );
            const isMulti = (visaApp as any)?.isMultientry || false;
            const multiType = isMulti ? ' (Multi-Entry)' : ' (Single-Entry)';

            // Use helper function to determine blacklist status
            const isBlacklisted = isItemBlacklisted(item);

            // Get visa type name and entry date
            const visaTypeName = visaApp?.visaType?.name;
            const entryDate = visaApp?.plannedCountryEntryDate
              ? new Date(visaApp.plannedCountryEntryDate).toLocaleDateString('en-GB')
              : 'Not specified';

            // Check for citizenship surcharge
            const clientCitizenshipId = primaryClientData?.client?.citizenshipId;
            let surchargeInfo = '';

            if (clientCitizenshipId && item.serviceTypeId) {
              // Check for surcharge based on base price vs final price difference
              const expectedPrice = Math.max(0, item.basePrice - (item.discountAmount || 0));
              const surchargeAmount = item.finalPrice - expectedPrice;

              if (surchargeAmount > 0) {
                const citizenshipName = primaryClientData?.client?.citizenship?.name || 'Unknown';
                surchargeInfo = `   Citizenship Surcharge: ${formatCurrency(surchargeAmount, 'VND')} (${citizenshipName})\n`;
              }
            }

            summary += `${index + 1}. ${serviceTypeName} Service - ${countryName}\n`;
            if (isBlacklisted) {
              summary += `   Status: BLACKLISTED - Entry Prohibited\n`;
              summary += `   Amount: ${amount}\n\n`;
            } else {
              summary += `   Type: ${visaTypeName}${multiType}\n`;
              summary += `   Entry Date: ${entryDate}\n`;
              if (surchargeInfo) {
                summary += surchargeInfo;
              }
              summary += `   Amount: ${amount}\n\n`;
            }
          } else {
            // For non-visa services
            summary += `${index + 1}. ${serviceTypeName} Service\n`;
            summary += `   Amount: ${amount}\n\n`;
          }
        });

        summary += `${'='.repeat(50)}\n`;
      } else {
        summary += `No services added yet\n\n`;
      }

      summary += `TOTAL AMOUNT: ${(() => {
        const total = allItems.reduce((sum: number, item: any) => {
          return sum + calculateItemPrice(item);
        }, 0);
        return formatCurrency(total, 'VND');
      })()}\n`;
      summary += `\nThank you for choosing our visa services.`;
      return summary;
    };

    const copyToClipboard = async () => {
      try {
        await navigator.clipboard.writeText(generateSummaryText());
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy to clipboard:', err);
      }
    };

    return (
      <div className="grid space-y-4 sticky top-[69px] self-start lg:col-span-3">
        <span className="text-sm font-semibold">Summary</span>

        <Card className="p-3 bg-secondary">
          <CardContent className="space-y-4 p-0">
            <PrimaryClientBadge client={order.user} />
            {allItems.filter((item: any) => !isItemBlacklisted(item)).length > 0 ? (
              <div className="space-y-2 text-sm">
                {allItems.map((item: any, index: number) => {
                  const dynamicPrice = calculateItemPrice(item);
                  const amount = formatCurrency(dynamicPrice, 'VND');
                  const serviceTypeName = getServiceTypeName(item.serviceType);

                  if (item.serviceType === 'visa') {
                    const country = countriesData?.find((c: any) => c.id === item.serviceTypeId);
                    const countryName = country?.name || 'Unknown Country';

                    // Check if it's multi-entry from visa application data
                    const visaApp = visaApplicationsData?.find(
                      (app: any) => app.countryId === item.serviceTypeId
                    );
                    const isMulti = (visaApp as any)?.isMultientry || false;

                    // Get visa type name from Zustand store
                    let visaTypeName = '';
                    if (visaApp?.visaTypeId) {
                      const visaTypes = getVisaTypesForCountry(item.serviceTypeId);
                      const visaType = visaTypes.find((vt: any) => vt.id === visaApp.visaTypeId);
                      visaTypeName = visaType?.name ? `- ${visaType.name}` : '';
                    }

                    return (
                      <>
                        <div key={item.id || index} className="flex justify-between items-center">
                          <span className="text-muted-foreground flex items-center gap-1">
                            {serviceTypeName} - {countryName} {visaTypeName}{' '}
                            {isMulti ? '- Multi' : ''}
                          </span>
                          <span className="font-medium">{amount}</span>
                        </div>
                      </>
                    );
                  } else {
                    // For non-visa services
                    return (
                      <div key={item.id || index} className="flex justify-between items-center">
                        <span className="text-muted-foreground flex items-center gap-1">
                          {serviceTypeName}
                        </span>
                        <span className="font-medium">{amount}</span>
                      </div>
                    );
                  }
                })}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground text-center py-4">
                No services added yet
              </div>
            )}

            <hr />

            <div className="text-sm">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Total:</span>
                <span className="font-bold text-lg">
                  {(() => {
                    // Calculate total using dynamic prices
                    const total = allItems.reduce((sum: number, item: any) => {
                      return sum + calculateItemPrice(item);
                    }, 0);
                    return formatCurrency(total, 'VND');
                  })()}
                </span>
              </div>
            </div>

            <Button
              variant="secondary"
              size="sm"
              className={`w-full transition-all duration-300 ${
                isCopied ? 'bg-green-500/10' : 'hover:bg-muted/50'
              }`}
              onClick={copyToClipboard}
            >
              {isCopied ? (
                <Check className="w-4 h-4 animate-pulse" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              {isCopied ? 'Copied!' : 'Copy'}
            </Button>
          </CardContent>
        </Card>

        <Button
          variant="secondary"
          disabled={true}
          className="flex border-none items-center justify-between text-sm"
        >
          <span>Next step</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
        <Button
          type="submit"
          className="flex border-none items-center justify-between text-sm"
          disabled={isSubmitting || isSaving}
        >
          Save & close
          <Minimize2 />
        </Button>
      </div>
    );
  }
);

SummarySection.displayName = 'SummarySection';
