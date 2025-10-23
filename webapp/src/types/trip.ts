export interface RouteStop {
  id: string;
  stopType: 'departure' | 'arrival' | 'intermediate';
  pickupMode: string;
  arrivalTime: string;
  departureTime: string;
  waitingDuration?: number;
  city: {
    id: string;
    name: string;
    country: {
      id: string;
      name: string;
    };
  };
  pickupLocations?: Array<{
    id: string;
    pickupLocation: {
      id: string;
      name: string;
    };
  }>;
}

export interface Trip {
  id: string;
  departureDateTime: string;
  status: string;
  route: {
    id: string;
    name: string;
    routeStops: RouteStop[];
    transports?: Array<{
      id: string;
      name: string;
      seatCount: number;
      transportType: {
        id: string;
        name: string;
        icon: string;
      };
    }>;
  };
}
