import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { accountsApi } from '../api/client';
import { Account } from '../api/types';

const AccountsScreen = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const data = await accountsApi.list();
        setAccounts(data);
      } catch (err) {
        console.error('Failed to fetch accounts', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAccounts();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={accounts}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.accountCard}>
            <View>
              <Text style={styles.accountName}>{item.name}</Text>
              <Text style={styles.accountType}>{item.type}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.accountBalance}>₹{item.current_balance}</Text>
              <Text style={styles.activeStatus}>{item.is_active ? 'Active' : 'Inactive'}</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 10,
  },
  accountCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: '#eee',
    elevation: 1, // for shadow on android
    shadowColor: '#000', // for shadow on ios
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  accountName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  accountType: {
    fontSize: 14,
    color: '#666',
  },
  accountBalance: {
    fontSize: 18,
    fontWeight: '600',
    color: '#28a745',
  },
  activeStatus: {
    fontSize: 12,
    color: '#999',
  },
});

export default AccountsScreen;
