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
} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Modal } from 'react-native'

export default function ContactTrade({ navigation, route }) {
  const { convoId, postId, isPoster, otherUserId } = route.params;
  const [post, setPost] = useState(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [finalized, setFinalized] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [chatUser, setChatUser] = useState(null);
  const [tradeItems, setTradeItems] = useState({});
  const [showModal, setShowModal] = useState(false);


  useEffect(() => {
    const fetchData = async () => {
      const token = await AsyncStorage.getItem('userToken');
      const userId = JSON.parse(atob(token.split('.')[1])).user_id;
      setCurrentUserId(userId);

      const postDoc = await getDoc(doc(firestore, 'posts', postId));
      if (postDoc.exists()) setPost(postDoc.data());

      if (isPoster) {
        const tradeItem = {
          title: postDoc.data().title,
          imageUri: postDoc.data().images?.[0] || '',
          condition: postDoc.data().condition || 'N/A',
        };
      
        const convoRef = doc(firestore, `conversations/${convoId}`);
        const convoSnap = await getDoc(convoRef);
        const currentData = convoSnap.data();
        const currentItems = currentData.tradeItems || {};
      
        if (!currentItems[userId]) {
          await updateDoc(convoRef, {
            [`tradeItems.${userId}`]: tradeItem,
          });
        }
      }

      const userDoc = await getDoc(doc(firestore, 'users', otherUserId));
      if (userDoc.exists()) setChatUser(userDoc.data());

      const convoRef = doc(firestore, `conversations/${convoId}`);

      const unsubMessages = onSnapshot(
        query(collection(firestore, `conversations/${convoId}/messages`), orderBy('timestamp', 'asc')),
        (snapshot) => {
          const fetched = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          setMessages(fetched);
        }
      );

      const unsubFinalize = onSnapshot(convoRef, (docSnap) => {
        const data = docSnap.data();
        setFinalized(data?.finalized || {});
        setTradeItems(data?.tradeItems || {}); // NEW LINE
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
  
    const content = typeof customMessage === 'string'
      ? customMessage.trim()
      : message.trim();
  
    if (!content || typeof content !== 'string') return;
  
    const newMsg = {
      senderId: userId,
      message: content,
      timestamp: new Date(),
      type: shouldSendInterestMessage ? 'system' : 'text',
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
    const data = convoDoc.data();
    const current = data.finalized || {};
    if (current[userId]) delete current[userId];
    else current[userId] = true;
    await updateDoc(convoRef, { finalized: current });
  };

  const hasFinalized = currentUserId && finalized[currentUserId];
  const otherFinalized = otherUserId && finalized[otherUserId];
  const isReadyToConfirm = otherFinalized && isPoster;
  const currentTradeItem = tradeItems?.[currentUserId] || {};
  const isTradeOfferComplete = currentTradeItem?.title && currentTradeItem?.condition && currentTradeItem?.imageUri;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <FontAwesome name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.userInfo}>
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
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('ConfirmTradeScreen', { convoId, postId, isPoster })}>
            <FontAwesome name="arrow-right" marginLeft={90} size={24} color="#fff" />
            </TouchableOpacity>
      </View>
      
      <View style={styles.actionSection}>
        <TouchableOpacity
          style={[styles.actionButton, {
            backgroundColor: isPoster ? (isReadyToConfirm ? '#4CAF50' : '#aaa') : '#4CAF50',
          }]}
          disabled={!isPoster && !isTradeOfferComplete || (isPoster && !isReadyToConfirm)}
          onPress={async () => {
            if (isPoster) {
              Alert.alert('✅ Trade Ready!', 'Both parties have agreed to the trade.');
            } else {
              await handleFinalize();
              if (!message.trim()) {
                await handleSendMessage("Hi, I'm interested in your post!", true);
              } else {
                await handleSendMessage();
              }
            }
          }}
        >
          <Text style={styles.actionButtonText}>{isPoster ? (isReadyToConfirm ? 'Confirm Trade' : 'Waiting...') : 'Agree to Trade'}</Text>
        </TouchableOpacity>
        <View style={styles.statusCircles}>
          <View style={[styles.circle, hasFinalized && styles.circleGreen]} />
          <View style={[styles.circle, otherFinalized && styles.circleGreen]} />
        </View>
      </View>
      {isPoster && hasFinalized && otherFinalized && (
  <TouchableOpacity
    style={[styles.actionButton, { backgroundColor: '#FFA500', marginTop: 10, width: '50%' }]}
    onPress={() => setShowModal(true)}
  >
    <Text style={styles.actionButtonText}>Finish</Text>
  </TouchableOpacity>
)}

      {loading ? (
        <ActivityIndicator color="#fff" size="large" />
      ) : (
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
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
        <TouchableOpacity onPress={() => setShowModal(false)}>
          <Text style={{ color: 'red' }}>Reject</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={async () => {
            await updateDoc(doc(firestore, 'posts', postId), { status: 'Unavailable' });
            await updateDoc(doc(firestore, 'conversations', convoId), {
              status: 'completed',
              finalizedAt: new Date()
            });
            setShowModal(false);
            navigation.navigate('SellTradeLendScreen'); 
          }}
        >
          <Text style={{ color: 'green' }}>Approve</Text>
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
});
