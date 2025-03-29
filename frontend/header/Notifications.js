import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
} from 'react-native';
import { firestore } from '../firebaseConfig';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
  updateDoc,
} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome } from '@expo/vector-icons';

const DEFAULT_PROFILE_PIC_URL =
  'https://firebasestorage.googleapis.com/v0/b/tradenest-afc77.appspot.com/o/profile_pictures%2Fdefault_pro_pic.jpg?alt=media&token=c65c9f67-5e05-4310-91dd-9995551d9407';

export default function Notifications({ navigation }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    const fetchConversations = async () => {
      const token = await AsyncStorage.getItem('userToken');
      const userInfo = JSON.parse(atob(token.split('.')[1]));
      const userId = userInfo.user_id;
      setCurrentUserId(userId);

      const q = query(
        collection(firestore, 'conversations'),
        where('participants', 'array-contains', userId)
      );

      const unsub = onSnapshot(q, async (snapshot) => {
        const data = await Promise.all(
          snapshot.docs.map(async (docSnap) => {
            const data = docSnap.data();
            const otherId = data.participants.find((id) => id !== userId);

            const userDoc = await getDoc(doc(firestore, 'users', otherId));
            const sender = userDoc.exists() ? userDoc.data() : { username: 'Unknown' };

            return {
              id: docSnap.id,
              postId: data.postId,
              typeOfPost: data.typeOfPost,
              lastMessage: data.lastMessage,
              lastMessageTimestamp: data.lastMessageTimestamp?.toDate(),
              senderName: sender.username || sender.email || 'Unknown',
              profilePicture: sender.profilePicture || DEFAULT_PROFILE_PIC_URL,
              isRead: data.isRead,
              otherUserId: otherId,
            };
          })
        );

        const sortedData = data.sort((a, b) => b.lastMessageTimestamp - a.lastMessageTimestamp);
        setConversations(sortedData);
        setLoading(false);
      });

      return () => unsub();
    };

    fetchConversations();
  }, []);

  const updateConversationReadStatus = async (convoId) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const userId = JSON.parse(atob(token.split('.')[1])).user_id;

      await updateDoc(doc(firestore, 'conversations', convoId), {
        [`isRead.${userId}`]: true,
      });
    } catch (err) {
      console.error('❌ Failed to mark as read:', err);
    }
  };

  const navigateToContactScreen = (type, convoId, postId, otherUserId) => {
    let screen = 'ContactPage';
    if (type === 'sell') screen = 'ContactSell';
    else if (type === 'trade') screen = 'ContactTrade';
    else if (type === 'lend') screen = 'ContactLend';
    else if (type === 'lost') screen = 'ContactLost';

    navigation.navigate(screen, {
      convoId,
      postId,
      otherUserId,
      isPoster: true,
    });
  };

  if (loading || !currentUserId) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <FontAwesome name="arrow-left" size={24} color="#fff" />
      </TouchableOpacity>
      <Text style={styles.header}>Notifications</Text>
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.notificationItem}
            onPress={async () => {
              await updateConversationReadStatus(item.id);
              navigateToContactScreen(item.typeOfPost, item.id, item.postId, item.otherUserId);
            }}
          >
            <View style={styles.row}>
              <View style={styles.senderRow}>
                <Image
                  source={{ uri: item.profilePicture }}
                  style={styles.avatar}
                />
                <Text style={styles.sender}>{item.senderName}</Text>
              </View>
              {item.isRead?.[currentUserId] === false && <View style={styles.unreadDot} />}
            </View>
            <Text style={styles.message}>{item.lastMessage}</Text>
            <Text style={styles.timestamp}>{item.lastMessageTimestamp?.toLocaleString()}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1D4976',
    padding: 20,
    marginTop: 10
  },
  header: {
    fontSize: 26,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 20,
    marginTop: 10,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1D4976',
  },
  notificationItem: {
    backgroundColor: '#2F5D8A',
    padding: 16,
    borderRadius: 10,
    marginBottom: 10,
  },
  sender: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  message: {
    color: '#ddd',
    marginTop: 4,
  },
  timestamp: {
    color: '#aaa',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'right',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF4081',
    marginLeft: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#fff',
  },
  senderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
});
