import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  type ListRenderItem,
} from 'react-native';

import type { BookSummary } from '@/api/types';
import { EmptyView, ErrorView, LoadingView } from '@/components/StateViews';
import { useAddToCart } from '@/features/cart/useAddToCart';
import { colors, font, spacing } from '@/theme';
import { useDebouncedValue } from '@/utils/useDebouncedValue';

import { BOOK_ROW_HEIGHT, BookRow } from './BookRow';
import { SearchBar } from './SearchBar';
import { useBooks } from './useBooks';

export const SEARCH_DEBOUNCE_MS = 400;

const keyExtractor = (book: BookSummary) => book.id;

const getItemLayout = (_: ArrayLike<BookSummary> | null | undefined, index: number) => ({
  length: BOOK_ROW_HEIGHT,
  offset: BOOK_ROW_HEIGHT * index,
  index,
});

export function BookListScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const query = useDebouncedValue(search.trim(), SEARCH_DEBOUNCE_MS);
  const { items, status, error, hasMore, total, loadMore, refresh, retry } = useBooks(query);
  const addToCart = useAddToCart();

  const handlePress = useCallback(
    (book: BookSummary) =>
      router.push({ pathname: '/book/[id]', params: { id: book.id, title: book.title } }),
    [router],
  );

  const renderItem = useCallback<ListRenderItem<BookSummary>>(
    ({ item }) => <BookRow book={item} onPress={handlePress} onAddToCart={addToCart} />,
    [handlePress, addToCart],
  );

  const renderBody = () => {
    if (status === 'loading') return <LoadingView label="Finding books…" />;
    if (status === 'error' && items.length === 0) {
      return <ErrorView message={error ?? 'Could not load books.'} onRetry={retry} />;
    }
    return (
      <FlatList
        data={items}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        getItemLayout={getItemLayout}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={7}
        removeClippedSubviews
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={status === 'refreshing'}
            onRefresh={refresh}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <EmptyView
            title={query ? 'No books found' : 'No books yet'}
            message={query ? `Nothing matched “${query}”. Try another search.` : undefined}
          />
        }
        ListFooterComponent={
          <ListFooter
            loading={status === 'loadingMore'}
            error={status === 'error' ? error : null}
            onRetry={retry}
            end={!hasMore && items.length > 0}
          />
        }
        contentContainerStyle={items.length === 0 ? styles.emptyContent : undefined}
        testID="book-list"
      />
    );
  };

  return (
    <View style={styles.screen}>
      <SearchBar value={search} onChangeText={setSearch} />
      {/* Kept outside the FlatList: a list header would offset rows and break getItemLayout. */}
      {total > 0 ? (
        <Text style={styles.count}>
          {query ? `${total.toLocaleString()} results` : `${total.toLocaleString()} books`}
        </Text>
      ) : null}
      {renderBody()}
    </View>
  );
}

function ListFooter({
  loading,
  error,
  onRetry,
  end,
}: {
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  end: boolean;
}) {
  if (loading) {
    return (
      <View style={styles.footer}>
        <ActivityIndicator color={colors.primary} aria-label="Loading more books" />
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.footer}>
        <Text style={styles.footerText} role="alert">
          {error}
        </Text>
        <Pressable role="button" aria-label="Retry loading more" onPress={onRetry} hitSlop={8}>
          <Text style={styles.retry}>Retry</Text>
        </Pressable>
      </View>
    );
  }
  if (end) {
    return (
      <View style={styles.footer}>
        <Text style={styles.footerText}>You’ve reached the end.</Text>
      </View>
    );
  }
  return null;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  count: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    fontSize: font.caption,
    color: colors.textMuted,
  },
  emptyContent: { flexGrow: 1 },
  footer: { padding: spacing.xl, alignItems: 'center', gap: spacing.sm },
  footerText: { color: colors.textMuted, fontSize: font.caption, textAlign: 'center' },
  retry: { color: colors.primary, fontWeight: '700' },
});
