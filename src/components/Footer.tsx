// components/Footer.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function Footer() {
  return (
    <View style={styles.footer}>
      <Text style={styles.footerText}>©2025 MUCOSAVIEW</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    paddingVertical: 10,
    backgroundColor: '#eee',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#ccc',
  },
  footerText: {
    fontSize: 12,
    color: '#444',
  },
});
