import { databaseService } from '../services/database';

export const addSampleData = async () => {
  try {
    // Check if we already have data (fast check)
    const existingItems = await databaseService.getAllItems();
    if (existingItems.length > 0) {
      console.log('Sample data already exists, skipping...');
      return;
    }

    console.log('Adding sample data in background...');

    // Sample items (reduced for faster loading)
    const sampleItems = [
      {
        name: 'Wireless Headphones',
        sku: 'WH-001',
        quantity: 25,
        location: 'A1-B2',
        description: 'Bluetooth headphones',
        created_at: new Date().toISOString(),
      },
      {
        name: 'USB Cable',
        sku: 'USB-002',
        quantity: 50,
        location: 'B1-C1',
        description: 'USB-C charging cable',
        created_at: new Date().toISOString(),
      },
      {
        name: 'Phone Case',
        sku: 'PC-003',
        quantity: 8,
        location: 'C1-D1',
        description: 'Protective phone case',
        created_at: new Date().toISOString(),
      },
      {
        name: 'Laptop Stand',
        sku: 'LS-004',
        quantity: 0,
        location: 'D1-A1',
        description: 'Adjustable laptop stand',
        created_at: new Date().toISOString(),
      },
    ];

    // Add sample items (batch operation for speed)
    const itemIds: number[] = [];
    for (const item of sampleItems) {
      const itemId = await databaseService.addItem(item);
      itemIds.push(itemId);
    }

    // Add some sample stock movements (reduced for speed)
    const sampleMovements = [
      {
        item_id: itemIds[0], // Wireless Headphones
        type: 'in' as const,
        quantity: 10,
        note: 'Initial stock',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      },
      {
        item_id: itemIds[1], // USB Cable
        type: 'out' as const,
        quantity: 5,
        note: 'Customer order',
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      },
    ];

    // Add sample stock movements
    for (const movement of sampleMovements) {
      await databaseService.addStockLog(movement);
    }

    console.log('Sample data added successfully!');
  } catch (error) {
    console.error('Error adding sample data:', error);
  }
};
