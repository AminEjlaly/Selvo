// components/SimpleErrorBoundary.js
import React from 'react';
import { View, Text } from 'react-native';

export class SimpleErrorBoundary extends React.Component {
  state = { hasError: false };
  
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  
  componentDidCatch(error, errorInfo) {
    console.warn('App Error:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text>مشکلی پیش آمد</Text>
          <Text style={{ marginTop: 10, color: '#666' }}>لطفاً برنامه را restart کنید</Text>
        </View>
      );
    }
    
    return this.props.children;
  }
}