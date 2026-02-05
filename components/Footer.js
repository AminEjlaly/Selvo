import React from 'react';
import { View, StyleSheet } from 'react-native';

export default function Footer() {
  return <View style={styles.footer} />;
}

const styles = StyleSheet.create({
  footer: {
    height: 2,
    backgroundColor: '#c2185b',
    marginTop: 5,
  },
});
