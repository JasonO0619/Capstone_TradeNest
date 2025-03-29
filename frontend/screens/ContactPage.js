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

export default function ContactPage({ navigation, route }) {
  const { convoId, otherUserId, isPoster, typeOfPost, postId } = route.params;
  const [post, setPost] = useState(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [finalized, setFinalized] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [chatUser, setChatUser] = useState(null);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const postDoc = await getDoc(doc(firestore, 'posts', postId));
        if (postDoc.exists()) {
          setPost(postDoc.data());
        }
      } catch (err) {
        console.error("Failed to fetch post data:", err);
      }
    };
  
    if (postId) fetchPost();
  }, [postId]);


  useEffect(() => {
    const fetchChatUser = async () => {
      if (!otherUserId) return;
  
      try {
        const userDoc = await getDoc(doc(firestore, 'users', otherUserId));
        if (userDoc.exists()) {
          setChatUser(userDoc.data());
        }
      } catch (err) {
        console.error('Error fetching chat user:', err);
      }
    };
  
    const getTokenUser = async () => {
      const token = await AsyncStorage.getItem('userToken');
      const userId = JSON.parse(atob(token.split('.')[1])).user_id;
      setCurrentUserId(userId);
      fetchChatUser(); // only fetch after userId is set
    };
  
    getTokenUser();
  }, [otherUserId]);

  useEffect(() => {
    const q = query(
      collection(firestore, `conversations/${convoId}/messages`),
      orderBy('timestamp', 'asc')
    );

    const unsubMessages = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(fetched);
    });

    const convoRef = doc(firestore, `conversations/${convoId}`);
    const unsubFinalize = onSnapshot(convoRef, (docSnap) => {
      const data = docSnap.data();
      setFinalized(data?.finalized || {});
      setLoading(false);
    });

    return () => {
      unsubMessages();
      unsubFinalize();
    };
  }, [convoId]);

  const handleSendMessage = async () => {
    const token = await AsyncStorage.getItem('userToken');
    const userId = JSON.parse(atob(token.split('.')[1])).user_id; // decode JWT

    if (message.trim() === '') return;
    const newMsg = {
      senderId: userId,
      message: message.trim(),
      timestamp: new Date(),
      type: 'text',
    };

    await addDoc(collection(firestore, `conversations/${convoId}/messages`), newMsg);
    await updateDoc(doc(firestore, `conversations/${convoId}`), {
      lastMessage: newMsg.message,
      lastMessageTimestamp: newMsg.timestamp,
      isRead: false,
    });
    setMessage('');
  };

  const handleFinalize = async () => {
    const token = await AsyncStorage.getItem('userToken');
    const userId = JSON.parse(atob(token.split('.')[1])).user_id;

    const convoRef = doc(firestore, `conversations/${convoId}`);
    const convoDoc = await getDoc(convoRef);
    const data = convoDoc.data();
    const current = data.finalized || {};
    if (current[userId]) {
      delete current[userId]; // unfinalize
    } else {
      current[userId] = true;
    }
  

    await updateDoc(convoRef, { finalized: current });
  };

  const hasFinalized = currentUserId && finalized[currentUserId];
  const otherFinalized = otherUserId && finalized[otherUserId];
  const bothFinalized = hasFinalized && otherFinalized;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
  <TouchableOpacity onPress={() => navigation.goBack()}>
    <FontAwesome name="arrow-left" size={24} color="#fff" />
  </TouchableOpacity>

  <TouchableOpacity style={styles.userInfo}>
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
  </TouchableOpacity>

  <View style={styles.finalizeSection}>
    <TouchableOpacity
      style={[
        styles.finalizeButton,
        bothFinalized && isPoster ? styles.finalizedGreen : styles.finalizeBlue,
      ]}
      onPress={handleFinalize}
      disabled={hasFinalized}
    >
      <Text style={styles.finalizeText}>
        {bothFinalized && isPoster ? 'Finalized' : 'Finalize'}
      </Text>
    </TouchableOpacity>

    <View style={styles.statusCircles}>
      <View style={[styles.circle, hasFinalized && styles.circleGreen]} />
      <View style={[styles.circle, otherFinalized && styles.circleGreen]} />
    </View>
  </View>
</View>

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
                    {isCurrentUser
                      ? 'You'
                      : chatUser
                      ? `${chatUser.firstName} ${chatUser.lastName}`
                      : 'Them'}
                  </Text>
                  <Text style={styles.messageText}>{item.message}</Text>
                </View>
              </View>
            );
          }}
          style={{ flex: 1, padding: 10 }}
        />
      )}

      {/* Input */}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1D4976' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginTop: '20'

  },
  userInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  userName: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  finalizeSection: { alignItems: 'center' },
  finalizeButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  finalizeBlue: { backgroundColor: '#4A90E2' },
  finalizedGreen: { backgroundColor: '#4CAF50' },
  finalizeText: { color: '#fff', fontWeight: 'bold' },
  statusCircles: { flexDirection: 'row', gap: 6, marginTop: 6 },
  circle: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#ccc' },
  circleGreen: { backgroundColor: '#4CAF50' },
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
  messageWrapper: {
    marginVertical: 6,
    maxWidth: '80%',
  },
  
  alignRight: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  
  alignLeft: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  
  messageBubble: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  
  bubbleRight: {
    backgroundColor: '#E0F7FA',
    borderTopRightRadius: 0,
  },
  
  bubbleLeft: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 0,
  },
  
  senderName: {
    fontSize: 12,
    color: '#555',
    marginBottom: 2,
  },
  
  messageText: {
    fontSize: 16,
    color: '#000',
  },
});
