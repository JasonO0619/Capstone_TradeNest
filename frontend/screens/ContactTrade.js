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
import { where } from 'firebase/firestore';
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
} from 'firebase/firestore';
import BASE_URL from '../BaseUrl';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ContactTrade({ navigation, route }) {
  const { convoId, postId, posterId: routePosterId } = route.params;
  const [post, setPost] = useState(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [finalized, setFinalized] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [posterId, setPosterId] = useState(routePosterId || null);
  const [chatUser, setChatUser] = useState(null);
  const [tradeItems, setTradeItems] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
const [reviewText, setReviewText] = useState('');
const [reviewRating, setReviewRating] = useState(0);
  const [waitingForPoster, setWaitingForPoster] = useState(false);
  const isNonPoster = currentUserId && posterId && currentUserId !== posterId;
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);

  useEffect(() => {

    const fetchData = async () => {
      const convoRef = doc(firestore, `conversations/${convoId}`);
      const token = await AsyncStorage.getItem('userToken');
      const userId = JSON.parse(atob(token.split('.')[1])).user_id;
      setCurrentUserId(userId);

      try {

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
      } else {
        setHasReviewed(false); 
      }
    } catch (reviewErr) {
      console.warn('⚠️ Failed to fetch reviews:', reviewErr.message || reviewErr);
    }
      
      try {
       
let postDoc; 

try {
  const postRef = doc(firestore, 'posts', postId);
  const postDoc = await getDoc(postRef);

  if (postDoc.exists()) {
    const postData = postDoc.data();
    setPost(postData);
  } else {
    console.warn('❌ Post document does NOT exist in Firestore for ID:', postId);
  }
} catch (err) {
  console.error('🔥 Error while fetching post document:', err);
}
      
        const convoSnap = await getDoc(convoRef);
      
        if (convoSnap.exists()) {
          const convoData = convoSnap.data();
  if (convoData?.posterId) {
    setPosterId(convoData.posterId);
  } else if (post && post.userId) {
    setPosterId(post.userId); 
  }
      
          const otherId = convoData.participants?.find((id) => id !== userId);
          if (!otherId) {
            console.warn('❌ Could not find other participant ID');
          } else {
            const userDoc = await getDoc(doc(firestore, 'users', otherId));
            if (userDoc.exists()) {
              setChatUser(userDoc.data());
            } else {
              console.warn('❌ User doc not found for other participant:', otherId);
            }
          }
      
          if (userId === convoData.posterId && postDoc.exists()) {
            const tradeItem = {
              title: postDoc.data().title,
              imageUri: postDoc.data().images?.[0] || '',
              condition: postDoc.data().condition || 'N/A',
            };
            const currentItems = convoData.tradeItems || {};
      
            if (!currentItems[userId]) {
              await updateDoc(convoRef, {
                [`tradeItems.${userId}`]: tradeItem,
              });
              console.log('🔄 Updated trade item for poster');
            }
          }
        } else {
          console.warn('❌ Conversation not found for ID:', convoId);
        }
      } catch (err) {
        console.error('🔥 Error fetching post/convo:', err);
      }

      const unsubMessages = onSnapshot(
        query(collection(firestore, `conversations/${convoId}/messages`), orderBy('timestamp', 'asc')),
        (snapshot) => {
          setMessages(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        }
      );

      const unsubFinalize = onSnapshot(convoRef, (docSnap) => {
        const data = docSnap.data();
        setFinalized(data?.finalized || {});
        setTradeItems(data?.tradeItems || {});
        

        if (data?.finalized && data.posterId && currentUserId) {
          const otherId = data.posterId === currentUserId
            ? Object.keys(data.finalized).find(id => id !== currentUserId)
            : data.posterId;
          setWaitingForPoster(data.finalized[otherId] && !data.finalized[currentUserId]);
        }

        setLoading(false);
      });

      return () => {
        unsubMessages();
        unsubFinalize();
      };
    };

    fetchData();
  }, [postId, convoId]);


  const handleSendMessage = async (customMessage = null, shouldSendInterestMessage = false) => {
    const token = await AsyncStorage.getItem('userToken');
    const userId = JSON.parse(atob(token.split('.')[1])).user_id;
    const content = typeof customMessage === 'string' ? customMessage.trim() : message.trim();
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
      const receiverId = participants.find((id) => id !== userId);

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

    current[userId] = !current[userId];
    await updateDoc(convoRef, { finalized: current });

    if (post?.status === 'Available') {
      await updateDoc(doc(firestore, 'posts', postId), { status: 'Pending' });
    }
  };

  const handleConfirmTrade = async () => {
    try {
      const convoRef = doc(firestore, 'conversations', convoId);

      await updateDoc(doc(firestore, 'posts', postId), { status: 'Traded' });
      await updateDoc(convoRef, { status: 'completed' });

      await addDoc(collection(firestore, `conversations/${convoId}/messages`), {
        senderId: 'system',
        message: '✅ Trade completed successfully!',
        timestamp: new Date(),
        type: 'system',
      });
      await updateDoc(convoRef, {
        lastMessage:  '✅ Trade completed successfully!',
        lastMessageTimestamp: new Date(),
        lastMessageSenderId: 'system',
        isRead: {
          [currentUserId]: true,         
          [otherUserId]: false           
        }
      });

      setShowModal(false);
      Alert.alert('✅ Trade Confirmed!');
    } catch (err) {
      console.error('❌ Error finalizing trade:', err);
    }
  };

  const isPoster = currentUserId === posterId;
  const hasFinalized = finalized[currentUserId];
  const otherUserId = posterId === currentUserId ? Object.keys(finalized).find(id => id !== currentUserId) : posterId;
  const otherFinalized = finalized[otherUserId];
  const isReadyToConfirm = isPoster && otherFinalized;


  if (!post) return <ActivityIndicator size="large" color="#FFF" />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
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
        <TouchableOpacity onPress={() => navigation.navigate('ConfirmTradeScreen', { convoId, postId, isPoster, otherUserId, posterId })}>
          <FontAwesome name="arrow-right" marginLeft={120} size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.actionSection}>
        {post.status === 'Traded' || finalized?.status === 'completed' ? (
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#2ecc71' }]} disabled>
            <Text style={styles.actionButtonText}>✅ Trade Completed</Text>
          </TouchableOpacity>
        ) : !isPoster && !hasFinalized && post.status !== 'Pending' ? (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
            onPress={async () => {
              const currentOffer = tradeItems?.[currentUserId];
              const hasOffer = currentOffer?.title && currentOffer?.imageUri && currentOffer?.condition;

              if (!hasOffer) {
                Alert.alert('❗Trade Offer Missing', 'Please submit your trade offer before agreeing to trade.');
                return;
              }

              await handleFinalize();
              setWaitingForPoster(true);

              if (!message.trim()) {
                await handleSendMessage("Hi, I'm interested in trading!");
              } else {
                await handleSendMessage();
              }
            }}
          >
            <Text style={styles.actionButtonText}>Agree to Trade</Text>
          </TouchableOpacity>
        ) : !isPoster && hasFinalized && !otherFinalized ? (
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#999' }]} disabled>
            <Text style={styles.actionButtonText}>⏳ Waiting for Trader...</Text>
          </TouchableOpacity>
        ) : isReadyToConfirm && post.status === 'Pending' ? (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#FFA500' }]}
            onPress={() => setShowModal(true)}
          >
            <Text style={styles.actionButtonText}>Ready</Text>
          </TouchableOpacity>
        ) : null}

{post.status === 'Traded' && isNonPoster && !hasReviewed && (
  <TouchableOpacity
    style={[styles.actionButton, { backgroundColor: '#f39c12', marginTop: 10 }]}
    onPress={() => setShowReviewModal(true)}
  >
    <Text style={styles.actionButtonText}>📝 Leave a Review</Text>
  </TouchableOpacity>
)}

        <View style={styles.statusCircles}>
          <View style={[styles.circle, otherFinalized && styles.circleGreen]} />
        </View>
      </View>


      {loading ? (
        <ActivityIndicator color="#fff" size="large" />
      ) : (
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            if (item.type === 'system') {
              return (
                <View style={styles.systemMessageWrapper}>
                  <Text style={styles.systemMessageText}>{item.message}</Text>
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

      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={{ fontWeight: 'bold', marginBottom: 10 }}>Review Trade Offers</Text>
            <Text>🎁 Your Item:</Text>
            <Text>{tradeItems?.[currentUserId]?.title || '-'}</Text>
            {tradeItems?.[currentUserId]?.imageUri && (
              <Image source={{ uri: tradeItems[currentUserId].imageUri }} style={{ height: 100, marginVertical: 6 }} />
            )}

            <Text>🔁 Their Item:</Text>
            <Text>{tradeItems?.[otherUserId]?.title || '-'}</Text>
            {tradeItems?.[otherUserId]?.imageUri && (
              <Image source={{ uri: tradeItems[otherUserId].imageUri }} style={{ height: 100, marginVertical: 6 }} />
            )}

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 }}>
            <TouchableOpacity
  onPress={async () => {
    setShowModal(false);

    const convoRef = doc(firestore, `conversations/${convoId}`);
    const convoSnap = await getDoc(convoRef);
    const data = convoSnap.data();


    const updatedFinalized = {
      ...data.finalized,
      [currentUserId]: false, 
      [otherUserId]: false    
    };

    await updateDoc(convoRef, {
      finalized: updatedFinalized,
    });
    await updateDoc(doc(firestore, 'posts', postId), {
      status: 'Available', 
    });

    await addDoc(collection(firestore, `conversations/${convoId}/messages`), {
      senderId: 'system',
      message: '❌ Trade rejected by poster. Please review your offer and initiate trade again.',
      timestamp: new Date(),
      type: 'system',
    });
    await updateDoc(convoRef, {
      lastMessage: '❌ Trade rejected by poster. Please review your offer and initiate trade again.',
      lastMessageTimestamp: new Date(),
      lastMessageSenderId: 'system',
      isRead: {
        [currentUserId]: true,         
        [otherUserId]: false           
      }
    });

    Alert.alert("Trade Rejected", "You've rejected the trade. Waiting for new confirmation from the trader.");
  }}
>
  <Text style={{ color: 'red' }}>Reject</Text>
</TouchableOpacity>
              <TouchableOpacity onPress={handleConfirmTrade}>
                <Text style={{ color: 'green' }}>Approve</Text>
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
            if (!reviewRating || !reviewText.trim()) {
              Alert.alert('Oops!', 'Please give a rating and write something before submitting.');
              return;
            }

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
                text: reviewText.trim(),
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
  container: { flex: 1, backgroundColor: '#1D4976' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 5,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  userName: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
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
    color:'#fff'
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
  systemMessageWrapper: {
    alignSelf: 'center',
    backgroundColor: 'transparent',
    paddingVertical: 6,
  },
  systemMessageText: {
    color: '#fff',
    fontStyle: 'italic',
    fontSize: 14,
    textAlign: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 8,
    borderRadius: 10,
  },
});
