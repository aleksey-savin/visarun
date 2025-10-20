# PickupLocation Components

This directory contains the frontend components for managing pickup locations within the visa run system.

## Components

### PickupLocationManager

A comprehensive component for managing pickup locations within city cards in the Countries view.

#### Features

- **CRUD Operations**: Create, read, update, and delete pickup locations
- **Permission-based Access**: Respects user permissions for different operations
- **Advanced Validation**: GPS coordinates format validation and business rule enforcement
- **Rich UI**: Modern interface with dialogs, badges, and status indicators
- **Safety Features**: Prevents deletion of locations in use by active routes

#### Props

```typescript
interface PickupLocationManagerProps {
  cityId: string;
  cityName: string;
}
```

#### Permissions Required

- `pickupLocations.create` - Create new pickup locations
- `pickupLocations.read` - View pickup locations (required for component to render)
- `pickupLocations.update` - Edit existing pickup locations
- `pickupLocations.delete` - Delete pickup locations

#### Usage

```tsx
import { PickupLocationManager } from '@/components/PickupLocation';

function CityCard({ city }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{city.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <PickupLocationManager 
          cityId={city.id} 
          cityName={city.name} 
        />
      </CardContent>
    </Card>
  );
}
```

## Data Structure

### PickupLocationData Interface

```typescript
interface PickupLocationData {
  id: string;
  cityId: string;
  name: string;
  address: string;
  landmark?: string | null;
  coordinates?: string | null;
  isActive: boolean;
  summary?: {
    totalRouteStops: number;
    activeRouteStops: number;
    isInUse: boolean;
  };
}
```

### Form Data Interface

```typescript
interface PickupLocationFormData {
  name: string;
  address: string;
  landmark: string;
  coordinates: string;
  isActive: boolean;
}
```

## Features Detail

### 1. Create Pickup Location
- Modal dialog with comprehensive form
- Required fields: name, address
- Optional fields: landmark, GPS coordinates
- Real-time validation for coordinates format
- Status toggle (active/inactive)

### 2. View Pickup Locations
- Card-based layout showing all locations for a city
- Status badges (Active/Inactive/Unused)
- Route usage indicators
- Completion score display
- GPS coordinates formatting

### 3. Edit Pickup Location
- Pre-populated form with existing data
- Same validation as create form
- Prevents name conflicts within the same city

### 4. Delete Pickup Location
- Confirmation dialog with safety checks
- Prevents deletion of locations used by active routes
- Shows usage warning when applicable

## Validation Rules

### GPS Coordinates
- Format: `latitude,longitude` (e.g., "13.7563,100.5018")
- Regex pattern: `/^-?\d+\.?\d*,-?\d+\.?\d*$/`
- Optional field, but must be valid if provided

### Business Rules
- Name must be unique within the same city
- Cannot delete locations used by active routes
- Cannot delete locations with historical trip data

## Status Indicators

- **Active**: Location is active and being used by routes
- **Unused**: Location is active but not assigned to any routes
- **Inactive**: Location is disabled

## Integration

The component is integrated into the Countries view (`pages/Countries/view.tsx`) within the Cities tab, where each city card includes its own PickupLocationManager instance.

## API Endpoints Used

- `trpc.pickupLocation.getAll` - Fetch pickup locations
- `trpc.pickupLocation.create` - Create new pickup location
- `trpc.pickupLocation.edit` - Update existing pickup location
- `trpc.pickupLocation.delete` - Delete pickup location

## Dependencies

- React hooks (useState)
- tRPC client for API calls
- UI components from shadcn/ui
- Lucide React icons
- Sonner for toast notifications
- Auth context for permissions

## Error Handling

- Form validation with user-friendly error messages
- API error handling with toast notifications
- Permission-based UI rendering
- Safe deletion with business rule enforcement