import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Image, Alert } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { auth, firestore } from '../firebaseConfig';
import { collection, query, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore';

export default function MyListPage({ navigation }) {
  const [category, setCategory] = useState('sell'); 
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const userId = auth.currentUser?.uid; 

  
  useEffect(() => {
    if (!userId) return;

    setLoading(true);
    const q = query(collection(firestore, `posts/${category}/items`), where("userId", "==", userId));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedItems = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setItems(fetchedItems);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [category]);


  const handleDelete = async (postId) => {
    Alert.alert("Confirm Delete", "Are you sure you want to delete this post?", [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Delete", 
        onPress: async () => {
          try {
            await deleteDoc(doc(firestore, `posts/${category}/items`, postId));
            Alert.alert("Success", "Post deleted successfully!");
          } catch (error) {
            Alert.alert("Error", "Could not delete post.");
            console.error("Error deleting post:", error);
          }
        },
        style: "destructive"
      },
    ]);
  };

  return (
    <View style={styles.container}>
     
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <FontAwesome name="arrow-left" size={24} color="#000" />
          <Text style={styles.backButtonText}>Go back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>My List</Text>
        <View style={{ width: 24 }} /> 
      </View>

     
      <View style={styles.tabContainer}>
        {['sell', 'lend', 'trade', 'found'].map((tab) => (
          <TouchableOpacity key={tab} onPress={() => setCategory(tab)} style={styles.tabItem}>
            <Text style={[styles.tabText, category === tab && styles.activeTabText]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#FFF" />
      ) : (
        <ScrollView style={styles.listContainer}>
          {items.length > 0 ? (
            items.map((item) => (
              <TouchableOpacity 
                key={item.id} 
                style={styles.listItem}
                onPress={() => navigation.navigate('PostDetailPage', { item })}
              >
                <Image
                  source={{ uri: item.images && item.images.length > 0 ? item.images[0] : 'https://via.placeholder.com/150' }}
                  style={styles.itemImage}
                />
                <Text style={styles.itemTitle}>{item.title || "Untitled Post"}</Text>
                <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(item.id)}>
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.noItemsText}>No posts available.</Text>
          )}
        </ScrollView>
      )}
    </View>
  );
}

// 🔹 Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1D4976',
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
  tabText: {
    fontSize: 16,
    color: '#fff',
  },
  activeTabText: {
    fontWeight: 'bold',
    textDecorationLine: 'underline',
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
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: '#b2dfdb',
  },
  itemTitle: {
    flex: 1,
    marginLeft: 20,
    fontSize: 18,
    color: '#fff',
  },
  deleteButton: {
    backgroundColor: '#f28b82',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  noItemsText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#888',
    marginTop: 20,
    textAlign: 'center',
  },
});


