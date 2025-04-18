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
  Modal
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { firestore } from '../firebaseConfig';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  where
} from 'firebase/firestore';
import BASE_URL from '../BaseUrl';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ContactLost({ navigation, route }) {
  const { convoId, postId, isPoster, otherUserId, posterId } = route.params;
  const [currentUserId, setCurrentUserId] = useState(null);
  const [chatUser, setChatUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [finalized, setFinalized] = useState({});
  const [dealCompleted, setDealCompleted] = useState(false);
  const [post, setPost] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
const [reviewText, setReviewText] = useState('');
const [reviewRating, setReviewRating] = useState(0);
const [hasReviewed, setHasReviewed] = useState(false);
const [finalizedLoaded, setFinalizedLoaded] = useState(false);

  useEffect(() => {
    const init = async () => {
      const token = await AsyncStorage.getItem('userToken');
      const uid = JSON.parse(atob(token.split('.')[1])).user_id;
      setCurrentUserId(uid);

      const storedReview = await AsyncStorage.getItem(`hasReviewed-${convoId}`);
if (storedReview === 'true') {
  setHasReviewed(true);
}
     
      const reviewQuery = query(
        collection(firestore, 'reviews'),
        where('convoId', '==', convoId),
        where('reviewerId', '==', uid)
      );
      const reviewSnapshot = await getDocs(reviewQuery);
      if (!reviewSnapshot.empty) {
        setHasReviewed(true);
      }

      const userSnap = await getDoc(doc(firestore, 'users', otherUserId));
      if (userSnap.exists()) setChatUser(userSnap.data());

      const postSnap = await getDoc(doc(firestore, 'posts', postId));
      if (postSnap.exists()) setPost(postSnap.data());

      const convoRef = doc(firestore, `conversations/${convoId}`);
      const unsubMessages = onSnapshot(
        query(collection(firestore, `conversations/${convoId}/messages`), orderBy('timestamp', 'asc')),
        (snapshot) => {
          const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setMessages(fetched);
          setLoading(false);
        }
      );

      const unsubConvo = onSnapshot(convoRef, (docSnap) => {
        const data = docSnap.data();
        setFinalized(data?.finalized || {});
        setDealCompleted(data?.status === 'completed');
        setFinalizedLoaded(true); 
      });

      return () => {
        unsubMessages();
        unsubConvo();
      };
    };

    init();
  }, [route.params]);

  const handleSendMessage = async () => {
    const token = await AsyncStorage.getItem('userToken');
    const userId = JSON.parse(atob(token.split('.')[1])).user_id;
    const content = message.trim();
    if (!content) return;

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


    await updateDoc(convoRef, {
  [`finalized.${userId}`]: true,
    });

    const userSnap = await getDoc(doc(firestore, 'users', userId));
const userData = userSnap.exists() ? userSnap.data() : { firstName: 'Someone' };

const notifyMessage = `${userData.firstName} is ready to get their lost item.`;

await addDoc(collection(firestore, `conversations/${convoId}/messages`), {
  senderId: 'system',
  message: notifyMessage,
  timestamp: new Date(),
  type: 'system',
});

await updateDoc(convoRef, {
  lastMessage: notifyMessage,
  lastMessageTimestamp: new Date(),
  lastMessageSenderId: 'system',
  [`isRead.${posterId}`]: false,
  [`isRead.${userId}`]: true,
});


const convoData = (await getDoc(convoRef)).data();
const latestFinalized = convoData?.finalized || {};
const bothFinalized = latestFinalized[posterId] && latestFinalized[otherUserId];
    if (bothFinalized) {
      await updateDoc(doc(firestore, 'posts', postId), { status: 'Claimed' });
      await updateDoc(convoRef, { status: 'completed' });
      await addDoc(collection(firestore, `conversations/${convoId}/messages`), {
        senderId: 'system',
        message: '📦 Item has been returned to the rightful owner.',
        timestamp: new Date(),
        type: 'system',
      });
    } else {
      await updateDoc(doc(firestore, 'posts', postId), { status: 'Pending' });
    }
  };

  const hasFinalized = currentUserId && finalized[currentUserId];
const otherFinalized = currentUserId === posterId
  ? finalized[otherUserId]
  : finalized[posterId];
  const dealIsComplete = hasFinalized && otherFinalized;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.navigate('Notifications')}>
          <FontAwesome name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.userInfo} onPress={() => navigation.navigate('UserPage', { userId: otherUserId })}>
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
        {!dealIsComplete && !isPoster && finalizedLoaded && !hasFinalized && (
  <TouchableOpacity
    style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
    onPress={handleFinalize}
  >
    <Text style={styles.actionButtonText}>This is mine</Text>
  </TouchableOpacity>
)}

{!dealIsComplete && !isPoster && finalizedLoaded && hasFinalized && (
  <View style={[styles.actionButton, { backgroundColor: '#ccc' }]}>
    <Text style={styles.actionButtonText}>Waiting...</Text>
  </View>
)}

        {!dealIsComplete && isPoster && !otherFinalized && (
          <View style={[styles.actionButton, { backgroundColor: '#888' }]}>
            <Text style={styles.actionButtonText}>Return</Text>
          </View>
        )}

        {!dealIsComplete && isPoster && otherFinalized && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#FFA500' }]}
            onPress={() => setShowConfirmModal(true)}
          >
            <Text style={styles.actionButtonText}>Return</Text>
          </TouchableOpacity>
        )}

        {dealIsComplete && (
          <View style={[styles.actionButton, { backgroundColor: '#2ecc71' }]}>
            <Text style={styles.actionButtonText}>✅ Item Returned</Text>
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

      <Modal visible={showConfirmModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={{ fontSize: 16, marginBottom: 10 }}>
              Have you come to an agreement to return this lost item?
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <TouchableOpacity onPress={() => setShowConfirmModal(false)}>
                <Text style={{ color: 'red', fontWeight: 'bold' }}>No</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={async () => {
                await handleFinalize();
                setShowConfirmModal(false);
              }}>
                <Text style={{ color: 'green', fontWeight: 'bold' }}>Yes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <Modal visible={showReviewModal} transparent animationType="slide">
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)' }}>
    <View style={{ backgroundColor: '#fff', padding: 24, borderRadius: 12, width: '80%' }}>
    <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 10 }}>
  Leave a review for {chatUser?.firstName} {chatUser?.lastName}
</Text>
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
        placeholder="Write something helpful..."
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
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1D4976', paddingTop: 20 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  userInfo: { flexDirection: 'row', alignItems: 'center', marginLeft: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 8 },
  userName: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  actionSection: { alignItems: 'center', padding: 16 },
  actionButton: { paddingVertical: 10, paddingHorizontal: 24, borderRadius: 8 },
  actionButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  input: { backgroundColor: '#fff', borderRadius: 10, padding: 10, fontSize: 16, flex: 1 },
  inputContainer: { flexDirection: 'row', backgroundColor: '#fff', padding: 10, alignItems: 'center', paddingHorizontal: 16 },
  messageWrapper: { marginVertical: 6, maxWidth: '80%' },
  alignRight: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  alignLeft: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  messageBubble: { padding: 10, borderRadius: 12 },
  bubbleRight: { backgroundColor: '#E0F7FA', borderTopRightRadius: 0 },
  bubbleLeft: { backgroundColor: '#FFF', borderTopLeftRadius: 0 },
  senderName: { fontSize: 12, color: '#555', marginBottom: 2 },
  messageText: { fontSize: 16, color: '#000' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { backgroundColor: '#fff', padding: 20, borderRadius: 10, width: '85%' },
});
