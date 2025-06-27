# 📦 Warehouse Manager

A complete offline warehouse management mobile app built with React Native and Expo.

## Features

- **Dashboard**: View total items, total quantity, and recent stock movements
- **Inventory Management**: Browse all items with search functionality
- **Add Items**: Add new inventory items with details
- **Item Details**: View detailed item information and movement history
- **Stock Movement**: Track stock in/out operations with notes
- **Offline Storage**: All data stored locally using SQLite

## Tech Stack

- React Native with Expo
- SQLite via `expo-sqlite`
- React Navigation (Bottom Tabs + Stack)
- TypeScript
- Pure React Native StyleSheet API (no external styling libraries)

## Database Schema

### Items Table
```sql
CREATE TABLE items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  sku TEXT,
  quantity INTEGER,
  location TEXT,
  description TEXT,
  created_at TEXT
);
```

### Stock Logs Table
```sql
CREATE TABLE stock_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id INTEGER,
  type TEXT CHECK(type IN ('in', 'out')),
  quantity INTEGER,
  note TEXT,
  timestamp TEXT,
  FOREIGN KEY (item_id) REFERENCES items(id)
);
```

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the development server**:
   ```bash
   npm start
   ```

3. **Run on device/simulator**:
   - For iOS: `npm run ios`
   - For Android: `npm run android`
   - For Web: `npm run web`

## App Structure

```
├── App.tsx                 # Main app component with database initialization
├── navigation/
│   └── AppNavigator.tsx    # Navigation configuration
├── screens/
│   ├── DashboardScreen.tsx     # Dashboard with stats and recent movements
│   ├── InventoryScreen.tsx     # Item list with search
│   ├── AddItemScreen.tsx       # Add new item form
│   ├── ItemDetailScreen.tsx    # Item details and movement history
│   └── StockMovementScreen.tsx # Stock in/out operations
├── services/
│   └── database.ts         # SQLite database service
└── utils/
    └── sampleData.ts       # Sample data for testing
```

## Sample Data

The app automatically adds sample data on first launch including:
- 6 sample inventory items
- Sample stock movement history
- Various item categories and locations

## Features Overview

### Dashboard
- Total items count
- Total quantity across all items
- Recent 5 stock movements
- Pull-to-refresh functionality

### Inventory
- Searchable item list
- Color-coded quantity indicators (red: 0, orange: <10, green: ≥10)
- Item details preview
- Tap to view full item details

### Add Item
- Form validation
- Required fields: name, quantity
- Optional fields: SKU, location, description
- Clear form functionality

### Item Detail
- Complete item information
- Stock in/out buttons
- Movement history
- Quantity color coding

### Stock Movement
- Separate screens for stock in/out
- Quantity validation
- Preview of new stock level
- Optional notes
- Prevents negative stock

## Offline Functionality

- All data stored locally in SQLite
- No internet connection required
- Data persists between app sessions
- Instant app startup and navigation
