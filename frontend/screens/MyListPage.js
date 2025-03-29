import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Image, Alert } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { auth } from '../firebaseConfig';
import BASE_URL from '../BaseUrl';

export default function MyListPage({ navigation }) {
  const [category, setCategory] = useState('sell'); 
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const userId = auth.currentUser?.uid; 

  
  useEffect(() => {
    if (!userId) return;
  
    setLoading(true);
  
    const fetchUserPosts = async () => {
      try {
        const response = await fetch(`${BASE_URL}/api/posts/user/${userId}`);
        const data = await response.json();
  

        const filtered = data.filter(post => post.typeOfPost === category);
        setItems(filtered);
      } catch (error) {
        console.error("Failed to fetch posts", error);
      } finally {
        setLoading(false);
      }
    };
  
    fetchUserPosts();
  }, [category, userId]); // ✅ Make sure `userId` is included in the dependency array

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
       <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                      <FontAwesome name="arrow-left" size={25} color="#fff" left='10' />      
        </TouchableOpacity>
     
      <View style={styles.header}>
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
                <View style={styles.buttonGroup}>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => navigation.navigate('EditPostPage', { item })}
                  >
                    <Text style={styles.editButtonText}>Edit</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(item.id)}>
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
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


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1D4976',
    paddingTop: '10%'
  ,
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
    color: '#fff',
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
  tabText: {
    fontSize: 16,
    color: '#fff',
  },
  activeTabText: {
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 12,
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 10,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
    color: '#000',
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
  buttonGroup: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 8,
  },
  
  editButton: {
    backgroundColor: '#4A90E2',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  
  editButtonText: {
    color: '#fff',
    fontSize: 14,
  },
});


