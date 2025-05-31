// src/components/common/FilterChip.js

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet
} from 'react-native';

const FilterChip = ({ label, active, onPress }) => {
  return (
    <TouchableOpacity
      style={[
        styles.chip,
        active ? styles.activeChip : {}
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.chipText,
          active ? styles.activeChipText : {}
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chip: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  activeChip: {
    backgroundColor: '#3F72AF',
    borderColor: '#3F72AF',
  },
  chipText: {
    fontSize: 14,
    color: '#555',
  },
  activeChipText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
});

export default FilterChip;