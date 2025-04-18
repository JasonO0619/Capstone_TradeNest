import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  Alert,
  TouchableWithoutFeedback,
  Keyboard,
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
  deleteDoc,
} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome } from '@expo/vector-icons';
import HeadNav from '../header/HeadNav';

const DEFAULT_PROFILE_PIC_URL =
  'https://firebasestorage.googleapis.com/v0/b/tradenest-afc77.appspot.com/o/profile_pictures%2Fdefault_pro_pic.jpg?alt=media&token=c65c9f67-5e05-4310-91dd-9995551d9407';

export default function Notifications({ navigation }) {
  const [conversations, setConversations] = useState([]);
  const [claims, setClaims] = useState([]);
  const [completedConvos, setCompletedConvos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [selectedNotificationId, setSelectedNotificationId] = useState(null);
  const [tab, setTab] = useState('chats');
  const [chatUnreadCount, setChatUnreadCount] = useState(0);
  const [claimUnreadCount, setClaimUnreadCount] = useState(0);
  const [completedUnreadCount, setCompletedUnreadCount] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      const token = await AsyncStorage.getItem('userToken');
      const userInfo = JSON.parse(atob(token.split('.')[1]));
      const userId = userInfo.user_id;
      setCurrentUserId(userId);

      const convoQ = query(collection(firestore, 'conversations'), where('participants', 'array-contains', userId));
      const unsubChats = onSnapshot(convoQ, async (snapshot) => {
        const chatResults = [];
        const claimResults = [];
        const completedResults = [];
        let unread = 0;
        let completedUnread = 0;

        for (let docSnap of snapshot.docs) {
          const data = docSnap.data();
          const otherId = data.participants.find((id) => id !== userId);
          const userDoc = await getDoc(doc(firestore, 'users', otherId));
          const sender = userDoc.exists() ? userDoc.data() : { username: 'Unknown' };
          const postDoc = await getDoc(doc(firestore, 'posts', data.postId));
          const postData = postDoc.exists() ? postDoc.data() : { title: 'Item' };

          const convo = {
            id: docSnap.id,
            ...data,
            senderName: sender.username || sender.email || 'Unknown',
            profilePicture: sender.profilePicture || DEFAULT_PROFILE_PIC_URL,
            otherUserId: otherId,
            postTitle: postData.title || 'Item',
            finalized: data.finalized || {},
          };

          const isUnread = data.isRead?.[userId] === false && (data.lastMessageSenderId !== userId || data.lastMessageSenderId === 'system');

          if (data.status === 'completed') {
            completedResults.push(convo);
            if (isUnread) completedUnread++;
          } else if (data.typeOfPost !== 'found' || data.canChat) {
            chatResults.push(convo);
            if (isUnread) unread++;
          } else if (data.claimFormSubmitted && !data.canChat && data.posterId === userId) {
            claimResults.push(convo);
          }
        }

        setConversations(
          chatResults.sort((a, b) => b.lastMessageTimestamp?.toDate() - a.lastMessageTimestamp?.toDate())
        );
        setClaims(
          claimResults.sort((a, b) => b.lastMessageTimestamp?.toDate() - a.lastMessageTimestamp?.toDate())
        );
        setCompletedConvos(
          completedResults.sort((a, b) => b.lastMessageTimestamp?.toDate() - a.lastMessageTimestamp?.toDate())
        );
        setClaims(claimResults);
        setCompletedConvos(completedResults);
        setChatUnreadCount(unread);
        setClaimUnreadCount(claimResults.length);
        setCompletedUnreadCount(completedUnread);
        setLoading(false);
      });

      return () => unsubChats();
    };

    fetchData();
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

  const navigateToContactScreen = (type, convoId, postId, otherUserId, lastMessage, claimFormSubmitted, canChat, posterId) => {
    if (type === 'found' && claimFormSubmitted && !canChat) {
      navigation.navigate('ViewClaim', { convoId, postId, otherUserId });
      return;
    }
    const isPoster = currentUserId === posterId;

    let screen = 'ContactPage';
    if (type === 'sell') screen = 'ContactSell';
    else if (type === 'trade') screen = 'ContactTrade';
    else if (type === 'lend') screen = 'ContactLend';
    else if (type === 'found') screen = 'ContactLost';

    navigation.navigate(screen, { convoId, postId, otherUserId, isPoster, posterId });
  };

  const deleteNotification = async (convoId) => {
    try {
      await deleteDoc(doc(firestore, 'conversations', convoId));
      setConversations((prev) => prev.filter((c) => c.id !== convoId));
      setClaims((prev) => prev.filter((c) => c.id !== convoId));
      setCompletedConvos((prev) => prev.filter((c) => c.id !== convoId));
      setSelectedNotificationId(null);
    } catch (err) {
      console.error('❌ Error deleting notification:', err);
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp?.toDate) return '';
    const date = timestamp.toDate();
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); 
  };

  const renderItem = ({ item }) => {
    const isSelected = selectedNotificationId === item.id;
    return (
      <TouchableOpacity
        style={styles.notificationItem}
        onPress={async () => {
          setSelectedNotificationId(null);
          await updateConversationReadStatus(item.id);
          navigateToContactScreen(
            item.typeOfPost,
            item.id,
            item.postId,
            item.otherUserId,
            item.lastMessage,
            item.claimFormSubmitted,
            item.canChat,
            item.posterId
          );
        }}
        onLongPress={() => setSelectedNotificationId(item.id)}
      >
        <View style={styles.row}>
          <View style={styles.senderRow}>
            <Image source={{ uri: item.profilePicture }} style={styles.avatar} />
            <Text style={styles.sender}>{item.senderName}</Text>
          </View>
          <View style={styles.rightIcons}>
            {item.isRead?.[currentUserId] === false && <View style={styles.unreadDot} />}
          </View>
        </View>
        <Text
          style={[styles.message, item.isRead?.[currentUserId] === false && styles.unreadMessage]}
        >
          {item.typeOfPost === 'found' && item.claimFormSubmitted && !item.canChat
            ? `Wants to claim the ${item.postTitle} you found`
            : item.lastMessageSenderId === 'system'
            ? `${item.lastMessage}`
            : item.lastMessageSenderId === currentUserId
            ? `You sent: ${item.lastMessage}`
            : `New Message: ${item.lastMessage}`}
        </Text>
        {item.lastMessageTimestamp && (
  <Text style={styles.timestamp}>
    {formatTimestamp(item.lastMessageTimestamp)}
  </Text>
)}
        {isSelected && (
          <TouchableOpacity
            onPress={() => deleteNotification(item.id)}
            style={styles.trashButton}
          >
            <FontAwesome name="trash" size={18} color="#fff" />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  const deleteAll = () => {
    const items = tab === 'chats' ? conversations : tab === 'claims' ? claims : completedConvos;
    if (items.length === 0) return;

    Alert.alert(
      'Confirm Delete All',
      'Are you sure you want to delete all notifications in this tab?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const promises = items.map((item) => deleteDoc(doc(firestore, 'conversations', item.id)));
            await Promise.all(promises);
            if (tab === 'chats') setConversations([]);
            else if (tab === 'claims') setClaims([]);
            else setCompletedConvos([]);
          },
        },
      ]
    );
  };

  return (
    <TouchableWithoutFeedback
      onPress={() => {
        Keyboard.dismiss();
        setSelectedNotificationId(null);
      }}
    >
      <View style={styles.container}>
        <HeadNav
          navigation={navigation}
          currentScreen="Notifications"
          notificationCount={chatUnreadCount + claimUnreadCount + completedUnreadCount}
        />

        <View style={styles.topControls}>
          <TouchableOpacity
            style={[
              styles.deleteAllButton,
              (tab === 'chats' && conversations.length === 0) ||
              (tab === 'claims' && claims.length === 0) ||
              (tab === 'completed' && completedConvos.length === 0)
                ? styles.deleteDisabled
                : null,
            ]}
            onPress={deleteAll}
            disabled={
              (tab === 'chats' && conversations.length === 0) ||
              (tab === 'claims' && claims.length === 0) ||
              (tab === 'completed' && completedConvos.length === 0)
            }
          >
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>🗑️ Delete All</Text>
          </TouchableOpacity>

          <View style={styles.tabRow}>
            <TouchableOpacity
              onPress={() => setTab('chats')}
              style={[styles.tabButton, tab === 'chats' && styles.activeTab]}
            >
              <Text style={styles.tabText}>Chats {chatUnreadCount > 0 && `(${chatUnreadCount})`}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setTab('claims')}
              style={[styles.tabButton, tab === 'claims' && styles.activeTab]}
            >
              <Text style={styles.tabText}>Claims {claimUnreadCount > 0 && `(${claimUnreadCount})`}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setTab('completed')}
              style={[styles.tabButton, tab === 'completed' && styles.activeTab]}
            >
              <Text style={styles.tabText}>Completed {completedUnreadCount > 0 && `(${completedUnreadCount})`}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#fff" style={{ marginTop: 50 }} />
        ) : (
          <FlatList
            data={tab === 'chats' ? conversations : tab === 'claims' ? claims : completedConvos}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.contentContainer}
            ListEmptyComponent={<Text style={styles.emptyText}>No notifications here...</Text>}
          />
        )}
      </View>
    </TouchableWithoutFeedback>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1D4976' },
  contentContainer: { padding: 20 },
  topControls: { paddingHorizontal: 20, marginTop: 10 },
  deleteAllButton: {
    backgroundColor: '#c62828',
    padding: 8,
    borderRadius: 6,
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  deleteDisabled: {
    backgroundColor: '#8e0000',
    opacity: 0.5,
  },
  tabRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  tabButton: { padding: 10 },
  tabText: { color: '#fff', fontWeight: 'bold' },
  activeTab: { borderBottomWidth: 3, borderBottomColor: '#fff' },
  notificationItem: { backgroundColor: '#2F5D8A', padding: 16, borderRadius: 10, marginBottom: 10 },
  sender: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  message: { color: '#ddd', marginTop: 4, marginLeft: 7 },
  unreadMessage: { fontWeight: 'bold', color: '#fff' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#FF4081' },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  senderRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  rightIcons: { flexDirection: 'row', alignItems: 'center' },
  trashButton: { position: 'absolute', top: 10, right: 10, padding: 6, backgroundColor: '#f44336', borderRadius: 6 },
  emptyText: { color: '#ccc', fontSize: 16, textAlign: 'center', marginTop: 50 },
  timestamp: {
    fontSize: 12,
    color: '#aaa',
    marginTop: 4,
    textAlign: 'right',
  },
});
