import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Alert } from 'react-native';
import AppNavigator from './navigation/AppNavigator';
import { databaseService } from './services/database';
import { addSampleData } from './utils/sampleData';

export default function App() {
  const [isDbInitialized, setIsDbInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      try {
        console.log(`Database initialization attempt ${retryCount + 1}/${maxRetries}`);

        // Set a timeout for initialization
        const initPromise = databaseService.init();
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Initialization timeout')), 10000)
        );

        // Initialize database with timeout
        await Promise.race([initPromise, timeoutPromise]);

        // Verify database is ready
        if (databaseService.isReady()) {
          setIsDbInitialized(true);
          setIsLoading(false);
          console.log('Database initialized successfully');

          // Add sample data in background (non-blocking)
          setTimeout(() => {
            addSampleData().catch(error => {
              console.error('Error adding sample data:', error);
            });
          }, 500);
          return;
        } else {
          throw new Error('Database not ready after initialization');
        }
      } catch (error) {
        retryCount++;
        console.error(`Database initialization attempt ${retryCount} failed:`, error);

        if (retryCount >= maxRetries) {
          Alert.alert(
            'Database Error',
            'Failed to initialize the database after multiple attempts. Please restart the app.',
            [{ text: 'OK' }]
          );
          setIsLoading(false);
          return;
        }

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>🏭</Text>
        <Text style={styles.loadingSubtext}>Starting Warehouse Manager</Text>
        <StatusBar style="auto" />
      </View>
    );
  }

  if (!isDbInitialized) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to initialize database</Text>
        <Text style={styles.errorSubtext}>Please restart the app</Text>
        <StatusBar style="auto" />
      </View>
    );
  }

  return (
    <>
      <AppNavigator />
      <StatusBar style="auto" />
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 48,
    marginBottom: 16,
  },
  loadingSubtext: {
    fontSize: 18,
    color: '#333',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 20,
    color: '#FF3B30',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
