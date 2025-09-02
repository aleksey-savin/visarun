// Dynamically import all icons from the transport-type-icons folder
const transportTypeIconModules = import.meta.glob('@/assets/transport-type-icons/*.svg', {
  as: 'url',
  eager: true,
});

// Dynamically import all icons from the transport-seat-icons folder
const transportSeatIconModules = import.meta.glob('@/assets/transport-seat-icons/*.svg', {
  as: 'url',
  eager: true,
});

// Convert transport type icons to usable format
export const TRANSPORT_TYPE_ICONS = Object.entries(transportTypeIconModules).map(([path, url]) => {
  const filename = path.split('/').pop() || '';
  return {
    value: filename,
    path: url as string,
  };
});

// Convert transport seat icons to usable format
export const TRANSPORT_SEAT_ICONS = Object.entries(transportSeatIconModules).map(([path, url]) => {
  const filename = path.split('/').pop() || '';
  return {
    value: filename,
    path: url as string,
  };
});

// Helper function to get icon path by filename
export const getIconPath = (
  iconType: 'transport-type' | 'transport-seat',
  iconFilename?: string
) => {
  if (!iconFilename || iconFilename === 'none') return undefined;

  const icons = iconType === 'transport-type' ? TRANSPORT_TYPE_ICONS : TRANSPORT_SEAT_ICONS;
  const icon = icons.find(i => i.value === iconFilename);

  return icon?.path;
};

// Helper function to get icon filename without extension for display
export const getIconDisplayName = (iconFilename?: string) => {
  if (!iconFilename || iconFilename === 'none') return undefined;
  return iconFilename.replace('.svg', '').replace(/-/g, ' ');
};
