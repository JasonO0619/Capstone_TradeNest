import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { firestore } from '../firebaseConfig';
import { isToday, isYesterday, isWithinInterval, subDays } from 'date-fns';
import HeadNav from '../header/HeadNav';

const LostAndFoundScreen = ({ navigation }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(firestore, 'posts/lost/items'), 
      orderBy('foundDate', 'desc') 
    );

    const unsubscribe = onSnapshot(q, snapshot => {
      const fetchedItems = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          foundDate: data.foundDate ? data.foundDate.toDate() : null, 
        };
      });
      setItems(fetchedItems);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  
  const categorizePosts = () => {
    const today = [];
    const yesterday = [];
    const earlierThisWeek = [];

    items.forEach(item => {
      if (!item.foundDate) return; 
      const itemDate = item.foundDate;

      if (isToday(itemDate)) {
        today.push(item);
      } else if (isYesterday(itemDate)) {
        yesterday.push(item);
      } else if (isWithinInterval(itemDate, { start: subDays(new Date(), 7), end: new Date() })) {
        earlierThisWeek.push(item);
      }
    });

    return {
      today,
      yesterday,
      earlierThisWeek,
    };
  };

  const { today, yesterday, earlierThisWeek } = categorizePosts();

  
  const renderPostCard = ({ item }) => {
    if (!item) return null; 

    return (
      <TouchableOpacity
        style={styles.postCard}
        onPress={() => navigation.navigate('PostDetailPage', { item })}
      >
        <Image 
         source={{ uri: item.images && item.images.length > 0 ? item.images[0] :  'https://via.placeholder.com/150' }} 
          style={styles.postImage} 
        />
        <Text style={styles.postTitle}>{item.title ? String(item.title) : "Untitled Post"}</Text>
        <Text style={styles.location}>{item.locationFound ? String(item.locationFound) : "Unknown Location"}</Text>
      </TouchableOpacity>
    );
  };

  
  const renderCategorySection = (title, data) => {
    if (!Array.isArray(data)) return null; 

    return (
      <View style={styles.categoryContainer}>
        <View style={styles.categoryHeader}>
          <Text style={styles.categoryTitle}>{title || "Unknown Title"}</Text>
          {data.length > 4 && navigation && (
            <TouchableOpacity onPress={() => navigation.navigate('CategoryList', { category: 'lost' })}>
              <Text style={styles.viewMore}>View More →</Text>
            </TouchableOpacity>
          )}
        </View>

        {data.length > 0 ? (
           <FlatList
                  data={data} 
                  renderItem={renderPostCard}
                  keyExtractor={(item) => item.id}
                  horizontal={true} 
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
    height: 70,
  },
});

export default LostAndFoundScreen;
