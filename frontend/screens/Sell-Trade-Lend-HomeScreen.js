import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Image,
  ScrollView
} from 'react-native';
import HeadNav from '../header/HeadNav';
import { firestore } from '../firebaseConfig';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { FontAwesome } from '@expo/vector-icons';
import BASE_URL from '../BaseUrl';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

const SellTradeLendScreen = ({ navigation }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favoritePostIds, setFavoritePostIds] = useState([]);
  const [favoriteCounts, setFavoriteCounts] = useState({});
  const [lendStartDate, setLendStartDate] = useState(new Date());
  const [lendEndDate, setLendEndDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const fetchFavorites = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        console.warn("⚠️ No user token found");
        return;
      }
  
      const res = await fetch(`${BASE_URL}/api/favorites`, {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      const data = await res.json();
 
  
      if (!res.ok) {
        setFavoritePostIds([]);
        return;
      }
  
      if (!Array.isArray(data)) {
        setFavoritePostIds([]);
        return;
      }
  
      setFavoritePostIds(data);
  
      const counts = {};
      setFavoriteCounts(counts);
    } catch (err) {
      console.error('❌ [Favorites] Failed to fetch favorites:', err);
      setFavoritePostIds([]);
    }
  };

  useEffect(() => {
    const fetchInitialPosts = async (typeOfPost) => {
      try {
        const response = await fetch(`${BASE_URL}/api/posts/type/${typeOfPost}`);
        const data = await response.json();

        if (!response.ok || !Array.isArray(data.posts)) return [];

        return data.posts.map((post) => ({ ...post, typeOfPost }));
      } catch (error) {
        console.error(`Error fetching ${typeOfPost} posts:`, error);
        return [];
      }
    };

    const loadPostsAndListen = async () => {
      setLoading(true);
      const types = ['sell', 'trade', 'lend'];
      let allItems = [];

      for (const type of types) {
        const fetched = await fetchInitialPosts(type);
        allItems = [...allItems, ...fetched];
      }

      const sortedItems = allItems.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );

      setItems(sortedItems);
      setLoading(false);

      types.forEach((type) => {
        const q = query(collection(firestore, 'posts'), where('typeOfPost', '==', type));
        onSnapshot(q, (snapshot) => {
          const updated = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          setItems((prev) => {
            const withoutType = prev.filter((item) => item.typeOfPost !== type);
            const activeOnly = updated.filter((item) => !isFinalStatus(item.typeOfPost, item.status));
            return [...withoutType, ...activeOnly];
          });
        });
      });
    };

    loadPostsAndListen();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchFavorites(); 
    }, [])
  );

  const isFinalStatus = (typeOfPost, status) => {
    const finalStates = {
      sell: 'Sold',
      lend: 'Unavailable',
      trade: 'Unavailable',
    };
    return finalStates[typeOfPost] === status;
  };

  const toggleFavorite = async (postId) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const isFavorited = favoritePostIds.includes(postId);

      const url = `${BASE_URL}/api/favorites/${postId}`;
      const method = isFavorited ? 'DELETE' : 'POST';
      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        ...(method === 'POST' ? { body: JSON.stringify({ postId }) } : {}),
      });

      if (res.ok) {
        setFavoritePostIds((prev) =>
          isFavorited ? prev.filter((id) => id !== postId) : [...prev, postId]
        );
        setFavoriteCounts((prev) => ({
          ...prev,
          [postId]: isFavorited
            ? (prev[postId] || 1) - 1
            : (prev[postId] || 0) + 1,
        }));
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
    }
  };

  const categorizedItems = useMemo(
    () => ({
      sell: items.filter((item) => item.typeOfPost === 'sell'),
      trade: items.filter((item) => item.typeOfPost === 'trade'),
      lend: items.filter((item) => item.typeOfPost === 'lend'),
    }),
    [items]
  );

  const renderPostCard = useCallback(
    ({ item }) => {
      return (
        <TouchableOpacity
          style={styles.postCard}
          onPress={() => navigation.navigate('PostDetailPage', { item })}
        >
          <Image
            source={{ uri: item.images?.[0] || 'https://via.placeholder.com/150' }}
            style={styles.postImage}
          />
          <Text style={styles.postTitle}>{item.title || 'Untitled Post'}</Text>
          <Text style={styles.postPrice}>{getDisplayInfo(item)}</Text>
          <Text style={[styles.statusText, getStatusStyle(item.status)]}>{item.status}</Text>

          <View style={styles.heartContainer}>
            <TouchableOpacity onPress={() => toggleFavorite(item.id)}>
              <FontAwesome
                name={favoritePostIds.includes(item.id) ? 'heart' : 'heart-o'}
                size={20}
                color={favoritePostIds.includes(item.id) ? 'red' : '#444'}
              />
            </TouchableOpacity>
            <Text style={styles.heartCount}>{favoriteCounts[item.id] || 0}</Text>
          </View>
        </TouchableOpacity>
      );
    },
    [favoritePostIds, favoriteCounts]
  );

  const getDisplayInfo = (item) => {
    switch (item.typeOfPost) {
      case 'sell':
        return `$${item.price || 'N/A'}`;
        case 'lend':
      return item.lendStartDate && item.lendEndDate
        ? `Lend: ${new Date(item.lendStartDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })} → ${new Date(item.lendEndDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}`
        : 'Lending Period: N/A';
      case 'trade':
        return `Looking for: ${item.tradeInterest || 'N/A'}`;
      default:
        return 'Info unavailable';
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'For Sale':
      case 'Available':
        return styles.statusAvailable;
      case 'Pending':
        return styles.statusPending;
      case 'Sold':
      case 'Unavailable':
      case 'returned':
        return styles.statusFinal;
      default:
        return styles.statusDefault;
    }
  };

  const renderCategorySection = (title, type) => {
    const categoryItems = categorizedItems[type];
    const showViewMore = categoryItems.length > 4;

    const itemsToRender = showViewMore
      ? [...categoryItems.slice(0, 4), { id: 'viewMore' }]
      : categoryItems;

    return (
      <View style={styles.categoryContainer}>
        <Text style={styles.categoryTitle}>{title}</Text>

        {itemsToRender.length > 0 ? (
          <FlatList
            data={itemsToRender}
            horizontal
            renderItem={({ item }) =>
              item.id === 'viewMore' ? (
                <TouchableOpacity
                  style={styles.viewMoreCircle}
                  onPress={() => navigation.navigate('ItemList', { typeOfPost: type })}
                >
                  <Text style={styles.viewMoreText}>›</Text>
                </TouchableOpacity>
              ) : (
                renderPostCard({ item })
              )
            }
            keyExtractor={(item, index) => item.id || `key-${index}`}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 10 }}
          />
        ) : (
          <Text style={styles.noItemsText}>No posts available.</Text>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <HeadNav navigation={navigation} currentScreen="SellTradeLendScreen" />
      {loading ? (
        <ActivityIndicator size="large" color="#fff" />
      ) : (
        <ScrollView>
          {renderCategorySection('Items for Sale:', 'sell')}
          <View style={styles.spaceBetweenSections} />
          {renderCategorySection('Items for Lending:', 'lend')}
          <View style={styles.spaceBetweenSections} />
          {renderCategorySection('Items for Trading:', 'trade')}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1D4976',
  },
  categoryContainer: {
    marginVertical: 10,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 16,
    marginBottom: 6,
  },
  postCard: {
    width: 150,
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    marginRight: 10,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postImage: {
    width: '100%',
    height: 100,
    borderRadius: 10,
    marginBottom: 5,
    resizeMode: 'cover',
  },
  postTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
  },
  postPrice: {
    fontSize: 12,
    color: '#008000',
    fontWeight: 'bold',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    overflow: 'hidden',
  },
  statusAvailable: {
    backgroundColor: '#4CAF50',
    color: '#fff',
  },
  statusPending: {
    backgroundColor: '#FFD700',
    color: '#000',
  },
  statusDefault: {
    backgroundColor: '#888',
    color: '#fff',
  },
  heartContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  heartCount: {
    marginLeft: 6,
    fontSize: 12,
    color: '#333',
  },
  viewMoreCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    marginTop: 50,
    marginLeft: 10,
  },
  viewMoreText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
  },
  noItemsText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#888',
    marginTop: 10,
    textAlign: 'center',
  },
  spaceBetweenSections: {
    height: 20,
  },
});

export default SellTradeLendScreen;
