
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

export default function ContactBase({
  navigation,
  convoId,
  otherUserId,
  isPoster,
  postId,
  renderExtraUI,
}) {
  const [post, setPost] = useState(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [finalized, setFinalized] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [chatUser, setChatUser] = useState(null);

  useEffect(() => {
    if (!postId) return;
    console.time('📦 Fetch Post');
    const fetchPost = async () => {
      try {
        const postDoc = await getDoc(doc(firestore, 'posts', postId));
        if (postDoc.exists()) {
          setPost(postDoc.data());
          console.log('✅ Post fetched:', postDoc.data());
        }
      } catch (err) {
        console.error('❌ Failed to fetch post data:', err);
      } finally {
        console.timeEnd('📦 Fetch Post');
      }
    };
    fetchPost();
  }, [postId]);

  useEffect(() => {
    console.time('👤 Load User Info');
    const fetchChatUser = async () => {
      if (!otherUserId) return;
      try {
        const userDoc = await getDoc(doc(firestore, 'users', otherUserId));
        if (userDoc.exists()) {
          setChatUser(userDoc.data());
          console.log('✅ Chat user:', userDoc.data());
        }
      } catch (err) {
        console.error('❌ Error fetching chat user:', err);
      }
    };

    const getTokenUser = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        const userId = JSON.parse(atob(token.split('.')[1])).user_id;
        setCurrentUserId(userId);
        console.log('✅ Current user ID:', userId);
        await fetchChatUser();
      } catch (err) {
        console.error('❌ Failed to parse token:', err);
      } finally {
        console.timeEnd('👤 Load User Info');
      }
    };

    getTokenUser();
  }, [otherUserId]);

  useEffect(() => {
    console.time('📨 Load Messages');
    const q = query(
      collection(firestore, `conversations/${convoId}/messages`),
      orderBy('timestamp', 'asc')
    );
    const unsubMessages = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(fetched);
      console.log('📨 Messages:', fetched.length);
    });

    const convoRef = doc(firestore, `conversations/${convoId}`);
    const unsubFinalize = onSnapshot(convoRef, (docSnap) => {
      const data = docSnap.data();
      setFinalized(data?.finalized || {});
      console.log('✅ Finalization data:', data?.finalized);
      setLoading(false);
      console.timeEnd('📨 Load Messages');
    });

    return () => {
      unsubMessages();
      unsubFinalize();
    };
  }, [convoId]);

  const handleSendMessage = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const userId = JSON.parse(atob(token.split('.')[1])).user_id;
      if (message.trim() === '') return;
      const newMsg = {
        senderId: userId,
        message: message.trim(),
        timestamp: new Date(),
        type: 'text',
      };
      console.log('📤 Sending message:', newMsg);
      await addDoc(collection(firestore, `conversations/${convoId}/messages`), newMsg);
      await updateDoc(doc(firestore, `conversations/${convoId}`), {
        lastMessage: newMsg.message,
        lastMessageTimestamp: newMsg.timestamp,
        isRead: false,
      });
      setMessage('');
    } catch (err) {
      console.error('❌ Failed to send message:', err);
    }
  };

  const hasFinalized = currentUserId && finalized[currentUserId];
  const otherFinalized = otherUserId && finalized[otherUserId];
  const bothFinalized = hasFinalized && otherFinalized;

  return (
    <View style={styles.container}>
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
              <Text style={styles.userName}>{chatUser.firstName} {chatUser.lastName}</Text>
            </>
          ) : (
            <ActivityIndicator size="small" color="#FFF" />
          )}
        </TouchableOpacity>
        {renderExtraUI && renderExtraUI({
          post,
          isPoster,
          convoId,
          hasFinalized,
          otherFinalized,
          bothFinalized,
          currentUserId,
          otherUserId,
        })}
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
});
