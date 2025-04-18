import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isToday, isYesterday, isWithinInterval, subDays } from 'date-fns';
import HeadNav from '../header/HeadNav';
import BASE_URL from '../BaseUrl';

const LostAndFoundScreen = ({ navigation }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLostItems = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        const res = await fetch(`${BASE_URL}/api/posts/type/found`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
    
        if (!data.posts || !Array.isArray(data.posts)) {
          throw new Error("Invalid data format: expected { posts: [...] }");
        }
    
        const parsedData = data.posts.map(item => ({
          ...item,
          foundDate: item.foundDate ? new Date(item.foundDate) : null,
        }));
    
    
        const updatedItems = await Promise.all(parsedData.map(async (item) => {
          const claimRes = await fetch(`${BASE_URL}/api/messages/conversations/found/${item.id}/claim`, {
            headers: { Authorization: `Bearer ${token}` },
          });
    
          const claimData = await claimRes.json();
          item.claimStatus = claimData?.approved !== null ? claimData.approved : "pending"; 
          return item;
        }));
    
        const unclaimedItems = updatedItems.filter(item => item.status !== 'Claimed');
        setItems(unclaimedItems);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching lost posts:", error);
        setLoading(false);
      }
    };

    fetchLostItems();
  }, []);

  const categorizePosts = () => {
    const today = [];
    const yesterday = [];
    const earlierThisWeek = [];
    const earlier = [];

    items.forEach(item => {
      if (!item.foundDate) return;
      const date = new Date(item.foundDate);

      if (isToday(date)) {
        today.push(item);
      } else if (isYesterday(date)) {
        yesterday.push(item);
      } else if (isWithinInterval(date, { start: subDays(new Date(), 7), end: new Date() })) {
        earlierThisWeek.push(item);
      } else {
        earlier.push(item); 
      }
    });

    return { today, yesterday, earlierThisWeek, earlier };
  };

  const { today, yesterday, earlierThisWeek, earlier } = categorizePosts();

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Waiting To Be Claimed':
        return { color: 'green' };  
      case 'Pending':
        return { color: 'orange' }; 
      case 'Returned':
        return { color: 'grey' };  
      default:
        return { color: 'black' }; 
    }
  };

  const updatePostStatus = async (postId, newStatus) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`${BASE_URL}/api/posts/status/${postId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
  
      const result = await response.json();
      if (response.ok) {
        console.log('Status updated to:', result.status);
      } else {
        console.error('Failed to update status:', result.error);
      }
    } catch (error) {
      console.error('Error updating post status:', error);
    }
  };

  const renderPostCard = ({ item }) => {
    return (
      <TouchableOpacity
        style={styles.postCard}
        onPress={() => navigation.navigate('PostDetailLost', { item, postId: item.id, otherUserId: item.userId, items })} 
      >
        <Image
          source={{ uri: item.images?.[0] || 'https://via.placeholder.com/150' }}
          style={styles.postImage}
        />
        <Text style={styles.postTitle}>{item.title || 'Untitled Post'}</Text>
       <Text style={[styles.statusText, getStatusStyle(item.status)]}>{item.status}</Text>
      </TouchableOpacity>
    );
  };

  const renderCategorySection = (title, data) => {
    if (!Array.isArray(data)) return null;

    return (
      <View style={styles.categoryContainer}>
        <View style={styles.categoryHeader}>
          <Text style={styles.categoryTitle}>{title}</Text>
          {data.length > 4 && (
            <TouchableOpacity onPress={() => navigation.navigate('CategoryList', { category: 'found' })}>
              <Text style={styles.viewMore}>View More →</Text>
            </TouchableOpacity>
          )}
        </View>

        {data.length > 0 ? (
          <FlatList
            data={data}
            renderItem={renderPostCard}
            keyExtractor={item => item.id}
            horizontal
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
      <HeadNav navigation={navigation} currentScreen="LostAndFoundScreen" />

      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <View>
          {renderCategorySection('Items found TODAY:', today)}
          <View style={styles.spaceBetweenSections} />
          {renderCategorySection('Items found YESTERDAY:', yesterday)}
          <View style={styles.spaceBetweenSections} />
          {renderCategorySection('Items found EARLIER THIS WEEK:', earlierThisWeek)}
          <View style={styles.spaceBetweenSections} />
          {renderCategorySection('Items found EARLIER:', earlier)}
        </View>
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
    paddingHorizontal: 16,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: "#FFF",
  },
  viewMore: {
    fontSize: 14,
    color: '#1E90FF',
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
    width: 100,
    height: 100,
    borderRadius: 10,
    marginBottom: 5,
  },
  postTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  location: {
    fontSize: 12,
    color: '#008000',
    fontWeight: 'bold',
  },
  likes: {
    fontSize: 12,
    color: '#FF0000',
    marginTop: 5,
  },
  noItemsText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#888',
    marginTop: 10,
  },
  spaceBetweenSections: {
    height: 20,
  },
});

export default LostAndFoundScreen;
