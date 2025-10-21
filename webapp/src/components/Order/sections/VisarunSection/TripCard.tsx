import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Armchair, Trash2 } from 'lucide-react';

import { IconDisplay } from '@/components/ui/icon-display';
import { formatCurrency } from '@/utils/currency';
import RouteStopsBadges from '@/components/VisarunRoute/RouteStopsBadges';

interface TripCardProps {
  trip: any;
  seatClass: any;
  price: number;
  badgeContent?: string | number;
  buttonText: string;
  buttonVariant?: any;
  onButtonClick: () => void;
  isButtonDisabled?: boolean;
  buttonIcon?: React.ReactNode;
  showCancelButton?: boolean;
  onCancelClick?: () => void;
  bookedPassenger?: any;
}

const TripCard = ({
  trip,
  seatClass,
  price,
  badgeContent = 0,
  buttonText,
  buttonVariant = 'secondary',
  onButtonClick,
  isButtonDisabled = false,
  buttonIcon,
  showCancelButton = false,
  onCancelClick,
  bookedPassenger,
}: TripCardProps) => {
  return (
    <Card className="bg-secondary p-3">
      <div className="flex flex-col space-y-3">
        <div className="flex flex-col space-y-3">
          <div className="flex justify-between">
            <IconDisplay
              iconFilename={seatClass?.icon}
              iconType="transport-seat"
              alt={seatClass?.name}
              fallback={<Armchair className="h-6 w-6" />}
            />
            <Badge variant="default" className="rounded-xl">
              {badgeContent}
            </Badge>
          </div>

          <div className="flex items-start gap-3">
            {/* Route stops badges */}
            <div className="flex flex-wrap gap-2 flex-1">
              <RouteStopsBadges trip={trip} />
            </div>
          </div>

          {/* Pickup Information for booked trips */}
          {bookedPassenger && (
            <div className="text-xs text-muted-foreground space-y-1">
              {bookedPassenger.pickupAddress ? (
                <div>Specified pickup address: {bookedPassenger.pickupAddress}</div>
              ) : bookedPassenger.pickupLocation ? (
                <div>Selected pickup location: {bookedPassenger.pickupLocation.name}</div>
              ) : (
                <div className="text-orange-400">To be specified later</div>
              )}
            </div>
          )}

          <div className="flex gap-3 items-center">
            <div className="font-semibold text-primary flex-shrink-0">{formatCurrency(price)}</div>
            <div className="flex-1 flex gap-2">
              <Button
                size="sm"
                variant={buttonVariant}
                className={showCancelButton ? 'flex-1' : 'w-full'}
                onClick={onButtonClick}
                disabled={isButtonDisabled}
              >
                {buttonText}
                {buttonIcon && buttonIcon}
              </Button>
              {showCancelButton && onCancelClick && (
                <Button
                  size="sm"
                  variant="destructive"
                  className="px-3"
                  onClick={onCancelClick}
                  title="Cancel booking"
                >
                  Cancel <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default TripCard;
