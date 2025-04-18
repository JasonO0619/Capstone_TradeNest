import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ScrollView, Alert, FlatList, Dimensions } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BASE_URL from '../BaseUrl';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import HeadNav from '../header/HeadNav';
import { doc } from 'firebase/firestore';
import { firestore } from '../firebaseConfig';
import { getDoc, updateDoc } from 'firebase/firestore';

export default function PostDetailPage({ navigation, route }) {
  const { item, postId, otherUserId } = route.params;
  const [postedBy, setPostedBy] = useState('Loading...');
  const [posts, setPosts] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isOwnPost, setIsOwnPost] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);
  const [posterPic, setPosterPic] = useState(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const defaultPicUrl = 'https://via.placeholder.com/150';
  const [hasClaim, setHasClaim] = useState(false);
  const [isClaimApproved, setIsClaimApproved] = useState(false);
  const [convoId, setConvoId] = useState(null);
  const isPoster = currentUserId === item.posterId;
  const finalStatuses = ['Sold', 'Traded', 'Borrowed'];


  const handleContactPoster = async () => {
    const token = await AsyncStorage.getItem('userToken');
    const userId = JSON.parse(atob(token.split('.')[1])).user_id;
    const posterId = item.posterId;
  
    try {
      const res = await fetch(`${BASE_URL}/api/messages/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      const allConvos = await res.json();

      const existingConvo = allConvos.find(
        (c) => c.postId === item.id && c.participants.includes(userId) && c.typeOfPost === item.typeOfPost
      );
  
      let convoId;
  
      if (existingConvo) {
        convoId = existingConvo.id;
      } else {
        const recipientId = currentUserId === item.posterId ? otherUserId : item.posterId;
        const posterId = item.posterId;
        console.log("✅ currentUserId:", currentUserId);
        console.log("✅ posterId:", posterId);
        console.log("✅ recipientId:", recipientId);
        convoId = await getOrCreateConversation(item.typeOfPost, item.id, item.posterId);
      }
  
      const screenMap = {
        sell: 'ContactSell',
        lend: 'ContactLend',
        trade: 'ContactTrade',
      };
  
      const screenName = screenMap[item.typeOfPost];
  
      if (screenName) {
        navigation.navigate(screenName, {
          convoId,
          postId: item.id,
          isPoster,
          otherUserId: item.posterId,
          posterId: item.posterId,
        });
      } else {
        Alert.alert("Error", "Unsupported post type.");
      }
    } catch (err) {
      console.error("Error handling conversation:", err);
      Alert.alert("Error", "Unable to contact poster right now.");
    }
  };


  const handleLostFlow = async () => {
    const token = await AsyncStorage.getItem('userToken');
    const userId = JSON.parse(atob(token.split('.')[1])).user_id;
  
    try {
      const res = await fetch(`${BASE_URL}/api/messages/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      const allConvos = await res.json();
  
      const existing = allConvos.find(
        (c) => c.postId === item.id &&
               c.participants.includes(userId) &&
               c.typeOfPost === 'found'
      );
  
      let finalConvoId;
  
      if (existing) {
        finalConvoId = existing.id;
      } else {
        finalConvoId = await getOrCreateConversation(item.typeOfPost, item.id, item.posterId);
      }
  
      setConvoId(finalConvoId);
  
      const claimRes = await fetch(
        `${BASE_URL}/api/messages/conversations/found/${finalConvoId}/claim`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
  
      if (claimRes.ok) {
        const data = await claimRes.json();
        setHasClaim(true);
        setIsClaimApproved(data?.approved === true);
      } else {
        setHasClaim(false);
        setIsClaimApproved(false);
      }
    } catch (err) {
      console.error("Error in lost flow:", err);
    }
  };
  
      useFocusEffect(
        useCallback(() => {
          if (item.typeOfPost === 'found') {
            handleLostFlow();
          }
        }, [item])
      );

  const endpointMap = {
    sell: 'sell',
    trade: 'trade',
    lend: 'lend'
  };
  

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
  
        const profileRes = await fetch(`${BASE_URL}/api/users/myProfile`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const profileData = await profileRes.json();

        const currentUid = profileData.uid || profileData.id || profileData.userId || null;
        setCurrentUserId(currentUid);
  

        if (profileData.uid === item.posterId) {
          setIsOwnPost(true); 
          setPostedBy("You");
        } else {

          const userRes = await fetch(`${BASE_URL}/api/users/${item.posterId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const userData = await userRes.json();
          if (!userData || userData.error) {
            console.warn("Failed to load poster's user data:", userData?.error);
            setPosterPic(null);
            setPostedBy("Unknown User");
          } else {
            setPostedBy(userData.username || userData.email || "Unknown User");
            setPosterPic(userData.profilePicture || null);
          }
        }
      } catch (err) {
        console.error("Error fetching user:", err);
        setPostedBy("Unknown User");
      }
    };
  

    const fetchAllPostsOfType = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        const res = await fetch(`${BASE_URL}/api/posts/type/${item.typeOfPost}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        const posts = data.posts || [];

        const activePosts = posts.filter(
          (p) => !finalStatuses.includes(p.status)
        );

        setPosts(activePosts);

        const index = activePosts.findIndex(p => p.id === item.id);
        setCurrentIndex(index !== -1 ? index : 0);
      } catch (err) {
        console.error("Error fetching posts:", err);
      }
    };
    const checkFavoriteStatus = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        const res = await fetch(`${BASE_URL}/api/favorites`, {
          headers: { Authorization: `Bearer ${token}` },
        });
    
        const postIds = await res.json();
        setIsFavorited(postIds.includes(item.id));
      } catch (err) {
        console.error('Error checking favorite status:', err);
      }
    };
    
    const fetchFavoriteCount = async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/favorites/count/${item.id}`);
        const data = await res.json();
        setFavoriteCount(data.count || 0);
      } catch (err) {
        console.error('Error fetching favorite count:', err);
      }
    };

    fetchUserInfo();
    fetchAllPostsOfType();
    checkFavoriteStatus(); 
    fetchFavoriteCount();  
  }, [item]);

  const getOrCreateConversation = async (typeOfPost, postId, posterId) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) throw new Error("Missing user token");
  
      const routeType = endpointMap[typeOfPost];
      if (!routeType) throw new Error(`Invalid typeOfPost: ${typeOfPost}`);
  
      const url = `${BASE_URL}/api/messages/conversations/${routeType}`;
      const body = JSON.stringify({ postId, posterId });
  
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body,
      });
  
      const text = await res.text();
      if (!res.ok) throw new Error(text);
  
      const data = JSON.parse(text);
      return data.id;
    } catch (err) {
      console.error("🔥 getOrCreateConversation error:", err.message);
      throw err;
    }
  };


  const handleDelete = async (postId) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const res = await fetch(`${BASE_URL}/api/posts/${postId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete post");
      Alert.alert("Success", "Post deleted successfully.");
      navigation.goBack();
    } catch (err) {
      console.error("Delete error:", err);
      Alert.alert("Error", "Could not delete post.");
    }
  };
  const toggleFavorite = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const url = `${BASE_URL}/api/favorites/${item.id}`;
      const method = isFavorited ? 'DELETE' : 'POST';
  
      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        ...(method === 'POST' ? { body: JSON.stringify({ postId: item.id }) } : {}),
      });
  
      if (res.ok) {
        setIsFavorited(!isFavorited);
        setFavoriteCount((prev) => prev + (isFavorited ? -1 : 1));
      } else {
        console.warn("Toggle failed:", await res.text());
      }
    } catch (err) {
      console.error("Toggle favorite error:", err);
    }
  };

  const goToPreviousPost = () => {
    if (currentIndex > 0) {
      navigation.replace("PostDetailPage", { item: posts[currentIndex - 1] });
    }
  };

  const goToNextPost = () => {
    if (currentIndex < posts.length - 1) {
      navigation.replace("PostDetailPage", { item: posts[currentIndex + 1] });
    }
  };

  if (!item) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Item details are unavailable.</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#1D4976' }}>
    <HeadNav navigation={navigation} currentScreen="PostDetailPage" />
    <ScrollView contentContainerStyle={styles.container}>
      
    <View style={styles.navContainer}>
  <TouchableOpacity
    style={styles.arrowButton}
    onPress={goToPreviousPost}
    disabled={currentIndex === 0}
  >
    <FontAwesome
      name="chevron-left"
      size={20}
      color={currentIndex === 0 ? "#ccc" : "#fff"}
    />
    <Text style={[styles.arrowText, { color: currentIndex === 0 ? "#ccc" : "#fff" }]}>Prev</Text>
  </TouchableOpacity>

  <Text style={[styles.arrowText, { fontWeight: 'bold', paddingHorizontal: 10, color: '#888' }]}>
    Post {posts.length > 0 ? currentIndex + 1 : 0} of {posts.length}
  </Text>

          <TouchableOpacity
            style={styles.arrowButton}
            onPress={goToNextPost}
            disabled={currentIndex === posts.length - 1}
          >
            <Text style={[styles.arrowText, { color: currentIndex === posts.length - 1 ? "#ccc" : "#fff" }]}>Next</Text>
            <FontAwesome
              name="chevron-right"
              size={20}
              color={currentIndex === posts.length - 1 ? "#ccc" : "#fff"}
            />
          </TouchableOpacity>
        </View>
  
      <View style={styles.imageSection}>
        {item.images?.length > 0 ? (
          <>
            <FlatList
              data={item.images}
              keyExtractor={(uri, index) => index.toString()}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={(e) => {
                const newIndex = Math.round(
                  e.nativeEvent.contentOffset.x / Dimensions.get('window').width
                );
                setImageIndex(newIndex);
              }}
              renderItem={({ item: imageUri }) => (
                <Image source={{ uri: imageUri }} style={styles.carouselImage} />
              )}
            />
            <View style={styles.dotsContainer}>
              {item.images.map((_, index) => (
                <View
                  key={index}
                  style={[styles.dot, imageIndex === index && styles.activeDot]}
                />
              ))}
            </View>
          </>
        ) : (
          <Text style={styles.detailText}>No image available</Text>
        )}
      </View>
  
      {/* 🔹 Post Details */}
      <View style={styles.detailSection}>
        <View style={styles.titleRow}>
          <View style={styles.titleWrapper}>
            <Text style={styles.detailTitle}>{item.title}</Text>
          </View>
          <View style={styles.heartWrapper}>
            <TouchableOpacity onPress={toggleFavorite}>
              <FontAwesome
                name={isFavorited ? "heart" : "heart-o"}
                size={22}
                color={isFavorited ? "red" : "#fff"}
              />
            </TouchableOpacity>
            <Text style={styles.heartCount}>{favoriteCount}</Text>
          </View>
        </View>
  
        <Text style={styles.detailText}>Description: {item.description}</Text>
        <Text style={styles.detailText}>Category: {item.itemCategory}</Text>
        {item.condition && <Text style={styles.detailText}>Condition: {item.condition}</Text>}
        {item.typeOfPost === 'sell' && (
          <Text style={styles.detailText}>Price: ${parseFloat(item.price).toFixed(2)}</Text>
        )}
        {item.typeOfPost === 'lend' && item.lendStartDate && item.lendEndDate && (
          <Text style={styles.detailText}>
            Lending Period: {new Date(item.lendStartDate).toLocaleDateString()} → {new Date(item.lendEndDate).toLocaleDateString()}
          </Text>
        )}
        {item.typeOfPost === 'trade' && (
          <Text style={styles.detailText}>Trade Interest: {item.tradeInterest}</Text>
        )}
       <TouchableOpacity
  onPress={() => {
    if (currentUserId === item.posterId) {
      navigation.navigate('ProfilePage'); 
    } else {
      navigation.navigate('UserPage', { userId: item.posterId }); 
    }
  }}
>
  <Text style={[styles.detailText, { fontWeight: 'bold' }]}>
    Posted By: {currentUserId === item.posterId ? 'You' : postedBy}
  </Text>
</TouchableOpacity>
      </View>
  
      {finalStatuses.includes(item.status) && (
  <Text style={[styles.detailText, { color: '#ccc', fontStyle: 'italic' }]}>
    🔒 This post has been marked as {item.status}.
  </Text>
)}

{currentUserId === item.posterId ? (
  !finalStatuses.includes(item.status) && (
    <View style={styles.ownerButtonGroup}>
      <TouchableOpacity
        style={styles.userContactButton}
        onPress={() => navigation.navigate("EditPostPage", { item })}
      >
        <Text style={styles.contactButtonText}>Edit</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.userContactButton}
        onPress={() => handleDelete(item.id)}
      >
        <Text style={styles.contactButtonText}>Delete</Text>
      </TouchableOpacity>
    </View>
  )
      ) : item.typeOfPost === 'found' ? (
        <>
          {!hasClaim ? (
            <TouchableOpacity
              style={styles.contactButton}
              onPress={async () => {
                try {
                  const newConvoId = await getOrCreateConversation(item.typeOfPost, item.id, item.posterId);
                  setConvoId(newConvoId);
                  navigation.navigate('ClaimForm', {
                    convoId: newConvoId,
                    postOwnerId: item.posterId,
                  });
                } catch (err) {
                  Alert.alert("Error", "Unable to submit claim right now.");
                }
              }}
            >
              <Text style={styles.contactButtonText}>Submit Claim Form</Text>
            </TouchableOpacity>
          ) : !isClaimApproved ? (
            <Text style={styles.detailText}>⏳ Waiting for claim approval...</Text>
          ) : (
            convoId && (
              <TouchableOpacity
                style={styles.contactButton}
                onPress={() => {
                  navigation.navigate('ContactLost', {
                    convoId,
                    postId: item.id,
                    isPoster,
                    otherUserId: item.posterId,
                  });
                }}
              >
               <TouchableOpacity style={styles.contactButton} onPress={handleContactPoster}>
                <Text style={styles.contactButtonText}>Contact Poster</Text>
              </TouchableOpacity>
              </TouchableOpacity>
            )
          )}
        </>
) : (
  !finalStatuses.includes(item.status) && (
    <TouchableOpacity style={styles.contactButton} onPress={handleContactPoster}>
      <Text style={styles.contactButtonText}>Contact Poster</Text>
    </TouchableOpacity>
  )
)}
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#1D4976",
    paddingHorizontal: 20,
    alignItems: "center",
    paddingTop: 20,
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
    width: "100%",
    marginBottom: 10,
  },
  detailSection: {
    alignItems: "center",
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
  userContactButton: {
    backgroundColor: "#f28b82",
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: "center",
    width: "40%",
    marginTop: 20,
  },
  contactButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  ownerButtonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 20,
  },
  carouselImage: {
    width: Dimensions.get('window').width - 40,
    height: 300,
    borderRadius: 10,
    resizeMode: 'cover',
    marginRight: 10,
  },
  
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ccc',
    marginHorizontal: 4,
  },
  
  activeDot: {
    backgroundColor: '#fff',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  
  titleWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  
  heartCount: {
    marginLeft: 6,
    fontSize: 16,
    color: '#fff',
  },
  arrowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  
  arrowText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
