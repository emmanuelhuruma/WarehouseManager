import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { databaseService, DashboardStats, StockLog } from '../services/database';
import { TabParamList, RootStackParamList } from '../navigation/AppNavigator';

type NavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList>,
  NativeStackNavigationProp<RootStackParamList>
>;

export default function DashboardScreen() {
  const [stats, setStats] = useState<DashboardStats>({
    totalItems: 0,
    totalQuantity: 0,
    recentLogs: []
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation<NavigationProp>();

  const loadDashboardData = async () => {
    try {
      const dashboardStats = await databaseService.getDashboardStats();
      setStats(dashboardStats);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleTotalItemsPress = () => {
    navigation.navigate('Inventory');
  };

  const handleTotalQuantityPress = () => {
    navigation.navigate('Inventory');
  };

  const handleStockLogPress = (log: StockLog) => {
    if (log.item_id) {
      navigation.navigate('ItemDetail', { itemId: log.item_id });
    }
  };

  const renderStockLogItem = (log: StockLog, index: number) => (
    <TouchableOpacity
      key={index}
      style={styles.logItem}
      onPress={() => handleStockLogPress(log)}
      activeOpacity={0.7}
    >
      <View style={styles.logHeader}>
        <Text style={styles.logType}>
          {log.type === 'in' ? '📦 Stock In' : '📤 Stock Out'}
        </Text>
        <Text style={styles.logQuantity}>
          {log.type === 'in' ? '+' : '-'}{log.quantity}
        </Text>
      </View>
      {(log as any).item_name && (
        <Text style={styles.logItemName}>{(log as any).item_name}</Text>
      )}
      <Text style={styles.logNote}>{log.note || 'No note'}</Text>
      <Text style={styles.logTime}>{formatDate(log.timestamp)}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading dashboard...</Text>
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
      <View style={styles.statsContainer}>
        <TouchableOpacity
          style={styles.statCard}
          onPress={handleTotalItemsPress}
          activeOpacity={0.7}
        >
          <Text style={styles.statNumber}>{stats.totalItems}</Text>
          <Text style={styles.statLabel}>Total Items</Text>
          <Text style={styles.tapHint}>Tap to view inventory</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.statCard}
          onPress={handleTotalQuantityPress}
          activeOpacity={0.7}
        >
          <Text style={styles.statNumber}>{stats.totalQuantity}</Text>
          <Text style={styles.statLabel}>Total Quantity</Text>
          <Text style={styles.tapHint}>Tap to view inventory</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.recentLogsContainer}>
        <Text style={styles.sectionTitle}>Recent Stock Movements</Text>
        {stats.recentLogs.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No recent stock movements</Text>
          </View>
        ) : (
          stats.recentLogs.map((log, index) => renderStockLogItem(log, index))
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
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 4,
  },
  tapHint: {
    fontSize: 12,
    color: '#007AFF',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  recentLogsContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  logItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  logType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  logQuantity: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  logItemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  logNote: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  logTime: {
    fontSize: 12,
    color: '#999',
  },
  emptyState: {
    backgroundColor: '#fff',
    padding: 32,
    borderRadius: 8,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
