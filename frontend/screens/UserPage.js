import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated
} from 'react-native';
import { firestore } from '../firebaseConfig';
import { FontAwesome } from '@expo/vector-icons';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BASE_URL from '../BaseUrl';

const screenWidth = Dimensions.get('window').width;

export default function UserPage({ route, navigation }) {
  const { userId } = route.params;
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [activeTab, setActiveTab] = useState('sell');
  const [showReviews, setShowReviews] = useState(false);
  const slideAnim = useRef(new Animated.Value(screenWidth * 0.7)).current;
  const [userReviews, setUserReviews] = useState([]);

  useEffect(() => {
    const fetchUserData = async () => {
      const userSnap = await getDoc(doc(firestore, 'users', userId));
      const postSnap = await getDocs(query(collection(firestore, 'posts'), where('posterId', '==', userId)));

      if (userSnap.exists()) {
        const userData = userSnap.data();
        setUser(userData);
      }
      const userPosts = postSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPosts(userPosts);

      try {
        const token = await AsyncStorage.getItem('userToken');
        const res = await fetch(`${BASE_URL}/api/reviews/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
  
        if (res.ok) {
          const { reviews } = await res.json(); 
          setUserReviews(reviews);             
        } else {
          const text = await res.text();
          console.warn('⚠️ Failed to fetch reviews:', res.status, text);
        }
      } catch (err) {
        console.error('❌ Error fetching reviews:', err);
      }
    };
    fetchUserData();
  }, [userId]);

  const filteredPosts = posts.filter(post => post.typeOfPost === activeTab);

  const toggleReviews = () => {
    setShowReviews(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };
  
  const closeReviews = () => {
    Animated.timing(slideAnim, {
      toValue: screenWidth * 0.7,
      duration: 300,
      useNativeDriver: false,
    }).start(() => setShowReviews(false));
  };

  const postTypes = [
    { key: 'sell', label: 'For Sale' },
    { key: 'trade', label: 'For Trade' },
    { key: 'lend', label: 'For Lend' },
    { key: 'found', label: 'Found' },
  ];

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredPosts}
        numColumns={2}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.postCard}>
            <Image source={{ uri: item.images?.[0] || 'https://via.placeholder.com/150' }} style={styles.postImage} />
            <Text style={styles.postTitle}>{item.title}</Text>
          </View>
        )}
        ListHeaderComponent={
          <>
          <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
          <FontAwesome name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        </View>
            <View style={styles.profileHeader}>
              <Image
                source={{ uri: user?.profilePicture || 'https://via.placeholder.com/100' }}
                style={styles.avatar}
              />
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{user?.firstName} {user?.lastName}</Text>
                <Text style={styles.userEmail}>{user?.email}</Text>
                <Text style={styles.memberSince}>
                  Member since:{' '}
                  {user?.createdAt?.toDate ? user.createdAt.toDate().toLocaleDateString() : 'N/A'}
                </Text>
              </View>
            </View>

           
            <View style={styles.trustSection}>
  <Text style={styles.label}>
    Trust Score: ⭐ {user?.trustScore?.toFixed(1) || 'N/A'} ({user?.ratingCount || 0} reviews)
  </Text>
  <TouchableOpacity style={styles.reviewButton} onPress={toggleReviews}>
    <Text style={styles.reviewButtonText}>Reviews →</Text>
  </TouchableOpacity>
</View>
            <View style={styles.postCountBox}>
            <Text style={styles.postCountText}>Total Number of Posts: {user?.postsCount ?? 0}</Text>
            </View>
            <View style={styles.tabContainer}>
              {postTypes.map((type) => (
                <TouchableOpacity
                  key={type.key}
                  onPress={() => setActiveTab(type.key)}
                  style={[styles.tabButton, activeTab === type.key && styles.activeTabButton]}
                >
                  <Text style={[styles.tabText, activeTab === type.key && styles.activeTabText]}>{type.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        }
        ListFooterComponent={
          <TouchableOpacity style={styles.reportButton} onPress={() => alert('Reported')}>
            <Text style={styles.reportText}>⚠️ Report</Text>
          </TouchableOpacity>
        }
        contentContainerStyle={styles.postList}
      />

      {showReviews && (
       <Animated.View style={[styles.reviewPanel, { transform: [{ translateX: slideAnim }] }]}>
          <View style={styles.reviewHeader}>
            <Text style={styles.reviewTitle}>User Reviews</Text>
            <TouchableOpacity onPress={closeReviews}>
              <Text style={styles.closeBtn}>✖</Text>
            </TouchableOpacity>
          </View>
          <FlatList
  data={userReviews}
  keyExtractor={(item) => item.id}
  renderItem={({ item }) => (
    <View style={{ marginVertical: 10, borderBottomWidth: 1, borderColor: '#ddd', paddingBottom: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
        {item.reviewerPic ? (
          <Image source={{ uri: item.reviewerPic }} style={{ width: 32, height: 32, borderRadius: 16, marginRight: 10 }} />
        ) : (
          <FontAwesome name="user-circle" size={28} color="#888" style={{ marginRight: 10 }} />
        )}
        <Text style={{ fontWeight: 'bold', fontSize: 14 }}>{item.reviewerName}</Text>
      </View>
      <Text style={{ fontSize: 16, marginBottom: 4 }}>
        {Array(item.rating).fill('⭐').join('')} ({item.rating}/5)
      </Text>
      <Text style={{ color: '#333' }}>{item.text}</Text>
      <Text style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
        {new Date(item.timestamp._seconds * 1000).toLocaleDateString()}
      </Text>
    </View>
  )}
  contentContainerStyle={{ padding: 20 }}
/>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1D4976", },
  headerRow: {marginTop: 30},
  profileHeader: { flexDirection: 'row', padding: 20, alignItems: 'center',  },
  avatar: { width: 100, height: 100, borderRadius: 50, marginRight: 20 },
  userInfo: { flex: 1 },
  userName: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  userEmail: { fontSize: 14, color: '#fff' },
  memberSince: { fontSize: 12, color: '#fff' },
  trustSection: {
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    alignItems: 'center',
    
  },
  label: { fontSize: 16, color: '#fff' },
  reviewButton: { backgroundColor: '#1D4976', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  reviewButtonText: { color: '#fff', fontWeight: 'bold' },
  tabContainer: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 10, paddingHorizontal: 10 },
  tabButton: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, backgroundColor: '#ccc' },
  activeTabButton: { backgroundColor: '#1D4976' },
  tabText: { color: '#000', fontWeight: 'bold' },
  activeTabText: { color: '#fff' },
  postList: { paddingHorizontal: 10 },
  postCard: {
    flex: 1, margin: 5, backgroundColor: '#eee', borderRadius: 8, overflow: 'hidden', alignItems: 'center',
  },
  postImage: { width: '100%', height: 100 },
  postTitle: { padding: 8, fontWeight: 'bold' },
  reportButton: {
    margin: 20, alignSelf: 'center', backgroundColor: 'salmon', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8,
  },
  reportText: { color: '#fff', fontWeight: 'bold' },
  reviewPanel: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0, 
    width: '70%',
    backgroundColor: '#fff',
    elevation: 10,
    borderRightWidth: 2,
    borderColor: '#ccc',
    zIndex: 99,
  },
  reviewHeader: {
    flexDirection: 'row', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderColor: '#ddd',
  },
  reviewTitle: { fontSize: 18, fontWeight: 'bold' },
  closeBtn: { fontSize: 18, fontWeight: 'bold', color: '#f00' },
  reviewItem: { marginVertical: 10, fontSize: 16, color: '#333' },
  postCountBox: {
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingBottom: 10,
    marginBottom: 10,
  },
  postCountText: {
    color: '#fff',
    fontSize: 16,
  },
});
