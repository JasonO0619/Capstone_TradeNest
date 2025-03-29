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
    setDoc,
} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ClaimForm from './ClaimForm';

export default function ContactLost({ navigation, route }) {
    const { convoId, postId, isPoster } = route.params;
    const [post, setPost] = useState(null);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [chatUser, setChatUser] = useState(null);
    const [claim, setClaim] = useState(null);
    const [approved, setApproved] = useState(false);
    const [form, setForm] = useState({ when: '', where: '', details: '' });
    const [loading, setLoading] = useState(true);
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState('');

    useEffect(() => {
        const init = async () => {
            const token = await AsyncStorage.getItem('userToken');
            const uid = JSON.parse(atob(token.split('.')[1])).user_id;
            setCurrentUserId(uid);

            const postSnap = await getDoc(doc(firestore, 'posts', postId));
            if (postSnap.exists()) setPost(postSnap.data());

            const userSnap = await getDoc(doc(firestore, 'users', route.params.otherUserId));
            if (userSnap.exists()) setChatUser(userSnap.data());

            const claimSnap = await getDoc(doc(firestore, `conversations/${convoId}/claim`));
            if (claimSnap.exists()) {
                setClaim(claimSnap.data());
                setApproved(claimSnap.data().approved);
            }

            const convoRef = doc(firestore, `conversations/${convoId}`);
            const unsubMessages = onSnapshot(
                query(collection(firestore, `conversations/${convoId}/messages`), orderBy('timestamp', 'asc')),
                (snapshot) => {
                    const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    setMessages(fetched);
                }
            );

            setLoading(false);
            return () => unsubMessages();
        };

        init();
    }, []);

    const handleSubmitClaim = async () => {
        if (!form.when || !form.where || !form.details) return;
        await setDoc(doc(firestore, `conversations/${convoId}/claim`), {
            ...form,
            approved: false,
            submittedBy: currentUserId,
        });
        Alert.alert('Claim Sent!', 'The post owner will review your claim.');
        setClaim({ ...form, approved: false });
    };

    const handleApprove = async () => {
        await updateDoc(doc(firestore, `conversations/${convoId}/claim`), { approved: true });
        setApproved(true);
        Alert.alert('✅ Approved', 'You can now chat with the claimant.');
    };

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

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <FontAwesome name="arrow-left" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.userName}>{chatUser?.firstName} {chatUser?.lastName}</Text>
            </View>

            {loading ? (
                <ActivityIndicator color="#fff" size="large" />
            ) : (
                <>
                    {!approved && !isPoster && !claim && (
                        <ClaimForm
                            convoId={convoId}
                            postOwnerId={post.userId}
                            onSuccess={() => setClaim({ ...form, approved: false })}
                        />
                    )}

                    {isPoster && claim && !approved && (
                        <View style={styles.claimView}>
                            <Text style={styles.label}>Claim received:</Text>
                            <Text style={styles.claimText}>When: {claim.when}</Text>
                            <Text style={styles.claimText}>Where: {claim.where}</Text>
                            <Text style={styles.claimText}>Details: {claim.details}</Text>
                            <TouchableOpacity style={styles.submitButton} onPress={handleApprove}>
                                <Text style={styles.buttonText}>Approve Claim</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {approved && (
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

                    {approved && (
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
                    )}
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#1D4976' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        justifyContent: 'space-between',
        backgroundColor: '#163b5c',
    },
    userName: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    input: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 10,
        marginVertical: 6,
        fontSize: 16,
    },
    label: { color: '#fff', marginTop: 10, fontWeight: 'bold' },
    submitButton: {
        backgroundColor: '#4CAF50',
        paddingVertical: 12,
        borderRadius: 8,
        marginTop: 12,
    },
    buttonText: { color: '#fff', textAlign: 'center', fontWeight: 'bold' },
    claimView: { padding: 16 },
    claimText: { color: '#fff', fontSize: 16, marginVertical: 4 },
    messageWrapper: { marginVertical: 6, maxWidth: '80%' },
    alignRight: { alignSelf: 'flex-end', alignItems: 'flex-end' },
    alignLeft: { alignSelf: 'flex-start', alignItems: 'flex-start' },
    messageBubble: { padding: 10, borderRadius: 12 },
    bubbleRight: { backgroundColor: '#E0F7FA', borderTopRightRadius: 0 },
    bubbleLeft: { backgroundColor: '#FFF', borderTopLeftRadius: 0 },
    senderName: { fontSize: 12, color: '#555', marginBottom: 2 },
    messageText: { fontSize: 16, color: '#000' },
    inputContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        padding: 10,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        alignItems: 'center',
        paddingHorizontal: 16,
    },
});
