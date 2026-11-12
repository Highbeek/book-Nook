import { useController, type Control, type FieldPath, type FieldValues } from 'react-hook-form';

import { TextField, type TextFieldProps } from '../TextField';

export interface FormTextFieldProps<T extends FieldValues> extends Omit<
  TextFieldProps,
  'value' | 'onChangeText' | 'onBlur' | 'error' | 'ref'
> {
  control: Control<T>;
  name: FieldPath<T>;
  /** Reformat raw input as the user types (e.g. card number grouping). */
  format?: (raw: string) => string;
}

/** A TextField bound to react-hook-form: value, errors, blur, and focus-on-error. */
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
