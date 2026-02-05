import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';

export default function SearchScreen() {
  const categories = [
    { id: 1, name: 'موبایل', image: 'https://via.placeholder.com/80' },
    { id: 2, name: 'لپتاپ', image: 'https://via.placeholder.com/80' },
    { id: 3, name: 'کتاب', image: 'https://via.placeholder.com/80' },
  ];

  return (
    <View style={styles.container}>
      {categories.map((cat) => (
        <TouchableOpacity key={cat.id} style={styles.card}>
          <Image source={{ uri: cat.image }} style={styles.image} />
          <Text>{cat.name}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    backgroundColor: '#fce4ec',
    padding: 10,
    borderRadius: 10,
  },
  image: { width: 50, height: 50, marginRight: 10 },
});
