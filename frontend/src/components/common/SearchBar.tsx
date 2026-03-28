import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';
import { fontSize } from '../../theme/typography';

interface SearchBarProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  debounceMs?: number;
  isDark?: boolean;
  style?: ViewStyle;
  autoFocus?: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = 'Search...',
  onSearch,
  debounceMs = 400,
  isDark = false,
  style,
  autoFocus = false,
}) => {
  const [query, setQuery] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const backgroundColor = isDark ? colors.surface.dark : colors.surface.light;
  const borderColor = isDark ? colors.border.dark : colors.border.light;
  const textColor = isDark ? colors.text.primary.dark : colors.text.primary.light;
  const placeholderColor = isDark ? colors.text.disabled.dark : colors.text.disabled.light;

  const handleChange = (text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onSearch(text);
    }, debounceMs);
  };

  const handleClear = () => {
    setQuery('');
    onSearch('');
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <View style={[styles.container, { backgroundColor, borderColor }, style]}>
      <Text style={[styles.searchIcon, { color: placeholderColor }]}>🔍</Text>
      <TextInput
        style={[styles.input, { color: textColor }]}
        placeholder={placeholder}
        placeholderTextColor={placeholderColor}
        value={query}
        onChangeText={handleChange}
        returnKeyType="search"
        autoFocus={autoFocus}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {query.length > 0 && (
        <TouchableOpacity onPress={handleClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={[styles.clearIcon, { color: placeholderColor }]}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    paddingHorizontal: spacing[3],
    height: 44,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: spacing[2],
  },
  input: {
    flex: 1,
    fontSize: fontSize.md,
    paddingVertical: 0,
  },
  clearIcon: {
    fontSize: 14,
    marginLeft: spacing[2],
  },
});

export default SearchBar;
