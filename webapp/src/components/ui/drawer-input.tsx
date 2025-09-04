import * as React from 'react';
import { Input } from './input';

interface DrawerInputProps extends Omit<React.ComponentProps<typeof Input>, 'onChange' | 'value'> {
  onValueChange?: (value: string) => void;
  value?: string;
  defaultValue?: string;
}

export const DrawerInput = React.forwardRef<HTMLInputElement, DrawerInputProps>(
  ({ onValueChange, value, defaultValue, ...props }, ref) => {
    const inputRef = React.useRef<HTMLInputElement>(null);
    const [internalValue, setInternalValue] = React.useState(value || defaultValue || '');

    // Combine refs
    React.useImperativeHandle(ref, () => inputRef.current!);

    // Stable onChange handler that doesn't cause re-renders
    const handleChange = React.useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setInternalValue(newValue);
        onValueChange?.(newValue);
      },
      [onValueChange]
    );

    // Only update internal value when controlled value changes externally
    React.useEffect(() => {
      if (value !== undefined && value !== internalValue) {
        setInternalValue(value);
      }
    }, [value]);

    return (
      <Input
        {...props}
        ref={inputRef}
        value={internalValue}
        onChange={handleChange}
        autoComplete="off"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
      />
    );
  }
);

DrawerInput.displayName = 'DrawerInput';
