-- Update permission codes from visaNationalitySurcharge to visaCitizenshipSurcharge
UPDATE "Permission" 
SET "code" = 'visaCitizenshipSurcharge.create', 
    "description" = 'Create citizenship surcharges',
    "category" = 'visaCitizenshipSurcharge'
WHERE "code" = 'visaNationalitySurcharge.create';

UPDATE "Permission" 
SET "code" = 'visaCitizenshipSurcharge.read', 
    "description" = 'View citizenship surcharges',
    "category" = 'visaCitizenshipSurcharge'
WHERE "code" = 'visaNationalitySurcharge.read';

UPDATE "Permission" 
SET "code" = 'visaCitizenshipSurcharge.update', 
    "description" = 'Edit citizenship surcharges',
    "category" = 'visaCitizenshipSurcharge'
WHERE "code" = 'visaNationalitySurcharge.update';

UPDATE "Permission" 
SET "code" = 'visaCitizenshipSurcharge.delete', 
    "description" = 'Delete citizenship surcharges',
    "category" = 'visaCitizenshipSurcharge'
WHERE "code" = 'visaNationalitySurcharge.delete';