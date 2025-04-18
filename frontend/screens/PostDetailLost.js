import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, FlatList, Image, Dimensions, ActivityIndicator } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BASE_URL from '../BaseUrl';
import HeadNav from '../header/HeadNav';
import { firestore } from '../firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';

export default function PostDetailLost({ navigation, route }) {
  const { item, fromClaimSuccess, convoData } = route.params || {};
  const [postedBy, setPostedBy] = useState('Loading...');
  const [hasClaim, setHasClaim] = useState(false);
  const [isClaimApproved, setIsClaimApproved] = useState(null);
  const [convoId, setConvoId] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [loadingClaimStatus, setLoadingClaimStatus] = useState(true);
  const [canChat, setCanChat] = useState(false);

  const checkClaimStatus = async (convoId, userId) => {
    console.log("🔎 checkClaimStatus() called for convoId:", convoId, "| userId:", userId);
    try {
      const claimsRef = collection(firestore, `conversations/${convoId}/claims`);
      const q = query(claimsRef, where('userId', '==', userId));
      const snapshot = await getDocs(q);
      console.log("📂 Claim query snapshot size:", snapshot.size);
  
      if (!snapshot.empty) {
        const userClaim = snapshot.docs[0].data();
        console.log("✅ Claim found:", userClaim);
        setHasClaim(true);
        setIsClaimApproved(userClaim.isApproved ?? null);
      } else {
        console.warn("❌ No claim found for user.");
        setHasClaim(false);
        setIsClaimApproved(null);
      }
    } catch (err) {
      console.error("🔥 Error checking claim:", err);
      setHasClaim(false);
      setIsClaimApproved(null);
    }
  };


  useEffect(() => {
    const init = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        const userId = JSON.parse(atob(token.split('.')[1])).user_id;
        setCurrentUserId(userId);
        console.log("🧠 currentUserId set to:", userId);


        const [profileRes, convoRes, userRes] = await Promise.all([
          fetch(`${BASE_URL}/api/users/myProfile`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${BASE_URL}/api/messages/conversations/found`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              postId: item.id,
  posterId: item.posterId,
            }),
          }),
          fetch(`${BASE_URL}/api/users/${item.posterId}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
        ]);

        const profileData = await profileRes.json();
        const convoData = await convoRes.json();
        console.log("🧩 convoId set to:", convoData.id);
        if (convoData?.canChat === true) {
          setCanChat(true);
        } else {
          setCanChat(false);
        }
        const userData = await userRes.json();

        setPostedBy(
          profileData.uid === item.posterId ? 'You' :
          userData.username || userData.email || 'Unknown User'
        );

        if (convoData?.id) {
          setConvoId(convoData.id);
          setCanChat(convoData.canChat || false);
          await checkClaimStatus(convoData.id, userId);
          console.log("📦 convoData passed from claim:", convoData);
  console.log("🧪 hasClaim:", hasClaim, "| isApproved:", isClaimApproved, "| canChat:", convoData.canChat);
        }
      } catch (err) {
        console.error("🔥 Error during initial setup:", err);
        setPostedBy("Unknown User");
      } finally {
        setLoadingClaimStatus(false);
      }
    };

    init();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (convoId && currentUserId) {
        console.log("🔁 Refocusing — refreshing claim status");
        checkClaimStatus(convoId, currentUserId);
      }
    }, [convoId, currentUserId])
  );

  const handleClaimSubmission = () => {
    navigation.navigate('ClaimForm', {
      postId: item.id,
      postOwnerId: item.posterId,
      itemTitle: item.title,
    });
  };

  const isPostFinalized = item.status?.toLowerCase() === 'claimed';

  const renderClaimSection = () => {
    if (loadingClaimStatus) {
      return <ActivityIndicator size="large" color="#fff" style={{ marginTop: 20 }} />;
    }
    if (isPostFinalized) {
      return <Text style={styles.detailText}>❌ This item has already been claimed.</Text>;
    }

    if (currentUserId === item.posterId) {
      return (
        <View style={styles.ownerButtonGroup}>
          <TouchableOpacity style={styles.userContactButton} onPress={() => navigation.navigate("EditPostPage", { item })}>
            <Text style={styles.contactButtonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.userContactButton} onPress={() => {}}>
            <Text style={styles.contactButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      );
    } else {
      if (!hasClaim) {
        return (
          <TouchableOpacity style={styles.contactButton} onPress={handleClaimSubmission}>
            <Text style={styles.contactButtonText}>Submit Claim Form</Text>
          </TouchableOpacity>
        );
      } else if (isClaimApproved === null) {
        return <Text style={styles.detailText}>⏳ Waiting for claim approval...</Text>;
      } else if (isClaimApproved) {
        if (canChat) {
          return (
            <TouchableOpacity
              style={styles.contactButton}
              onPress={() =>
                navigation.navigate('ContactLost', {
                  convoId,
                  postId: item.id,
                  isPoster: false,
                  otherUserId: item.posterId,
                })
              }
            >
              <Text style={styles.contactButtonText}>Contact Poster</Text>
            </TouchableOpacity>
          );
        } else {
          return <Text style={styles.detailText}>⏳ Chat not available yet. Please wait.</Text>;
        }
      }
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#1D4976' }}>
      <HeadNav navigation={navigation} currentScreen="PostDetailLost" />

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.imageSection}>
          {item.images?.length > 0 ? (
            <FlatList
              data={item.images}
              keyExtractor={(uri, index) => index.toString()}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              renderItem={({ item: imageUri }) => <Image source={{ uri: imageUri }} style={styles.carouselImage} />} />
          ) : (
            <Text style={styles.detailText}>No image available</Text>
          )}
        </View>

        <View style={styles.detailSection}>
          <Text style={styles.detailTitle}>{item.title}</Text>
          <Text style={styles.detailText}>Description: {item.description || 'No description available'}</Text>
          {item.locationFound && <Text style={styles.detailText}>Location where it was Found: {item.locationFound}</Text>}
          <Text style={styles.detailText}>Posted By: {postedBy}</Text>
        </View>

        {renderClaimSection()}
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
  imageSection: {
    width: "100%",
    alignItems: "center",
    marginBottom: 20,
  },
  carouselImage: {
    width: Dimensions.get('window').width - 40,
    height: 300,
    borderRadius: 10,
    resizeMode: 'cover',
    marginRight: 10,
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
  userContactButton: {
    backgroundColor: "#f28b82",
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: "center",
    width: "40%",
  },
});