import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Icon } from '../Icon';
import { IconButton } from '../IconButton';
import { fonts } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';

type Props = {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onClose: () => void;
};

export function ExploreHeader({
  searchQuery,
  onSearchChange,
  onClose,
}: Props) {
  const { theme } = useTheme();

  return (
    <View style={styles.header}>
      <View style={styles.topRow}>
        <View style={styles.titleWrap}>
          <Text style={[styles.eyebrow, { color: theme.accent }]}>
            NEXUS UTILITIES
          </Text>
          <Text style={[styles.title, { color: theme.ink }]}>
            Explore
          </Text>
          <Text style={[styles.subtitle, { color: theme.muted }]}>
            Tools to make your web smarter.
          </Text>
        </View>

        <IconButton
          icon="close"
          label="Close explore hub"
          size={36}
          iconSize={16}
          variant="surface"
          onPress={onClose}
        />
      </View>

      {/* Search Field */}
      <View
        style={[
          styles.searchBox,
          { backgroundColor: theme.surface, borderColor: theme.line },
        ]}
      >
        <Icon name="search" size={15} color={theme.muted} />
        <TextInput
          value={searchQuery}
          onChangeText={onSearchChange}
          placeholder="Find a tool (calculator, timer, inspect, etc)..."
          placeholderTextColor={theme.muted}
          style={[styles.searchInput, { color: theme.ink }]}
          returnKeyType="search"
          autoCapitalize="none"
          clearButtonMode="while-editing"
        />
        {searchQuery.length > 0 && (
          <IconButton
            icon="close"
            label="Clear search"
            size={24}
            iconSize={12}
            onPress={() => onSearchChange('')}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 10,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  titleWrap: {
    flex: 1,
    marginRight: 10,
  },
  eyebrow: {
    fontFamily: fonts.medium,
    fontSize: 10.5,
    letterSpacing: 1.2,
  },
  title: {
    fontFamily: fonts.serif,
    fontSize: 24,
    marginTop: 2,
  },
  subtitle: {
    fontFamily: fonts.sans,
    fontSize: 12.5,
    marginTop: 2,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 13,
    padding: 0,
  },
});
