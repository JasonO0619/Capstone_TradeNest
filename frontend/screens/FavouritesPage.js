import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, ActivityIndicator,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BASE_URL from '../BaseUrl';

export default function FavouritesPage({ navigation }) {
  const [selectedTab, setSelectedTab] = useState('Post');
  const [favoritePosts, setFavoritePosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFavoritePosts();
  }, []);

  const fetchFavoritePosts = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');


      const res = await fetch(`${BASE_URL}/api/favorites`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const postIds = await res.json();


      const fetchedPosts = await Promise.all(
        postIds.map(async (postId) => {
          const res = await fetch(`${BASE_URL}/api/posts/${postId}`);
          return await res.json();
        })
      );

      setFavoritePosts(fetchedPosts);
    } catch (err) {
      console.error('Failed to load favorite posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (postId) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      await fetch(`${BASE_URL}/api/favorites/${postId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });


      setFavoritePosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (err) {
      console.error('Error removing favorite:', err);
    }
  };

  const items = selectedTab === 'Post' ? favoritePosts : []; // update this if you add user favorites

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <FontAwesome name="arrow-left" size={25} color="#fff" />      
        </TouchableOpacity>
      <View style={styles.header}>
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
      </View>

<ScrollView style={styles.listContainer}>
  {loading ? (
    <ActivityIndicator size="large" color="#fff" />
  ) : items.length === 0 ? (
    <Text style={{ color: '#fff', textAlign: 'center', marginTop: 20 }}>No favorites found.</Text>
  ) : (
    items.map((item) => (
      <TouchableOpacity
        key={item.id}
        style={styles.listItem}
        onPress={() => navigation.navigate('PostDetailPage', { item })}
      >
        <Image
          source={{ uri: item.images?.[0] || 'https://via.placeholder.com/150' }}
          style={styles.imagePlaceholder}
        />
        <Text style={styles.itemTitle}>{item.title}</Text>
        <TouchableOpacity style={styles.removeButton} onPress={() => removeFavorite(item.id)}>
          <Text style={styles.removeButtonText}>Remove</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    ))
  )}
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
    color: '#fff',
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
