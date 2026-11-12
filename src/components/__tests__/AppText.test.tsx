import { render, screen } from '@testing-library/react-native';

import { colors, font } from '@/theme';

import { AppText } from '../AppText';

describe('<AppText />', () => {
  it('defaults to body size in the main text colour', async () => {
    await render(<AppText>Hello</AppText>);
    expect(screen.getByText('Hello')).toHaveStyle({ fontSize: font.body, color: colors.text });
  });

  it('applies variant, tone, weight and alignment from props', async () => {
    await render(
      <AppText variant="caption" tone="danger" weight="semibold" align="center">
        Remove
      </AppText>,
    );
    expect(screen.getByText('Remove')).toHaveStyle({
      fontSize: font.caption,
      color: colors.danger,
      fontWeight: '600',
      textAlign: 'center',
    });
  });

  it('lets an explicit style win for one-off tweaks', async () => {
    await render(
      <AppText variant="title" style={{ fontSize: 40 }}>
        Big
      </AppText>,
    );
    expect(screen.getByText('Big')).toHaveStyle({ fontSize: 40, fontWeight: '700' });
  });

  it('passes through Text props such as role and numberOfLines', async () => {
    await render(
      <AppText role="heading" numberOfLines={1}>
        Title
      </AppText>,
    );
    expect(screen.getByRole('heading', { name: 'Title' })).toHaveProp('numberOfLines', 1);
  });
});
