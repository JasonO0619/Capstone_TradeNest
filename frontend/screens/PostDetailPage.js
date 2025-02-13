import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ScrollView } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { auth, firestore } from '../firebaseConfig';
import { collection, query, where, doc, getDoc, getDocs } from 'firebase/firestore';

export default function PostDetailPage({ navigation, route }) {
  const { item } = route.params;
  const [postedBy, setPostedBy] = useState('Loading...');
  const [posts, setPosts] = useState([]); 
  const [currentIndex, setCurrentIndex] = useState(0); 
  useEffect(() => {
    const fetchUserData = async () => {
      if (!item.userId) return;

      const currentUser = auth.currentUser;
      if (currentUser && currentUser.uid === item.userId) {
        setPostedBy("You");
      } else {
        try {
          const userRef = doc(firestore, "users", item.userId);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            setPostedBy(userSnap.data().email || "Unknown User");
          } else {
            setPostedBy("Unknown User");
          }
        } catch (error) {
          console.error("Error fetching user email:", error);
          setPostedBy("Error fetching user");
        }
      }
    };

    const fetchPosts = async () => {
      if (!item.formType) return;

      try {
        const q = query(collection(firestore, `posts/${item.formType}/items`)); 
        const querySnapshot = await getDocs(q);
        const postsList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        setPosts(postsList);


        const currentIndex = postsList.findIndex(post => post.id === item.id);
        setCurrentIndex(currentIndex !== -1 ? currentIndex : 0);
      } catch (error) {
        console.error("Error fetching posts:", error);
      }
    };

    fetchUserData();
    fetchPosts();
  }, [item]);

  if (!item) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Item details are unavailable.</Text>
      </View>
    );
  }

 
  const goToPreviousPost = () => {
    if (currentIndex > 0) {
      navigation.navigate("PostDetailPage", { item: posts[currentIndex - 1] });
    }
  };

  const goToNextPost = () => {
    if (currentIndex < posts.length - 1) {
      navigation.navigate("PostDetailPage", { item: posts[currentIndex + 1] });
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <FontAwesome name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.navContainer}>
        <TouchableOpacity onPress={goToPreviousPost} disabled={currentIndex === 0}>
          <FontAwesome name="chevron-left" size={30} color={currentIndex === 0 ? "#ccc" : "#fff"} />
        </TouchableOpacity>
        

        <TouchableOpacity onPress={goToNextPost} disabled={currentIndex === posts.length - 1}>
          <FontAwesome name="chevron-right" size={30} color={currentIndex === posts.length - 1 ? "#ccc" : "#fff"} />
        </TouchableOpacity>
      </View>

      <View style={styles.imageSection}>
        {item.images && item.images.length > 0 ? (
          <Image source={{ uri: item.images[0] }} style={styles.image} />
        ) : (
          <Text style={styles.detailText}>No image available</Text>
        )}
      </View>

      <View style={styles.detailSection}>
        <Text style={styles.detailTitle}>{item.title}</Text>
        <Text style={styles.detailText}>Description: {item.description || "No description provided"}</Text>
        <Text style={styles.detailText}>Category: {item.category}</Text>
        {item.price && <Text style={styles.detailText}>Price: ${item.price}</Text>}
        {item.condition && <Text style={styles.detailText}>Condition: {item.condition}</Text>}
        {item.tradeInterest && <Text style={styles.detailText}>Trade Interest: {item.tradeInterest}</Text>}
        {item.lendingPeriod && <Text style={styles.detailText}>Lending Period: {item.lendingPeriod}</Text>}
        {item.locationFound && <Text style={styles.detailText}>Location Found: {item.locationFound}</Text>}
        {item.currentLocation && <Text style={styles.detailText}>Current Location: {item.currentLocation}</Text>}
        {item.foundDate && (
          <Text style={styles.detailText}>
            Found Date: {item.foundDate.toDate ? item.foundDate.toDate().toDateString() : new Date(item.foundDate).toDateString()}
          </Text>
        )}
        <Text style={styles.detailText}>Posted By: {postedBy}</Text>
      </View>
      
      {postedBy !== "You" && (
        <TouchableOpacity style={styles.contactButton} onPress={() => navigation.navigate("ContactPage")}>
          <Text style={styles.contactButtonText}>Contact</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

// 🔹 Styles
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#1D4976",
    paddingTop: 40,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  header: {
    width: "100%",
    marginBottom: 20,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    width: "100%",
  },
  imageSection: {
    width: "100%",
    alignItems: "center",
    marginBottom: 20,
  },
  image: {
    width: 250,
    height: 250,
    borderRadius: 10,
    resizeMode: "cover",
  },
  navContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "80%",
    marginBottom: 10,
  },
  postIndicator: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "bold",
  },
  detailSection: {
    alignItems: "center",
    width: "100%",
  },
  detailTitle: {
    fontSize: 24,
    color: "#fff",
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  detailText: {
    fontSize: 16,
    color: "#fff",
    marginBottom: 10,
    textAlign: "center",
  },
  contactButton: {
    backgroundColor: "#f28b82",
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: "center",
    width: "50%",
    marginTop: 20,
  },
  contactButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});


