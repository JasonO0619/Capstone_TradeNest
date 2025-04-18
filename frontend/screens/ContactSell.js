import React, { useEffect, useState } from 'react';
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
  Modal,
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
  getDocs
} from 'firebase/firestore';
import BASE_URL from '../BaseUrl';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { where } from 'firebase/firestore';


export default function ContactSell({ navigation, route }) {
  const { convoId, postId, posterId: routePosterId, otherUserId, isPoster } = route.params;
  const posterId = routePosterId;
  const [post, setPost] = useState(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [finalized, setFinalized] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [chatUser, setChatUser] = useState(null);
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
const [reviewText, setReviewText] = useState('');
const [reviewRating, setReviewRating] = useState(0);
  const [participants, setParticipants] = useState([]);
  const alertShownKey = `alertShown-${convoId}`;
  const [hasReviewed, setHasReviewed] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      const postDoc = await getDoc(doc(firestore, 'posts', postId));
      if (postDoc.exists()) setPost(postDoc.data());
    };
    if (postId) fetchPost();
  }, [postId]);

  useEffect(() => {
    const fetchUsers = async () => {
      const token = await AsyncStorage.getItem('userToken');
      const uid = JSON.parse(atob(token.split('.')[1])).user_id;
      setCurrentUserId(uid);

      const otherId = isPoster ? otherUserId : posterId;
const userDoc = await getDoc(doc(firestore, 'users', otherId));
if (userDoc.exists()) setChatUser(userDoc.data());


      try {
        const reviewQuery = query(
          collection(firestore, 'reviews'),
          where('convoId', '==', convoId),
          where('reviewerId', '==', uid)
        );
  
        const reviewSnapshot = await getDocs(reviewQuery);
        if (!reviewSnapshot.empty) {
          setHasReviewed(true);
          await AsyncStorage.setItem(`hasReviewed-${convoId}`, 'true');
        } else {
          setHasReviewed(false); 
        }
      } catch (err) {
        console.warn('⚠️ Error checking reviews:', err);
      }
    };

    fetchUsers();
  }, [posterId]);

  useEffect(() => {
    const q = query(
      collection(firestore, `conversations/${convoId}/messages`),
      orderBy('timestamp', 'asc')
    );
    const unsubMessages = onSnapshot(q, snapshot => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  
    const unsubFinalize = onSnapshot(doc(firestore, `conversations/${convoId}`), async (docSnap) => {
      const data = docSnap.data();
      setFinalized(data?.finalized || {});
      setParticipants(data?.participants || []);
      setLoading(false);
  
      const hasBothFinalized = data?.finalized?.[posterId] &&
        data?.finalized?.[data.participants?.find(id => id !== posterId)] &&
        data?.status === 'completed';
  
      if (hasBothFinalized) {
        const alreadyShown = await AsyncStorage.getItem(alertShownKey);
        if (!alreadyShown) {
          Alert.alert('🎉 Deal Completed', 'You both finalized the deal. Enjoy your exchange!');
          await AsyncStorage.setItem(alertShownKey, 'true');
        }
      }
    });
  
    return () => {
      unsubMessages();
      unsubFinalize();
    };
  }, [convoId, currentUserId, posterId]);

  const handleSendMessage = async (customMessage = null) => {
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
      const receiverId = participants.find(id => id !== userId) || posterId;

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

  const updatePostStatus = async (status) => {
    try {
      await updateDoc(doc(firestore, 'posts', postId), { status });
    } catch (err) {
      console.error('❌ Error updating post status:', err);
    }
  };

  const handleFinalize = async () => {
    console.log("🟡 handleFinalize called!");
  
    try {
      const token = await AsyncStorage.getItem('userToken');
      const userId = JSON.parse(atob(token.split('.')[1])).user_id;
      const convoRef = doc(firestore, `conversations/${convoId}`);
      const convoDoc = await getDoc(convoRef);
  
      const current = convoDoc.data()?.finalized || {};
      current[userId] = true;
  
      await updateDoc(convoRef, { finalized: current });
  
      const inferredBuyerId = participants?.find(id => id !== posterId);
      console.log("✅ Finalized object:", current);
      console.log("🧾 posterId:", posterId, "🛒 buyerId:", inferredBuyerId);
  
      const bothFinalized = current[posterId] && current[inferredBuyerId];
      console.log("🎯 bothFinalized:", bothFinalized);
  
      if (bothFinalized) {
        await updatePostStatus('Sold');
        await updateDoc(convoRef, { status: 'completed' });
        await addDoc(collection(firestore, `conversations/${convoId}/messages`), {
          senderId: 'system',
          message: '✅ Deal marked as complete',
          timestamp: new Date(),
          type: 'system',
        });
      } else {
        await updatePostStatus('Pending');
      }
    } catch (err) {
      console.error("❌ Error inside handleFinalize:", err);
    }
  };

  const hasFinalized = currentUserId && finalized[currentUserId];


const buyerId = participants.find(id => id !== posterId);
const buyerHasFinalized = finalized[buyerId] === true;
const posterHasFinalized = finalized[posterId] === true;

const dealIsComplete = buyerHasFinalized && posterHasFinalized;
const posterCanFinalize = isPoster && buyerHasFinalized && !posterHasFinalized;

return (
  <View style={styles.container}>
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <FontAwesome name="arrow-left" size={24} color="#fff" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.userInfo} onPress={() => navigation.navigate('UserPage', { userId: posterId })}>
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

    <View style={styles.actionSection}>
  {post?.price && (
    <Text style={styles.priceText}>Price: ${parseFloat(post.price).toFixed(2)}</Text>
  )}

  {!dealIsComplete && !isPoster && (
    hasFinalized ? (
      <View style={[styles.actionButton, { backgroundColor: '#999' }]}>
        <Text style={styles.actionButtonText}>Waiting for Seller...</Text>
      </View>
    ) : (
      <TouchableOpacity
        style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
        onPress={async () => {
          await handleFinalize();
          await handleSendMessage("Hi, I'm interested in your post!");
        }}
      >
        <Text style={styles.actionButtonText}>Buy</Text>
      </TouchableOpacity>
    )
  )}

  {!dealIsComplete && isPoster && (
    <TouchableOpacity
      style={[
        styles.actionButton,
        { backgroundColor: posterCanFinalize ? '#f39c12' : '#ccc' },
      ]}
      disabled={!posterCanFinalize}
      onPress={() => {
        if (posterCanFinalize) setShowFinalizeModal(true);
      }}
    >
      <Text style={styles.actionButtonText}>Finalize Deal</Text>
    </TouchableOpacity>
  )}

  {dealIsComplete && (
    <View style={[styles.actionButton, { backgroundColor: '#2ecc71' }]}>
      <Text style={styles.actionButtonText}>✅ Deal Completed</Text>
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
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)' }}>
    <View style={{ backgroundColor: '#fff', padding: 24, borderRadius: 12, width: '80%' }}>
      <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 10 }}>Leave a Review</Text>

      <View style={{ flexDirection: 'row', marginBottom: 12 }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity key={star} onPress={() => setReviewRating(star)}>
            <FontAwesome
              name={star <= reviewRating ? 'star' : 'star-o'}
              size={28}
              color="#FFD700"
            />
          </TouchableOpacity>
        ))}
      </View>

      <TextInput
        placeholder="Write something nice..."
        value={reviewText}
        onChangeText={setReviewText}
        style={{ height: 100, borderColor: '#ccc', borderWidth: 1, padding: 10, borderRadius: 8, textAlignVertical: 'top' }}
        multiline
      />

      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16 }}>
        <TouchableOpacity onPress={() => setShowReviewModal(false)} style={{ marginRight: 16 }}>
          <Text style={{ color: '#888' }}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={async () => {
            const token = await AsyncStorage.getItem('userToken');
            const userId = JSON.parse(atob(token.split('.')[1])).user_id;

            await fetch(`${BASE_URL}/api/reviews`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
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


            Alert.alert('Thanks!', 'Your review has been submitted.');
            setHasReviewed(true); 
            setShowReviewModal(false);
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
          if (item.senderId === 'system' || item.type === 'system') {
            return (
              <View style={{ alignSelf: 'center', backgroundColor: '#ccc', padding: 8, borderRadius: 10, marginVertical: 6 }}>
                <Text style={{ fontStyle: 'italic', color: '#333' }}>{item.message}</Text>
              </View>
            );
          }
          const isCurrentUser = item.senderId === currentUserId;
          return (
            <View style={[styles.messageWrapper, isCurrentUser ? styles.alignRight : styles.alignLeft]}>
              <View style={[styles.messageBubble, isCurrentUser ? styles.bubbleRight : styles.bubbleLeft]}>
                <Text style={styles.senderName}>{isCurrentUser ? 'You' : chatUser?.firstName || 'Them'}</Text>
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

    <Modal visible={showFinalizeModal} transparent animationType="fade">
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ backgroundColor: '#fff', padding: 24, borderRadius: 12, width: '80%' }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>Confirm Finalization</Text>
          <Text style={{ marginBottom: 16 }}>Are you sure you want to mark this post as sold to the buyer?</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
            <TouchableOpacity onPress={() => setShowFinalizeModal(false)} style={{ marginRight: 16 }}>
              <Text style={{ color: '#888' }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={async () => {
                setShowFinalizeModal(false);
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
    flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', padding: 16, marginTop: 20,
  },
  userInfo: { flexDirection: 'row', alignItems: 'center' },
  userName: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  avatar: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: '#fff', marginLeft: 10, marginRight:10 },
  actionSection: { alignItems: 'center', padding: 16 },
  priceText: { fontSize: 16, fontWeight: 'bold', color: '#fff', marginBottom: 10 },
  actionButton: { paddingVertical: 10, paddingHorizontal: 24, borderRadius: 8 },
  actionButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  statusCircles: { flexDirection: 'row', gap: 6, marginTop: 10 },
  circle: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#ccc' },
  circleGreen: { backgroundColor: '#4CAF50' },
  messageWrapper: { marginVertical: 6, maxWidth: '80%' },
  alignRight: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  alignLeft: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  messageBubble: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12 },
  bubbleRight: { backgroundColor: '#E0F7FA', borderTopRightRadius: 0 },
  bubbleLeft: { backgroundColor: '#FFF', borderTopLeftRadius: 0 },
  senderName: { fontSize: 12, color: '#555', marginBottom: 2 },
  messageText: { fontSize: 16, color: '#000' },
  inputContainer: { flexDirection: 'row', padding: 10, backgroundColor: '#fff', alignItems: 'center' },
  input: { flex: 1, marginRight: 10, fontSize: 16 },
});