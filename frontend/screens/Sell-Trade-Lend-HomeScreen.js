import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { firestore } from '../firebaseConfig';
import HeadNav from '../header/HeadNav';

const SellTradeLendScreen = ({ navigation }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const categories = ["sell", "trade", "lend"]; 
    let unsubscribeFns = [];
  
    const fetchItems = () => {
      try {
        categories.forEach((category) => {
          const q = query(
            collection(firestore, `posts/${category}/items`), 
            orderBy("createdAt", "desc") 
          );
  
          const unsubscribe = onSnapshot(q, (snapshot) => {
            let categoryItems = snapshot.docs.map((doc) => ({
              id: doc.id,
              category, 
              ...doc.data(),
            }));
  
            
            setItems((prevItems) => {
              let filteredItems = prevItems.filter((item) => item.category !== category);
              return [...filteredItems, ...categoryItems];
            });
  
            setLoading(false);
          });
  
          unsubscribeFns.push(unsubscribe);
        });
      } catch (error) {
        console.error("Error fetching items:", error);
        setLoading(false);
      }
    };
  
    fetchItems();
  
    return () => unsubscribeFns.forEach((unsubscribe) => unsubscribe()); 
  }, []);


  const renderPostCard = ({ item }) => (
    <TouchableOpacity
      style={styles.postCard}
      onPress={() => navigation.navigate('PostDetailPage', { item })}
    >
      <Image
        source={{ uri: item.images && item.images.length > 0 ? item.images[0] : 'https://via.placeholder.com/150' }}
        style={styles.postImage}
      />
      <Text style={styles.postTitle}>{item.title || 'Untitled Post'}</Text>
      <Text style={styles.postPrice}>${item.price || 'N/A'}</Text>
      <Text style={styles.likes}>❤️ {item.likes || '0'}</Text>
    </TouchableOpacity>
  );

  const renderCategorySection = (categoryTitle, categoryFilter) => {
    const filteredItems = items.filter((item) => item.category === categoryFilter);

    return (
      <View style={styles.categoryContainer}>
        <View style={styles.categoryHeader}>
          <Text style={styles.categoryTitle}>{categoryTitle || 'Unknown Category'}</Text>
          {filteredItems.length > 4 && (
            <TouchableOpacity onPress={() => navigation.navigate('CategoryList', { category: categoryFilter })}>
              <Text style={styles.viewMore}>View More →</Text>
            </TouchableOpacity>
          )}
        </View>

        {filteredItems.length > 0 ? (
        <FlatList
          data={filteredItems.slice(0, 4)}
          renderItem={renderPostCard}
          keyExtractor={(item) => item.id}
          numColumns={2}  
          columnWrapperStyle={{ justifyContent: "space-between" }}
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
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <View>
          {renderCategorySection('Items for sale:', 'sell')}
          <View style={styles.spaceBetweenSections} />
          {renderCategorySection('Items for lending:', 'lend')}
          <View style={styles.spaceBetweenSections} />
          {renderCategorySection('Items for trading:', 'trade')}
        </View>
      )}
    </View>
  );
};


// 🔹 Styles
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
    color: "#fff",
  },
  viewMore: {
    fontSize: 14,
    color: '#1E90FF',
  },
  postCard: {
    width: "48%",  // ✅ Ensures two cards per row with spacing
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    marginBottom: 10,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postImage: {
    width: "100%",  // ✅ Ensures image fits the card width
    height: 100,
    borderRadius: 10,
    marginBottom: 5,
    resizeMode: "cover",
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
    textAlign: "center",
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",  // ✅ Ensures spacing between columns
  },
});


export default SellTradeLendScreen;
