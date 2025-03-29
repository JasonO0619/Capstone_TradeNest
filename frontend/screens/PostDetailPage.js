import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ScrollView, Alert, FlatList, Dimensions } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BASE_URL from '../BaseUrl';

export default function PostDetailPage({ navigation, route }) {
  const { item } = route.params;
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

const handleLostFlow = async () => {
  const token = await AsyncStorage.getItem('userToken'); 
  try {
    const convoId = await getOrCreateConversation(item.userId, item.typeOfPost, item.id);
    setConvoId(convoId);

    const claimRes = await fetch(`${BASE_URL}/api/messages/conversations/lost/${convoId}/claim`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (claimRes.ok) {
      const data = await claimRes.json();
      setHasClaim(true);
      setIsClaimApproved(data?.approved);
    }
  } catch (err) {
    console.error("Error in lost flow:", err);
  }
};

useEffect(() => {
  if (item.typeOfPost === 'found') {
    handleLostFlow();
  }
}, []);

  const endpointMap = {
    sell: 'sell',
    trade: 'trade',
    lend: 'lend',
    found: 'lost',
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
  

        if (profileData.uid === item.userId) {
          setIsOwnPost(true); // ✅
          setPostedBy("You");
        } else {

          const userRes = await fetch(`${BASE_URL}/api/users/${item.userId}`, {
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
        setPosts(posts);

        const index = posts.findIndex(p => p.id === item.id);
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
    checkFavoriteStatus(); // 👈 New
    fetchFavoriteCount();  // 👈 New
  }, [item]);

  const getOrCreateConversation = async (recipientId, typeOfPost, postId) => {
    try {
      console.log("🟡 Starting conversation with:", { recipientId, typeOfPost, postId });
  
      const token = await AsyncStorage.getItem('userToken');
      if (!token) throw new Error("Missing user token");
  
      const routeType = endpointMap[typeOfPost];
      if (!routeType) throw new Error(`Invalid typeOfPost: ${typeOfPost}`);
  
      const url = `${BASE_URL}/api/messages/conversations/${routeType}`;
      console.log("📡 Hitting URL:", url);
  
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ recipientId, postId }),
      });
  
      const text = await res.text();
      console.log("📥 Raw Response:", text);
  
      if (!res.ok) {
        console.error("❌ Failed to create conversation:", text);
        throw new Error(text);
      }
  
      const data = JSON.parse(text);
      console.log("✅ Conversation created:", data.id);
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
    <ScrollView contentContainerStyle={styles.container}>
      {/* 🔹 Back Button Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <FontAwesome name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
  
      {/* 🔹 Post Image Navigation Arrows */}
      <View style={styles.navContainer}>
        <TouchableOpacity onPress={goToPreviousPost} disabled={currentIndex === 0}>
          <FontAwesome name="chevron-left" size={30} color={currentIndex === 0 ? "#ccc" : "#fff"} />
        </TouchableOpacity>
        <TouchableOpacity onPress={goToNextPost} disabled={currentIndex === posts.length - 1}>
          <FontAwesome name="chevron-right" size={30} color={currentIndex === posts.length - 1 ? "#ccc" : "#fff"} />
        </TouchableOpacity>
      </View>
  
      {/* 🔹 Post Images */}
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
                  style={[
                    styles.dot,
                    imageIndex === index ? styles.activeDot : null,
                  ]}
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
  
        {item.typeOfPost === 'lost' && (
          <>
            {item.locationFound && (
              <Text style={styles.detailText}>Location Found: {item.locationFound}</Text>
            )}
            {item.currentLocation && (
              <Text style={styles.detailText}>Current Location: {item.currentLocation}</Text>
            )}
            {item.foundDate && (
              <Text style={styles.detailText}>
                Found Date: {new Date(item.foundDate).toDateString()}
              </Text>
            )}
          </>
        )}
  
        <Text style={styles.detailText}>Posted By: {currentUserId === item.userId ? "You" : postedBy}</Text>
      </View>
  
      {/* 🔹 Buttons Based on Ownership & Post Type */}
      {currentUserId === item.userId ? (
        <View style={styles.ownerButtonGroup}>
          <TouchableOpacity
            style={[styles.userContactButton]}
            onPress={() => navigation.navigate("EditPostPage", { item })}
          >
            <Text style={styles.contactButtonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.userContactButton]}
            onPress={() => handleDelete(item.id)}
          >
            <Text style={styles.contactButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      ) : item.typeOfPost === 'found' ? (
        <>
          {!hasClaim ? (
           <TouchableOpacity
           style={styles.contactButton}
           onPress={async () => {
             try {
               const convoId = await getOrCreateConversation(item.userId, item.typeOfPost, item.id);
               setConvoId(convoId); // in case we need it later
               navigation.navigate('ClaimForm', {
                 convoId,
                 postOwnerId: item.userId,
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
            <TouchableOpacity
              style={styles.contactButton}
              onPress={() => {
                navigation.navigate('ContactLost', {
                  convoId,
                  postId: item.id,
                  isPoster: false,
                  otherUserId: item.userId,
                });
              }}
            >
              <Text style={styles.contactButtonText}>Contact Poster</Text>
            </TouchableOpacity>
          )}
        </>
      ) : (
        <TouchableOpacity
          style={styles.contactButton}
          onPress={async () => {
            try {
              const convoId = await getOrCreateConversation(item.userId, item.typeOfPost, item.id);
              const screenMap = {
                sell: 'ContactSell',
                lend: 'ContactLend',
                trade: 'ContactTrade',
                lost: 'ContactLost',
              };
              const screenName = screenMap[item.typeOfPost];
              if (!screenName) {
                Alert.alert("Error", "Unsupported post type.");
                return;
              }
  
              navigation.navigate(screenName, {
                convoId,
                postId: item.id,
                isPoster: false,
                otherUserId: item.userId,
              });
            } catch (err) {
              console.error("Failed to start conversation:", err);
              Alert.alert("Error", "Unable to contact poster right now.");
            }
          }}
        >
          <Text style={styles.contactButtonText}>Contact Poster</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

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
});
