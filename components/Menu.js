import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function Menu({ menuOpen, setActiveScreen, setMenuOpen }) {
  return (
    <View style={[styles.menu, menuOpen ? styles.menuOpen : styles.menuClosed]}>
      <TouchableOpacity onPress={() => { setActiveScreen('Profile'); setMenuOpen(false); }}>
        <Text style={styles.menuItem}>پروفایل</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => { setActiveScreen('Cart'); setMenuOpen(false); }}>
        <Text style={styles.menuItem}>سبد خرید</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => { setActiveScreen('Category'); setMenuOpen(false); }}>
        <Text style={styles.menuItem}>جستجوی کالا</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  menu: {
    position: 'absolute',
    top: 80,
    right: 0,
    backgroundColor: '#ff4d6d',
    zIndex: 5,
    padding: 10,
  },
  menuOpen: {
    width: 150,
  },
  menuClosed: {
    width: 0,
  },
  menuItem: {
    color: '#fff',
    fontSize: 16,
    paddingVertical: 5,
  },
});
