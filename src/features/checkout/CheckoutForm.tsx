import { yupResolver } from '@hookform/resolvers/yup';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import Animated, {
  FadeInDown,
  FadeOut,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { Button } from '@/components/Button';
import { FormTextField } from '@/components/form/FormTextField';
import { KeyboardDoneBar } from '@/components/KeyboardDoneBar';
import { radius, spacing } from '@/theme';
import { formatPrice } from '@/utils/currency';

import {
  PaymentError,
  processPayment,
  type PaymentProcessor,
  type PaymentReceipt,
} from './paymentService';
import {
  checkoutSchema,
  digitsOnly,
  emptyCheckoutValues,
  formatCardNumber,
  formatExpiry,
  type CheckoutValues,
} from './validation';
import { AppText } from '@/components/AppText';

export interface CheckoutFormProps {
  /** Amount to charge, in minor units. */
  amount: number;
  onSuccess: (receipt: PaymentReceipt) => void;
  pay?: PaymentProcessor;
}

const formatCvc = (raw: string) => digitsOnly(raw).slice(0, 4);

const KEYBOARD_BAR_ID = 'checkout-keyboard';

/** Keeps the keyboard up while "Next" moves focus to the following field. */
const nextFieldProps = { returnKeyType: 'next', submitBehavior: 'submit' } as const;

export function CheckoutForm({ amount, onSuccess, pay = processPayment }: CheckoutFormProps) {
  const { control, handleSubmit, subscribe, setFocus } = useForm<CheckoutValues>({
    resolver: yupResolver(checkoutSchema),
    defaultValues: emptyCheckoutValues,
    // Validate each field as the user types; untouched fields stay quiet until submit.
    mode: 'onChange',
  });
  const [submitting, setSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  // Blocks a double tap from charging twice before the disabled state renders.
  const inFlight = useRef(false);
  const reduceMotion = useReducedMotion();
  const shakeX = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shakeX.get() }] }));

  /** A quick side-to-side shake: "something here needs fixing". */
  const shake = () => {
    if (reduceMotion) return;
    shakeX.set(
      withSequence(
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 70 }),
        withTiming(-8, { duration: 70 }),
        withTiming(8, { duration: 70 }),
        withTiming(0, { duration: 50 }),
      ),
    );
  };

  // Editing any field dismisses a previous payment failure.
  useEffect(
    () => subscribe({ formState: { values: true }, callback: () => setPaymentError(null) }),
    [subscribe],
  );

  const charge = async (values: CheckoutValues) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setSubmitting(true);
    setPaymentError(null);
    try {
      // Values come out of the schema already trimmed.
      const receipt = await pay({
        amount,
        email: values.email,
        card: {
          number: values.cardNumber,
          expiry: values.expiry,
          cvc: values.cvc,
          name: values.fullName,
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
      <Animated.View style={[styles.fields, shakeStyle]}>
        <FormTextField
          control={control}
          name="fullName"
          label="Name on card"
          autoComplete="name"
          textContentType="name"
          autoCapitalize="words"
          {...nextFieldProps}
          onSubmitEditing={() => setFocus('email')}
        />
        <FormTextField
          control={control}
          name="email"
          label="Email"
          keyboardType="email-address"
          autoComplete="email"
          textContentType="emailAddress"
          autoCapitalize="none"
          {...nextFieldProps}
          onSubmitEditing={() => setFocus('cardNumber')}
        />
        <FormTextField
          control={control}
          name="cardNumber"
          label="Card number"
          format={formatCardNumber}
          inputMode="numeric"
          autoComplete="cc-number"
          textContentType="creditCardNumber"
          placeholder="1234 5678 9012 3456"
          inputAccessoryViewID={KEYBOARD_BAR_ID}
          {...nextFieldProps}
          onSubmitEditing={() => setFocus('expiry')}
        />
        <View style={styles.row}>
          <FormTextField
            control={control}
            name="expiry"
            label="Expiry (MM/YY)"
            format={formatExpiry}
            inputMode="numeric"
            autoComplete="cc-exp"
            placeholder="MM/YY"
            style={styles.half}
            inputAccessoryViewID={KEYBOARD_BAR_ID}
            {...nextFieldProps}
            onSubmitEditing={() => setFocus('cvc')}
          />
          <FormTextField
            control={control}
            name="cvc"
            label="CVC"
            format={formatCvc}
            inputMode="numeric"
            autoComplete="cc-csc"
            secureTextEntry
            placeholder="123"
            style={styles.half}
            inputAccessoryViewID={KEYBOARD_BAR_ID}
            returnKeyType="done"
          />
        </View>
      </Animated.View>
      <KeyboardDoneBar nativeID={KEYBOARD_BAR_ID} />

      {paymentError ? (
        <Animated.View
          entering={FadeInDown.duration(220)}
          exiting={FadeOut.duration(150)}
          style={styles.paymentError}
        >
          <AppText tone="danger" role="alert">
            {paymentError}
          </AppText>
        </Animated.View>
      ) : null}

      <Button
        label={submitting ? 'Processing…' : `Pay ${formatPrice(amount)}`}
        onPress={() => handleSubmit(charge, shake)()}
        loading={submitting}
        disabled={amount <= 0}
        testID="pay-button"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.md },
  fields: { gap: spacing.md },
  row: { flexDirection: 'row', gap: spacing.md },
  half: { flex: 1 },
  paymentError: {
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: '#FDECEA',
  },
});
