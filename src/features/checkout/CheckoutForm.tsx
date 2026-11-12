import { useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { Button } from '@/components/Button';
import { colors, font, radius, spacing } from '@/theme';
import { formatPrice } from '@/utils/currency';

import {
  PaymentError,
  processPayment,
  type PaymentProcessor,
  type PaymentReceipt,
} from './paymentService';
import {
  digitsOnly,
  emptyCheckoutValues,
  formatCardNumber,
  formatExpiry,
  hasErrors,
  validateCheckout,
  type CheckoutErrors,
  type CheckoutValues,
} from './validation';

export interface CheckoutFormProps {
  /** Amount to charge, in minor units. */
  amount: number;
  onSuccess: (receipt: PaymentReceipt) => void;
  pay?: PaymentProcessor;
}

export function CheckoutForm({ amount, onSuccess, pay = processPayment }: CheckoutFormProps) {
  const [values, setValues] = useState<CheckoutValues>(emptyCheckoutValues);
  const [errors, setErrors] = useState<CheckoutErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  // Blocks a double tap from charging twice before the disabled state renders.
  const inFlight = useRef(false);

  const update = (field: keyof CheckoutValues, raw: string) => {
    const formatted =
      field === 'cardNumber'
        ? formatCardNumber(raw)
        : field === 'expiry'
          ? formatExpiry(raw)
          : field === 'cvc'
            ? digitsOnly(raw).slice(0, 4)
            : raw;
    const next = { ...values, [field]: formatted };
    setValues(next);
    setPaymentError(null);
    // Validate live only after the first submit, so users aren't nagged while typing.
    if (submitted) setErrors(validateCheckout(next));
  };

  const handleSubmit = async () => {
    if (inFlight.current) return;
    setSubmitted(true);
    const validation = validateCheckout(values);
    setErrors(validation);
    if (hasErrors(validation)) return;

    inFlight.current = true;
    setSubmitting(true);
    setPaymentError(null);
    try {
      const receipt = await pay({
        amount,
        email: values.email.trim(),
        card: {
          number: values.cardNumber,
          expiry: values.expiry,
          cvc: values.cvc,
          name: values.fullName.trim(),
        },
      });
      onSuccess(receipt);
    } catch (error) {
      setPaymentError(
        error instanceof PaymentError ? error.message : 'Payment failed. Please try again.',
      );
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.form}>
      <Field
        label="Name on card"
        value={values.fullName}
        error={errors.fullName}
        onChangeText={(t) => update('fullName', t)}
        autoComplete="name"
        textContentType="name"
        autoCapitalize="words"
      />
      <Field
        label="Email"
        value={values.email}
        error={errors.email}
        onChangeText={(t) => update('email', t)}
        keyboardType="email-address"
        autoComplete="email"
        textContentType="emailAddress"
        autoCapitalize="none"
      />
      <Field
        label="Card number"
        value={values.cardNumber}
        error={errors.cardNumber}
        onChangeText={(t) => update('cardNumber', t)}
        keyboardType="number-pad"
        autoComplete="cc-number"
        textContentType="creditCardNumber"
        placeholder="1234 5678 9012 3456"
      />
      <View style={styles.row}>
        <Field
          label="Expiry (MM/YY)"
          value={values.expiry}
          error={errors.expiry}
          onChangeText={(t) => update('expiry', t)}
          keyboardType="number-pad"
          autoComplete="cc-exp"
          placeholder="MM/YY"
          style={styles.half}
        />
        <Field
          label="CVC"
          value={values.cvc}
          error={errors.cvc}
          onChangeText={(t) => update('cvc', t)}
          keyboardType="number-pad"
          autoComplete="cc-csc"
          secureTextEntry
          placeholder="123"
          style={styles.half}
        />
      </View>

      {paymentError ? (
        <Text style={styles.paymentError} role="alert">
          {paymentError}
        </Text>
      ) : null}

      <Button
        label={submitting ? 'Processing…' : `Pay ${formatPrice(amount)}`}
        onPress={handleSubmit}
        loading={submitting}
        disabled={amount <= 0}
        testID="pay-button"
      />
      <Text style={styles.secure}>
        🔒 Demo checkout — card details are validated on-device and never stored.
      </Text>
    </View>
  );
}

interface FieldProps extends Omit<TextInputProps, 'style'> {
  label: string;
  error?: string;
  style?: TextInputProps['style'];
}

function Field({ label, error, style, ...input }: FieldProps) {
  return (
    <View style={[styles.field, style]}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        aria-label={label}
        aria-invalid={Boolean(error)}
        placeholderTextColor={colors.textMuted}
        autoCorrect={false}
        style={[styles.input, error ? styles.inputError : null]}
        {...input}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.md },
  row: { flexDirection: 'row', gap: spacing.md },
  half: { flex: 1 },
  field: { gap: spacing.xs },
  label: { fontSize: font.caption, fontWeight: '600', color: colors.textMuted },
  input: {
    height: 46,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    fontSize: font.body,
    color: colors.text,
  },
  inputError: { borderColor: colors.danger },
  error: { fontSize: font.caption, color: colors.danger },
  paymentError: {
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: '#FDECEA',
    color: colors.danger,
    fontSize: font.body,
  },
  secure: { fontSize: font.caption, color: colors.textMuted, textAlign: 'center' },
});
