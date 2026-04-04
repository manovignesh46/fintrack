import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Button } from 'react-native';
import { accountsApi, summaryApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Account, SummaryResponse } from '../api/types';

const DashboardScreen = ({ navigation }: any) => {
  const { logout, user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [accs, summ] = await Promise.all([
        accountsApi.list(),
        summaryApi.get(new Date().toISOString().slice(0, 7)), // Current month YYYY-MM
      ]);
      setAccounts(accs);
      setSummary(summ);
    } catch (err) {
      console.error('Failed to fetch dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
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
      <View style={styles.header}>
        <Text style={styles.welcome}>Welcome, {user?.username}!</Text>
        <Button title="Logout" onPress={logout} />
      </View>

      <Text style={styles.sectionTitle}>Summary</Text>
      {summary?.entities.map(e => (
        <View key={e.entity} style={styles.summaryCard}>
          <Text style={styles.entityName}>{e.entity}</Text>
          <View style={styles.row}>
            <Text>Income: ₹{e.total_income}</Text>
            <Text>Expense: ₹{e.total_expense}</Text>
          </View>
          <Text style={styles.netFlow}>Net: ₹{e.net_flow}</Text>
        </View>
      ))}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Accounts</Text>
        <Button title="See All" onPress={() => navigation.navigate('Accounts')} />
      </View>
      
      <FlatList
        data={accounts.slice(0, 5)}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.accountItem}>
            <Text style={styles.accountName}>{item.name}</Text>
            <Text style={styles.accountBalance}>₹{item.current_balance}</Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  welcome: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  summaryCard: {
    padding: 15,
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  entityName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  netFlow: {
    marginTop: 5,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  accountItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  accountName: {
    fontSize: 16,
  },
  accountBalance: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DashboardScreen;
