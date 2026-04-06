import { Input } from 'antd';
import type { InputProps } from 'antd';
import type { ChangeEvent } from 'react';
import { useCallback } from 'react';

export interface TimeInputProps extends Omit<InputProps, 'onChange' | 'value'> {
  value?: string;
  onChange?: (value: string) => void;
}

export function TimeInput({ value, onChange, ...rest }: TimeInputProps) {
  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      let raw = e.target.value.replace(/[^\d]/g, '');

      if (raw.length > 4) {
        raw = raw.slice(0, 4);
      }

      if (raw.length > 2) {
        raw = raw.slice(0, 2) + ':' + raw.slice(2);
      }

      onChange?.(raw);
    },
    [onChange]
  );

  return (
    <Input
      {...rest}
      value={value}
      onChange={handleChange as InputProps['onChange']}
      placeholder={rest.placeholder ?? '00:00'}
      maxLength={5}
    />
  );
}
