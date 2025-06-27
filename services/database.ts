import * as SQLite from 'expo-sqlite';

export interface Item {
  id?: number;
  name: string;
  sku: string;
  quantity: number;
  location: string;
  description: string;
  created_at: string;
}

export interface StockLog {
  id?: number;
  item_id: number;
  type: 'in' | 'out';
  quantity: number;
  note: string;
  timestamp: string;
  item_name?: string; // Optional field for joined queries
}

export interface DashboardStats {
  totalItems: number;
  totalQuantity: number;
  recentLogs: StockLog[];
}

class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;
  private isInitialized: boolean = false;

  async init(): Promise<void> {
    try {
      if (this.isInitialized && this.db) {
        console.log('Database already initialized');
        return;
      }

      console.log('Initializing database...');
      this.db = await SQLite.openDatabaseAsync('warehouse.db');

      if (!this.db) {
        throw new Error('Failed to open database');
      }

      await this.createTables();
      this.isInitialized = true;
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Database initialization failed:', error);
      this.db = null;
      this.isInitialized = false;
      throw error;
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized || !this.db) {
      console.log('Database not initialized, initializing now...');
      await this.init();
    }
  }

  public isReady(): boolean {
    return this.isInitialized && this.db !== null;
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      // Create items table
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          sku TEXT,
          quantity INTEGER DEFAULT 0,
          location TEXT,
          description TEXT,
          created_at TEXT
        );
      `);

      // Create stock_logs table
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS stock_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          item_id INTEGER,
          type TEXT CHECK(type IN ('in', 'out')),
          quantity INTEGER DEFAULT 0,
          note TEXT,
          timestamp TEXT,
          FOREIGN KEY (item_id) REFERENCES items(id)
        );
      `);

      console.log('Database tables created successfully');
    } catch (error) {
      console.error('Error creating tables:', error);
      throw error;
    }
  }

  // Items CRUD operations
  async addItem(item: Omit<Item, 'id'>): Promise<number> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    try {
      const result = await this.db.runAsync(
        'INSERT INTO items (name, sku, quantity, location, description, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        [item.name, item.sku || '', item.quantity || 0, item.location || '', item.description || '', item.created_at]
      );

      return result.lastInsertRowId;
    } catch (error) {
      console.error('Error adding item:', error);
      throw error;
    }
  }

  async getAllItems(): Promise<Item[]> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    try {
      const result = await this.db.getAllAsync('SELECT * FROM items ORDER BY created_at DESC');
      return result as Item[];
    } catch (error) {
      console.error('Error getting all items:', error);
      throw error;
    }
  }

  async getItemById(id: number): Promise<Item | null> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    try {
      const result = await this.db.getFirstAsync('SELECT * FROM items WHERE id = ?', [id]);
      return result as Item | null;
    } catch (error) {
      console.error('Error getting item by id:', error);
      throw error;
    }
  }

  async updateItemQuantity(id: number, newQuantity: number): Promise<void> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.runAsync('UPDATE items SET quantity = ? WHERE id = ?', [newQuantity, id]);
    } catch (error) {
      console.error('Error updating item quantity:', error);
      throw error;
    }
  }

  async deleteItem(id: number): Promise<void> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.runAsync('DELETE FROM items WHERE id = ?', [id]);
    } catch (error) {
      console.error('Error deleting item:', error);
      throw error;
    }
  }

  // Stock logs operations
  async addStockLog(log: Omit<StockLog, 'id'>): Promise<number> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    try {
      const result = await this.db.runAsync(
        'INSERT INTO stock_logs (item_id, type, quantity, note, timestamp) VALUES (?, ?, ?, ?, ?)',
        [log.item_id, log.type, log.quantity || 0, log.note || '', log.timestamp]
      );

      return result.lastInsertRowId;
    } catch (error) {
      console.error('Error adding stock log:', error);
      throw error;
    }
  }

  async getStockLogsByItemId(itemId: number): Promise<StockLog[]> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getAllAsync(
      'SELECT * FROM stock_logs WHERE item_id = ? ORDER BY timestamp DESC',
      [itemId]
    );
    return result as StockLog[];
  }

  async getRecentStockLogs(limit: number = 5): Promise<StockLog[]> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getAllAsync(
      'SELECT sl.*, i.name as item_name FROM stock_logs sl JOIN items i ON sl.item_id = i.id ORDER BY sl.timestamp DESC LIMIT ?',
      [limit]
    );
    return result as StockLog[];
  }

  // Dashboard statistics
  async getDashboardStats(): Promise<DashboardStats> {
    await this.ensureInitialized();
    if (!this.db) throw new Error('Database not initialized');

    try {
      const totalItemsResult = await this.db.getFirstAsync('SELECT COUNT(*) as count FROM items');
      const totalQuantityResult = await this.db.getFirstAsync('SELECT COALESCE(SUM(quantity), 0) as total FROM items');
      const recentLogs = await this.getRecentStockLogs(5);

      return {
        totalItems: (totalItemsResult as any)?.count || 0,
        totalQuantity: (totalQuantityResult as any)?.total || 0,
        recentLogs
      };
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      throw error;
    }
  }

  // Stock movement operations
  async processStockMovement(itemId: number, type: 'in' | 'out', quantity: number, note: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const item = await this.getItemById(itemId);
    if (!item) throw new Error('Item not found');

    const newQuantity = type === 'in' 
      ? item.quantity + quantity 
      : Math.max(0, item.quantity - quantity);

    // Update item quantity
    await this.updateItemQuantity(itemId, newQuantity);

    // Add stock log
    await this.addStockLog({
      item_id: itemId,
      type,
      quantity,
      note,
      timestamp: new Date().toISOString()
    });
  }
}

export const databaseService = new DatabaseService();
