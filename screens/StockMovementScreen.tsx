import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { databaseService, Item } from '../services/database';
import { RootStackParamList } from '../navigation/AppNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type StockMovementRouteProp = RouteProp<RootStackParamList, 'StockMovement'>;

export default function StockMovementScreen() {
  const [item, setItem] = useState<Item | null>(null);
  const [quantity, setQuantity] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<StockMovementRouteProp>();
  const { itemId, type } = route.params;

  useEffect(() => {
    loadItem();
  }, [itemId]);

  const loadItem = async () => {
    try {
      const itemData = await databaseService.getItemById(itemId);
      if (!itemData) {
        Alert.alert('Error', 'Item not found', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
        return;
      }
      setItem(itemData);
    } catch (error) {
      console.error('Error loading item:', error);
      Alert.alert('Error', 'Failed to load item details');
    }
  };

  const validateInput = () => {
    if (!quantity.trim()) {
      Alert.alert('Validation Error', 'Please enter a quantity');
      return false;
    }

    const quantityNum = parseInt(quantity);
    if (isNaN(quantityNum) || quantityNum <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid positive quantity');
      return false;
    }

    if (type === 'out' && item && quantityNum > item.quantity) {
      Alert.alert(
        'Insufficient Stock',
        `Cannot remove ${quantityNum} items. Only ${item.quantity} available in stock.`
      );
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateInput() || !item) return;

    setLoading(true);
    try {
      const quantityNum = parseInt(quantity);
      await databaseService.processStockMovement(
        itemId,
        type,
        quantityNum,
        note.trim()
      );

      const actionText = type === 'in' ? 'added to' : 'removed from';
      Alert.alert(
        'Success',
        `${quantityNum} items ${actionText} ${item.name}`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error) {
      console.error('Error processing stock movement:', error);
      Alert.alert('Error', 'Failed to process stock movement. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getMaxQuantity = () => {
    if (type === 'out' && item) {
      return item.quantity;
    }
    return null;
  };

  const getButtonColor = () => {
    return type === 'in' ? '#34C759' : '#FF3B30';
  };

  const getIconName = () => {
    return type === 'in' ? 'add-circle-outline' : 'remove-circle-outline';
  };

  if (!item) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Item Info */}
        <View style={styles.itemCard}>
          <View style={styles.itemHeader}>
            <Ionicons name="cube-outline" size={24} color="#007AFF" />
            <Text style={styles.itemName}>{item.name}</Text>
          </View>
          
          <View style={styles.itemDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Current Stock:</Text>
              <Text style={[styles.detailValue, styles.stockValue]}>{item.quantity}</Text>
            </View>
            
            {item.sku && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>SKU:</Text>
                <Text style={styles.detailValue}>{item.sku}</Text>
              </View>
            )}
            
            {item.location && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Location:</Text>
                <Text style={styles.detailValue}>{item.location}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Movement Form */}
        <View style={styles.formCard}>
          <View style={styles.formHeader}>
            <Ionicons name={getIconName()} size={24} color={getButtonColor()} />
            <Text style={[styles.formTitle, { color: getButtonColor() }]}>
              {type === 'in' ? 'Stock In' : 'Stock Out'}
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Quantity *</Text>
            <TextInput
              style={styles.quantityInput}
              value={quantity}
              onChangeText={setQuantity}
              placeholder="Enter quantity"
              keyboardType="numeric"
              maxLength={10}
            />
            {type === 'out' && (
              <Text style={styles.helperText}>
                Maximum available: {item.quantity}
              </Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Note (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={note}
              onChangeText={setNote}
              placeholder="Enter a note for this movement"
              multiline
              numberOfLines={3}
              maxLength={200}
              textAlignVertical="top"
            />
          </View>

          {/* Preview */}
          {quantity && !isNaN(parseInt(quantity)) && parseInt(quantity) > 0 && (
            <View style={styles.previewCard}>
              <Text style={styles.previewTitle}>Preview</Text>
              <View style={styles.previewRow}>
                <Text style={styles.previewLabel}>Current Stock:</Text>
                <Text style={styles.previewValue}>{item.quantity}</Text>
              </View>
              <View style={styles.previewRow}>
                <Text style={styles.previewLabel}>
                  {type === 'in' ? 'Adding:' : 'Removing:'}
                </Text>
                <Text style={[styles.previewValue, { color: getButtonColor() }]}>
                  {type === 'in' ? '+' : '-'}{parseInt(quantity)}
                </Text>
              </View>
              <View style={[styles.previewRow, styles.previewTotal]}>
                <Text style={styles.previewLabel}>New Stock:</Text>
                <Text style={[styles.previewValue, styles.previewTotalValue]}>
                  {type === 'in' 
                    ? item.quantity + parseInt(quantity)
                    : Math.max(0, item.quantity - parseInt(quantity))
                  }
                </Text>
              </View>
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.submitButton,
              { backgroundColor: getButtonColor() },
              loading && styles.disabledButton
            ]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Ionicons name={getIconName()} size={20} color="#fff" />
            <Text style={styles.submitButtonText}>
              {loading 
                ? 'Processing...' 
                : `${type === 'in' ? 'Add to' : 'Remove from'} Stock`
              }
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  scrollView: {
    flex: 1,
  },
  itemCard: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  itemName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  itemDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 16,
    color: '#666',
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  stockValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  formCard: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  quantityInput: {
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
    borderColor: '#007AFF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  textArea: {
    height: 80,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  helperText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  previewCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  previewTotal: {
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    paddingTop: 8,
    marginTop: 4,
  },
  previewLabel: {
    fontSize: 14,
    color: '#666',
  },
  previewValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  previewTotalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
    gap: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
