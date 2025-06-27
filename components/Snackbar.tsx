import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SnackbarProps {
  visible: boolean;
  message: string;
  action?: {
    label: string;
    onPress: () => void;
  };
  type?: 'success' | 'error' | 'info';
  onDismiss: () => void;
}

const Snackbar = ({ visible, message, action, type = 'success', onDismiss }: SnackbarProps) => {
  const translateY = new Animated.Value(100);

  useEffect(() => {
    if (visible) {
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();

      const timer = setTimeout(() => {
        Animated.timing(translateY, {
          toValue: 100,
          duration: 300,
          useNativeDriver: true,
        }).start(() => onDismiss());
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!visible) return null;

  const iconName = 
    type === 'success' ? 'checkmark-circle-outline' : 
    type === 'error' ? 'alert-circle-outline' : 'information-circle-outline';
  
  const iconColor = 
    type === 'success' ? '#34C759' : 
    type === 'error' ? '#FF3B30' : '#007AFF';

  return (
    <Animated.View 
      style={[
        styles.container, 
        { transform: [{ translateY }] }
      ]}
    >
      <View style={styles.content}>
        <Ionicons name={iconName} size={24} color={iconColor} style={styles.icon} />
        <Text style={styles.message}>{message}</Text>
      </View>
      
      {action && (
        <TouchableOpacity style={styles.actionButton} onPress={action.onPress}>
          <Text style={styles.actionText}>{action.label}</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#333',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
    zIndex: 999,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 12,
  },
  message: {
    color: '#fff',
    fontSize: 16,
    flex: 1,
  },
  actionButton: {
    marginLeft: 16,
  },
  actionText: {
    color: '#007AFF',
    fontWeight: 'bold',
    fontSize: 14,
    textTransform: 'uppercase',
  }
});

export default Snackbar;