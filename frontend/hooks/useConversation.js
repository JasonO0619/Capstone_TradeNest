
import { useState, useEffect } from 'react';
import { getDoc, doc, onSnapshot, collection, query, orderBy } from 'firebase/firestore';
import { firestore } from '../firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useConversation = (convoId, otherUserId) => {
  const [chatUser, setChatUser] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [finalized, setFinalized] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getTokenUser = async () => {
      const token = await AsyncStorage.getItem('userToken');
      const uid = JSON.parse(atob(token.split('.')[1])).user_id;
      setCurrentUserId(uid);
    };
    getTokenUser();
  }, []);

  useEffect(() => {
    if (!otherUserId) return;
    const fetchChatUser = async () => {
      const userDoc = await getDoc(doc(firestore, 'users', otherUserId));
      if (userDoc.exists()) setChatUser(userDoc.data());
    };
    fetchChatUser();
  }, [otherUserId]);

  useEffect(() => {
    const unsubMessages = onSnapshot(
      query(collection(firestore, `conversations/${convoId}/messages`), orderBy('timestamp', 'asc')),
      snapshot => setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    );

    const unsubFinalize = onSnapshot(doc(firestore, `conversations/${convoId}`), docSnap => {
      setFinalized(docSnap.data()?.finalized || {});
      setLoading(false);
    });

    return () => {
      unsubMessages();
      unsubFinalize();
    };
  }, [convoId]);

  return { chatUser, currentUserId, messages, finalized, loading };
};
