// utils/storage.js
import AsyncStorage from '@react-native-async-storage/async-storage';

export const saveToken = async (token) => {
  try {
    await AsyncStorage.setItem("token", token);
  } catch (e) {
    console.error("Error saving token:", e);
  }
};

export const getToken = async () => {
  try {
    const value = await AsyncStorage.getItem("token");
    return value;
  } catch (e) {
    console.error("Error reading token:", e);
    return null;
  }
};

export const saveSelectedCustomer = async (customer) => {
  try {
    await AsyncStorage.setItem("selectedCustomer", JSON.stringify(customer));
  } catch (e) {
    console.error("Error saving customer:", e);
  }
};

export const getSelectedCustomer = async () => {
  try {
    const value = await AsyncStorage.getItem("selectedCustomer");
    return value ? JSON.parse(value) : null;
  } catch (e) {
    console.error("Error reading customer:", e);
    return null;
  }
};
export const clearSelectedCustomer = async () => {
  try {
    await AsyncStorage.removeItem('selectedCustomer');
  } catch (error) {
    console.log('Error clearing selected customer:', error);
  }
};