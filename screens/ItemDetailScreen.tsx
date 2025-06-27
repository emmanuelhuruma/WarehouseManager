import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  FlatList,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { databaseService, Item, StockLog } from '../services/database';
import { RootStackParamList } from '../navigation/AppNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type ItemDetailRouteProp = RouteProp<RootStackParamList, 'ItemDetail'>;

export default function ItemDetailScreen() {
  const [item, setItem] = useState<Item | null>(null);
  const [stockLogs, setStockLogs] = useState<StockLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ItemDetailRouteProp>();
  const { itemId } = route.params;

  const loadItemData = async () => {
    try {
      const [itemData, logs] = await Promise.all([
        databaseService.getItemById(itemId),
        databaseService.getStockLogsByItemId(itemId)
      ]);
      
      if (!itemData) {
        Alert.alert('Error', 'Item not found', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
        return;
      }
      
      setItem(itemData);
      setStockLogs(logs);
    } catch (error) {
      console.error('Error loading item data:', error);
      Alert.alert('Error', 'Failed to load item details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadItemData();
    }, [itemId])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadItemData();
  };

  const handleStockMovement = (type: 'in' | 'out') => {
    navigation.navigate('StockMovement', { itemId, type });
  };

  const getQuantityColor = (quantity: number) => {
    if (quantity === 0) return '#FF3B30';
    if (quantity < 10) return '#FF9500';
    return '#34C759';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderStockLogItem = ({ item: log }: { item: StockLog }) => (
    <View style={styles.logItem}>
      <View style={styles.logHeader}>
        <View style={styles.logTypeContainer}>
          <Ionicons 
            name={log.type === 'in' ? 'arrow-down-circle' : 'arrow-up-circle'} 
            size={20} 
            color={log.type === 'in' ? '#34C759' : '#FF3B30'} 
          />
          <Text style={[styles.logType, { color: log.type === 'in' ? '#34C759' : '#FF3B30' }]}>
            {log.type === 'in' ? 'Stock In' : 'Stock Out'}
          </Text>
        </View>
        <Text style={[styles.logQuantity, { color: log.type === 'in' ? '#34C759' : '#FF3B30' }]}>
          {log.type === 'in' ? '+' : '-'}{log.quantity}
        </Text>
      </View>
      {log.note && <Text style={styles.logNote}>{log.note}</Text>}
      <Text style={styles.logTime}>{formatDate(log.timestamp)}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading item details...</Text>
      </View>
    );
  }

  if (!item) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Item not found</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Item Info Card */}
      <View style={styles.itemCard}>
        <View style={styles.itemHeader}>
          <Text style={styles.itemName}>{item.name}</Text>
          <View style={[styles.quantityBadge, { backgroundColor: getQuantityColor(item.quantity) }]}>
            <Text style={styles.quantityText}>{item.quantity}</Text>
          </View>
        </View>

        <View style={styles.itemDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="barcode-outline" size={20} color="#666" />
            <Text style={styles.detailLabel}>SKU:</Text>
            <Text style={styles.detailValue}>{item.sku || 'N/A'}</Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={20} color="#666" />
            <Text style={styles.detailLabel}>Location:</Text>
            <Text style={styles.detailValue}>{item.location || 'N/A'}</Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={20} color="#666" />
            <Text style={styles.detailLabel}>Added:</Text>
            <Text style={styles.detailValue}>{formatDate(item.created_at)}</Text>
          </View>

          {item.description && (
            <View style={styles.descriptionContainer}>
              <Text style={styles.descriptionLabel}>Description:</Text>
              <Text style={styles.descriptionText}>{item.description}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.stockInButton]}
          onPress={() => handleStockMovement('in')}
        >
          <Ionicons name="add-circle-outline" size={24} color="#fff" />
          <Text style={styles.actionButtonText}>Stock In</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.stockOutButton]}
          onPress={() => handleStockMovement('out')}
        >
          <Ionicons name="remove-circle-outline" size={24} color="#fff" />
          <Text style={styles.actionButtonText}>Stock Out</Text>
        </TouchableOpacity>
      </View>

      {/* Stock Movement History */}
      <View style={styles.historyContainer}>
        <Text style={styles.historyTitle}>Movement History</Text>
        {stockLogs.length === 0 ? (
          <View style={styles.emptyHistory}>
            <Ionicons name="time-outline" size={48} color="#ccc" />
            <Text style={styles.emptyHistoryText}>No movement history</Text>
          </View>
        ) : (
          <FlatList
            data={stockLogs}
            renderItem={renderStockLogItem}
            keyExtractor={(log) => log.id!.toString()}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </ScrollView>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  errorText: {
    fontSize: 18,
    color: '#666',
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  itemName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  quantityBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 12,
  },
  quantityText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  itemDetails: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    minWidth: 80,
  },
  detailValue: {
    fontSize: 16,
    color: '#666',
    flex: 1,
  },
  descriptionContainer: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  descriptionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  actionContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
    gap: 8,
  },
  stockInButton: {
    backgroundColor: '#34C759',
  },
  stockOutButton: {
    backgroundColor: '#FF3B30',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  historyContainer: {
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
  historyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  logItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  logTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logType: {
    fontSize: 16,
    fontWeight: '600',
  },
  logQuantity: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  logNote: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    marginLeft: 28,
  },
  logTime: {
    fontSize: 12,
    color: '#999',
    marginLeft: 28,
  },
  emptyHistory: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyHistoryText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
  },
});
