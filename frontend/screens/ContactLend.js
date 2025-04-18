import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Image,
  FlatList,
  ActivityIndicator,
  Alert,
  Modal
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { firestore } from '../firebaseConfig';
import {
  doc,
  getDoc,
  collection,
  orderBy,
  query,
  onSnapshot,
  addDoc,
  updateDoc,
  getDocs,
  where,
} from 'firebase/firestore';
import BASE_URL from '../BaseUrl';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ContactLend({ navigation, route }) {
  const { convoId, postId, posterId, isPoster } = route.params;
  const [post, setPost] = useState(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [finalized, setFinalized] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [chatUser, setChatUser] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [hasShownCompleteAlert, setHasShownCompleteAlert] = useState(false);
  const alertShownKey = `alertShown-${convoId}`;
  const [showReviewModal, setShowReviewModal] = useState(false);
const [reviewText, setReviewText] = useState('');
const [reviewRating, setReviewRating] = useState(0);
const [hasReviewed, setHasReviewed] = useState(false);

  const posterCanFinalize = isPoster && finalized[route.params.otherUserId] && !finalized[posterId];
  const dealIsComplete = finalized[posterId] && finalized[route.params.otherUserId];

  useEffect(() => {
    const fetchData = async () => {
      const token = await AsyncStorage.getItem('userToken');
      const userId = JSON.parse(atob(token.split('.')[1])).user_id;
      setCurrentUserId(userId);

      const storedReview = await AsyncStorage.getItem(`hasReviewed-${convoId}`);
if (storedReview === 'true') {
  setHasReviewed(true);
}

      const reviewQuery = query(
        collection(firestore, 'reviews'),
        where('convoId', '==', convoId),
        where('reviewerId', '==', userId)
      );
      const reviewSnap = await getDocs(reviewQuery);
      if (!reviewSnap.empty) {
        setHasReviewed(true);
      }

      const postDoc = await getDoc(doc(firestore, 'posts', postId));
      if (postDoc.exists()) setPost(postDoc.data());

      const userDoc = await getDoc(doc(firestore, 'users', posterId));
      if (userDoc.exists()) setChatUser(userDoc.data());

      const convoRef = doc(firestore, `conversations/${convoId}`);

      const unsubMessages = onSnapshot(
        query(collection(firestore, `conversations/${convoId}/messages`), orderBy('timestamp', 'asc')),
        (snapshot) => {
          setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }
      );

      const unsubFinalize = onSnapshot(convoRef, async (docSnap) => {
        const data = docSnap.data();
        setFinalized(data?.finalized || {});
        setLoading(false);
      
        const isCompleted = data?.finalized?.[posterId] && data?.finalized?.[route.params.otherUserId] && data?.status === 'completed';
      
        if (isCompleted) {
          const shownBefore = await AsyncStorage.getItem(alertShownKey);
          if (!shownBefore) {
            Alert.alert('✅ Lending Complete!', 'You may continue chatting.');
            setHasShownCompleteAlert(true);
            await AsyncStorage.setItem(alertShownKey, 'true');
          }
        }
      });

      return () => {
        unsubMessages();
        unsubFinalize();
      };
    };

    fetchData();
  }, [postId, convoId]);

  const handleSendMessage = async (customMessage = null, isSystem = false) => {
    const token = await AsyncStorage.getItem('userToken');
    const userId = JSON.parse(atob(token.split('.')[1])).user_id;
    const content = typeof customMessage === 'string' ? customMessage.trim() : message.trim();
    if (!content || typeof content !== 'string') return;

    const newMsg = {
      senderId: userId,
      message: content,
      timestamp: new Date(),
      type: 'text',
    };

    try {
      const convoRef = doc(firestore, `conversations/${convoId}`);
      const convoDoc = await getDoc(convoRef);
      const participants = convoDoc.data()?.participants || [];
      const receiverId = participants.find(id => id !== userId);

      await addDoc(collection(firestore, `conversations/${convoId}/messages`), newMsg);

      await updateDoc(convoRef, {
        lastMessage: newMsg.message,
        lastMessageTimestamp: newMsg.timestamp,
        isRead: {
          [userId]: true,
          [receiverId]: false,
        },
        lastMessageSenderId: userId,
      });

      setMessage('');
    } catch (err) {
      console.error('❌ Failed to send message:', err);
    }
  };

  const handleFinalize = async () => {
    const token = await AsyncStorage.getItem('userToken');
    const userId = JSON.parse(atob(token.split('.')[1])).user_id;
    const convoRef = doc(firestore, `conversations/${convoId}`);
    const convoDoc = await getDoc(convoRef);
    const current = convoDoc.data()?.finalized || {};
    current[userId] = true;

    await updateDoc(convoRef, { finalized: current });

    const bothFinalized = current[posterId] && current[route.params.otherUserId];

    if (bothFinalized) {
      await updateDoc(doc(firestore, 'posts', postId), { status: 'Borrowed' });
      await updateDoc(convoRef, { status: 'completed' });
      await addDoc(collection(firestore, `conversations/${convoId}/messages`), {
        senderId: 'system',
        message: '✅ Lending marked as complete',
        timestamp: new Date(),
        type: 'system',
      });
    } else {
      await updateDoc(doc(firestore, 'posts', postId), { status: 'Pending' });
    }
  };

  const hasFinalized = currentUserId && finalized[currentUserId];
  const otherFinalized = finalized[route.params.otherUserId];

  const formatDate = (date) => {
    const options = {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true,
    };
    return new Date(date).toLocaleString('en-US', options).replace(',', ' at');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <FontAwesome name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.userInfo}
          onPress={() => navigation.navigate('UserPage', { userId: route.params.otherUserId })}
        >
          {chatUser ? (
            <>
              {chatUser.profilePicture ? (
                <Image source={{ uri: chatUser.profilePicture }} style={styles.avatar} />
              ) : (
                <FontAwesome name="user-circle" size={40} color="#FFF" />
              )}
              <Text style={styles.userName}>{chatUser.firstName} {chatUser.lastName}</Text>
            </>
          ) : (
            <ActivityIndicator size="small" color="#FFF" />
          )}
        </TouchableOpacity>
      </View>

      {post?.lendStartDate && post?.lendEndDate && (
        <Text style={styles.priceText}>
          Lending Period: {formatDate(post.lendStartDate)} → {formatDate(post.lendEndDate)}
        </Text>
      )}

      <View style={styles.actionSection}>
        {!dealIsComplete && !isPoster && (
          hasFinalized ? (
            <View style={[styles.actionButton, { backgroundColor: '#999' }]}> 
              <Text style={styles.actionButtonText}>Waiting for Lender...</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
              onPress={async () => {
                await handleFinalize();
                if (!message.trim()) {
                  await handleSendMessage("Hi, I'm interested in borrowing this!", true);
                } else {
                  await handleSendMessage();
                }
              }}
            >
              <Text style={styles.actionButtonText}>Borrow</Text>
            </TouchableOpacity>
          )
        )}

        {!dealIsComplete && isPoster && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: posterCanFinalize ? '#f39c12' : '#ccc' }]}
            disabled={!posterCanFinalize}
            onPress={() => setShowConfirmModal(true)}
          >
            <Text style={styles.actionButtonText}>Finalize Lending</Text>
          </TouchableOpacity>
        )}

        {dealIsComplete && (
          <View style={[styles.actionButton, { backgroundColor: '#2ecc71' }]}> 
            <Text style={styles.actionButtonText}>✅ Lending Complete</Text>
          </View>
        )}

{dealIsComplete && currentUserId !== posterId && !hasReviewed && (
  <TouchableOpacity
    style={[styles.actionButton, { backgroundColor: '#3498db', marginTop: 10 }]}
    onPress={() => setShowReviewModal(true)}
  >
    <Text style={styles.actionButtonText}>Leave a Review</Text>
  </TouchableOpacity>
)}

<Modal visible={showReviewModal} transparent animationType="slide">
  <View style={styles.modalOverlay}>
    <View style={styles.modalBox}>
    <Text style={{ fontWeight: 'bold', marginBottom: 10 }}>
  Leave a review for {chatUser?.firstName} {chatUser?.lastName}
</Text>
      <TextInput
        style={{ borderColor: '#ccc', borderWidth: 1, padding: 10, borderRadius: 5, marginBottom: 10 }}
        placeholder="Write your review..."
        multiline
        value={reviewText}
        onChangeText={setReviewText}
      />
      <View style={{ flexDirection: 'row', marginBottom: 10 }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity key={star} onPress={() => setReviewRating(star)}>
            <FontAwesome
              name={star <= reviewRating ? 'star' : 'star-o'}
              size={24}
              color="#FFD700"
            />
          </TouchableOpacity>
        ))}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <TouchableOpacity onPress={() => setShowReviewModal(false)}>
          <Text style={{ color: 'red' }}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={async () => {
            try {
              const token = await AsyncStorage.getItem('userToken');
              const res = await fetch(`${BASE_URL}/api/reviews`, {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  revieweeId: posterId,
                  rating: reviewRating,
                  text: reviewText,
                  postId,
                  convoId,
                }),
              });

              await AsyncStorage.setItem(`hasReviewed-${convoId}`, 'true');

              if (res.ok) {
                Alert.alert('✅ Review submitted!');
                setShowReviewModal(false);
                setHasReviewed(true);
              } else {
                const errorData = await res.json();
                console.error(errorData);
                Alert.alert('⚠️ Error', errorData.error || 'Something went wrong.');
              }
            } catch (err) {
              console.error('Error submitting review:', err);
              Alert.alert('⚠️ Network Error');
            }
          }}
        >
          <Text style={{ color: '#3498db', fontWeight: 'bold' }}>Submit</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
</Modal>

      </View>
      {loading ? (
        <ActivityIndicator color="#fff" size="large" />
      ) : (
        <FlatList
  data={messages}
  keyExtractor={(item) => item.id}
  renderItem={({ item }) => {
    const isSystem = item.senderId === 'system' || item.type === 'system';
    const isCurrentUser = item.senderId === currentUserId;

    if (isSystem) {
      return (
        <View style={{ alignSelf: 'center', backgroundColor: '#ccc', padding: 8, borderRadius: 10, marginVertical: 6 }}>
          <Text style={{ fontStyle: 'italic', color: '#333' }}>{item.message}</Text>
        </View>
      );
    }

    return (
      <View
        style={[styles.messageWrapper, isCurrentUser ? styles.alignRight : styles.alignLeft]}
      >
        <View
          style={[
            styles.messageBubble,
            isCurrentUser ? styles.bubbleRight : styles.bubbleLeft,
          ]}
        >
          <Text style={styles.senderName}>
            {isCurrentUser ? 'You' : chatUser?.firstName || 'Them'}
          </Text>
          <Text style={styles.messageText}>{item.message}</Text>
        </View>
      </View>
    );
  }}
  style={{ flex: 1, padding: 10 }}
/>
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          value={message}
          onChangeText={setMessage}
        />
        <TouchableOpacity onPress={handleSendMessage}>
          <FontAwesome name="send" size={24} color="#1D4976" />
        </TouchableOpacity>
      </View>

      <Modal visible={showConfirmModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={{ fontSize: 16, marginBottom: 10 }}>
              Are you sure you want to lend this item to {chatUser?.firstName || 'this user'}?
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
              <TouchableOpacity onPress={() => setShowConfirmModal(false)} style={{ marginRight: 16 }}>
                <Text style={{ color: '#888' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={async () => {
                  setShowConfirmModal(false);
                  await handleFinalize();
                }}
              >
                <Text style={{ color: '#f39c12', fontWeight: 'bold' }}>Yes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1D4976' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
    backgroundColor: '#1D4976',
    justifyContent: 'space-between',
    marginTop: 30
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
    right: 60,
  },
  userName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: '#fff',
    marginRight: 10,
  },
  messageWrapper: { marginVertical: 6, maxWidth: '80%' },
  alignRight: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  alignLeft: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  messageBubble: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12 },
  bubbleRight: { backgroundColor: '#E0F7FA', borderTopRightRadius: 0 },
  bubbleLeft: { backgroundColor: '#FFF', borderTopLeftRadius: 0 },
  senderName: { fontSize: 12, color: '#555', marginBottom: 2 },
  messageText: { fontSize: 16, color: '#000' },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  input: { flex: 1, marginRight: 10, fontSize: 16 },
  actionSection: {
    alignItems: 'center',
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  priceText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#fff',
    left: 10
  },
  actionButton: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusCircles: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 10,
  },
  circle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ccc',
  },
  circleGreen: {
    backgroundColor: '#4CAF50',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    width: '85%',
  },
});
