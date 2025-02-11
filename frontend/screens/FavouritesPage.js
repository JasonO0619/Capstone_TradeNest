import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

export default function FavouritesPage({ navigation }) {
  const [selectedTab, setSelectedTab] = useState('Post');

  const postData = [
    { id: '1', title: 'Post Item 1' },
    { id: '2', title: 'Post Item 2' },
    { id: '3', title: 'Post Item 3' },
    { id: '4', title: 'Post Item 4' },
  ];

  const userData = [
    { id: '1', title: 'User Item A' },
    { id: '2', title: 'User Item B' },
    { id: '3', title: 'User Item C' },
    { id: '4', title: 'User Item D' },
  ];

  const items = selectedTab === 'Post' ? postData : userData;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <FontAwesome name="arrow-left" size={24} color="#000" />
          <Text style={styles.backButtonText}>Go back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Favourite</Text>
        <View style={{ width: 24 }} /> 
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabItem, selectedTab === 'Post' && styles.activeTabItem]}
          onPress={() => setSelectedTab('Post')}
        >
          <Text style={[styles.tabText, selectedTab === 'Post' && styles.activeTabText]}>Post</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabItem, selectedTab === 'User' && styles.activeTabItem]}
          onPress={() => setSelectedTab('User')}
        >
          <Text style={[styles.tabText, selectedTab === 'User' && styles.activeTabText]}>User</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.listContainer}>
        {items.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.listItem}
            onPress={() => navigation.navigate('PostDetailPage', { item: item})}
          >
            <View style={styles.imagePlaceholder}>
              <FontAwesome name="image" size={50} color="#8e8e93" />
            </View>
            <Text style={styles.itemTitle}>{item.title}</Text>
            <TouchableOpacity style={styles.removeButton}>
              <Text style={styles.removeButtonText}>Remove</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1D4976',
    paddingTop: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    marginLeft: 5,
    fontSize: 16,
    color: '#000',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    flex: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingBottom: 10,
  },
  tabItem: {
    paddingHorizontal: 15,
  },
  activeTabItem: {
    borderBottomWidth: 2,
    borderBottomColor: '#fff',
  },
  tabText: {
    fontSize: 16,
    color: '#fff',
  },
  activeTabText: {
    fontWeight: 'bold',
  },
  listContainer: {
    paddingHorizontal: 20,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4db6ac',
    padding: 10,
    borderRadius: 10,
    marginBottom: 15,
  },
  imagePlaceholder: {
    width: 60,
    height: 60,
    backgroundColor: '#b2dfdb',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  itemTitle: {
    flex: 1,
    marginLeft: 20,
    fontSize: 18,
    color: '#fff',
  },
  removeButton: {
    backgroundColor: '#f28b82',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 14,
  },
});
