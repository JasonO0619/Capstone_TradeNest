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
  doc,
  getDoc,
  collection,
  orderBy,
  query,
  onSnapshot,
  addDoc,
  updateDoc,
} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ContactLend({ navigation, route }) {
  const { convoId, postId, otherUserId, isPoster } = route.params;
  const [post, setPost] = useState(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [finalized, setFinalized] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [chatUser, setChatUser] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const token = await AsyncStorage.getItem('userToken');
      const userId = JSON.parse(atob(token.split('.')[1])).user_id;
      setCurrentUserId(userId);

      const postDoc = await getDoc(doc(firestore, 'posts', postId));
      if (postDoc.exists()) setPost(postDoc.data());

      const userDoc = await getDoc(doc(firestore, 'users', otherUserId));
      if (userDoc.exists()) setChatUser(userDoc.data());

      const convoRef = doc(firestore, `conversations/${convoId}`);

      const unsubMessages = onSnapshot(
        query(collection(firestore, `conversations/${convoId}/messages`), orderBy('timestamp', 'asc')),
        (snapshot) => {
          setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }
      );

      const unsubFinalize = onSnapshot(convoRef, (docSnap) => {
        const data = docSnap.data();
        setFinalized(data?.finalized || {});
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
      if (!receiverId) throw new Error("Receiver ID not found in participants");

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
  };

  const hasFinalized = currentUserId && finalized[currentUserId];
  const otherFinalized = otherUserId && finalized[otherUserId];
  const isReadyToFinish = isPoster && otherFinalized;

  const handleConfirmLend = async () => {
    try {
      await updateDoc(doc(firestore, 'posts', postId), { status: 'Unavailable' });
      await updateDoc(doc(firestore, 'conversations', convoId), { status: 'completed' });
      setShowConfirmModal(false);
      Alert.alert('✅ Lending Confirmed!', 'Returning to home...');
      navigation.navigate('SellTradeLendScreen');
    } catch (err) {
      console.error('❌ Error finalizing lend:', err);
    }
  };

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
              <Text style={styles.userName}>
                {chatUser.firstName} {chatUser.lastName}
              </Text>
            </>
          ) : (
            <ActivityIndicator size="small" color="#FFF" />
          )}
        </View>
  
        <View style={styles.actionSection}>
          {!isPoster && !hasFinalized && (
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
          )}
  
          {isReadyToFinish && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#FFA500' }]}
              onPress={() => setShowConfirmModal(true)}
            >
              <Text style={styles.actionButtonText}>Ready</Text>
            </TouchableOpacity>
          )}
  
          <View style={styles.statusCircles}>
            {!isPoster && (
              <View style={[styles.circle, hasFinalized && styles.circleGreen]} />
            )}
            {isPoster && (
              <View style={[styles.circle, otherFinalized && styles.circleGreen]} />
            )}
          </View>
        </View>
      </View>
  
      {post?.lendStartDate && post?.lendEndDate && (
        <Text style={styles.priceText}>
          Lending Period: {new Date(post.lendStartDate).toLocaleString()} →{' '}
          {new Date(post.lendEndDate).toLocaleString()}
        </Text>
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
              <View
                style={[
                  styles.messageWrapper,
                  isCurrentUser ? styles.alignRight : styles.alignLeft,
                ]}
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
  
      <Modal visible={showConfirmModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={{ fontSize: 16, marginBottom: 10 }}>
              Are you sure you want to lend this item to {chatUser?.firstName || 'this user'}?
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <TouchableOpacity onPress={() => setShowConfirmModal(false)}>
                <Text style={{ color: 'red', fontWeight: 'bold' }}>No</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleConfirmLend}>
                <Text style={{ color: 'green', fontWeight: 'bold' }}>Yes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
};

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
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
    right: 15,
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
