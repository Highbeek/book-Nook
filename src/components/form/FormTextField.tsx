import { useController, type Control, type FieldPath, type FieldValues } from 'react-hook-form';

import { TextField, type TextFieldProps } from '../TextField';

export interface FormTextFieldProps<T extends FieldValues> extends Omit<
  TextFieldProps,
  'value' | 'onChangeText' | 'onBlur' | 'error' | 'ref'
> {
  control: Control<T>;
  name: FieldPath<T>;

  format?: (raw: string) => string;
}

export function FormTextField<T extends FieldValues>({
  control,
  name,
  format,
  ...props
}: FormTextFieldProps<T>) {
  const {
    field: { ref, value, onChange, onBlur },
    fieldState: { error },
  } = useController({ control, name });
  return (
    <TextField
      {...props}
      ref={ref}
      value={value ?? ''}
      onChangeText={(text) => onChange(format ? format(text) : text)}
      onBlur={onBlur}
      error={error?.message}
    />
  );
}
