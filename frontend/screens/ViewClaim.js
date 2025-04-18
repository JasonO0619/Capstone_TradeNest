import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, getDocs, query, where, doc, getDoc, updateDoc, addDoc, onSnapshot } from 'firebase/firestore';
import { firestore } from '../firebaseConfig';
import BASE_URL from '../BaseUrl';


const ViewClaim = ({ route, navigation }) => {
  const { convoId, postId, otherUserId, posterId } = route.params;
  const [claim, setClaim] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);

  const claimDocRef = doc(firestore, `conversations/${convoId}`);

  const fetchClaim = async () => {
    console.log('📥 Loading claim for convoId:', convoId, 'postId:', postId, 'otherUserId:', otherUserId);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const uid = JSON.parse(atob(token.split('.')[1])).user_id;
      setCurrentUserId(uid);
  
      const claimsRef = collection(firestore, `conversations/${convoId}/claims`);
      const querySnapshot = await getDocs(query(claimsRef, where('userId', '==', otherUserId)));
  
      if (!querySnapshot.empty) {
        const userClaim = querySnapshot.docs[0].data();
        console.log('✅ Claim found:', userClaim);
        setClaim({ ...userClaim, id: querySnapshot.docs[0].id });
      } else {
        console.log('❌ No claim found for user:', otherUserId);
        Alert.alert('No Claim Found', 'There is no claim submitted yet.');
        navigation.goBack();
      }
  
      // Optional real-time updates (not strictly needed for a single claim)
      const unsubscribe = onSnapshot(claimsRef, (snap) => {
        const doc = snap.docs.find((doc) => doc.data().userId === otherUserId);
        if (doc) {
          setClaim({ ...doc.data(), id: doc.id });
        }
      });

      return unsubscribe;
    } catch (err) {
      console.error('Failed to fetch claim:', err);
      Alert.alert('Error', 'Could not load claim.');
    } finally {
      setLoading(false);
    }
  };
  

  const handleApprove = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
  
      const response = await fetch(
        `${BASE_URL}/api/messages/conversations/${convoId}/claims/${claim.id}/approve`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
  
      const result = await response.json();
  
      if (response.ok) {
        const approvalMessage = '✅ Your claim has been approved! You can now start chatting with the poster.';
        const timestamp = new Date();
  
        await addDoc(collection(firestore, `conversations/${convoId}/messages`), {
          senderId: currentUserId,
          message: approvalMessage,
          timestamp,
          type: 'system',
          isRead: false,
        });
  
        await updateDoc(doc(firestore, `conversations/${convoId}`), {
          lastMessage: approvalMessage,
          lastMessageTimestamp: timestamp,
          lastMessageSenderId: currentUserId,
          [`isRead.${otherUserId}`]: false, 
          [`isRead.${currentUserId}`]: true,
        });

  
        Alert.alert('✅ Claim Approved', 'Claim approved and chat is now open.');
        navigation.navigate('ContactLost', {
          convoId,
          postId,
          otherUserId,
          isPoster: true,
          skipApprovalCheck: true,
          posterId,
        });
      } else {
        console.error('❌ Error approving claim:', result);
        Alert.alert('Error', result.error || 'Something went wrong.');
      }
    } catch (err) {
      console.error('❌ Error approving claim:', err);
      Alert.alert('Error', 'Failed to approve claim.');
    }
  };

  const handleReject = async () => {
    try {
      const rejectionMessage = '❌ Your claim was not approved.';
      const timestamp = new Date();
  
      const claimRef = doc(firestore, `conversations/${convoId}/claims/${claim.id}`);
  
      await updateDoc(claimRef, { isApproved: false });
  
      await addDoc(collection(firestore, `conversations/${convoId}/messages`), {
        senderId: currentUserId,
        message: rejectionMessage,
        timestamp,
        type: 'system',
      });
  
      await updateDoc(doc(firestore, `conversations/${convoId}`), {
        lastMessage: rejectionMessage,
        lastMessageTimestamp: timestamp,
        lastMessageSenderId: currentUserId,
        [`isRead.${otherUserId}`]: false,
        [`isRead.${currentUserId}`]: true,
      });
  
      Alert.alert('Claim Rejected', 'Claim has been rejected.');
      navigation.goBack();
    } catch (err) {
      console.error('Error rejecting claim:', err);
      Alert.alert('Error', 'Could not reject claim.');
    }
  };

  useEffect(() => {
    fetchClaim();
  }, [route.params]);

  if (loading || !claim) {
    return <ActivityIndicator size="large" color="#fff" style={{ marginTop: 50 }} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <FontAwesome name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>Claim Form</Text>
      <Text style={styles.label}>When:</Text>
      <Text style={styles.value}>{claim.answers.when}</Text>
      <Text style={styles.label}>Where:</Text>
      <Text style={styles.value}>{claim.answers.where}</Text>
      <Text style={styles.label}>Details:</Text>
      <Text style={styles.value}>{claim.answers.details}</Text>

      {claim.isApproved === true ? (
        <>
          <Text style={styles.approvedText}>✅ Claim Approved</Text>
        </>
      ) : claim.isApproved === false ? (
        <Text style={styles.rejectedText}>❌ Claim Rejected</Text>
      ) : (
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.approveButton} onPress={handleApprove}>
            <Text style={styles.buttonText}>Approve</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.rejectButton} onPress={handleReject}>
            <Text style={styles.buttonText}>Reject</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default ViewClaim;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1D4976',
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  header: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 10,
  },
  label: {
    color: '#ccc',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    textAlign: 'center',
  },
  value: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 10,
    textAlign: 'center',
  },
  approvedText: {
    color: 'lightgreen',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 20,
  },
  rejectedText: {
    color: 'salmon',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 20,
  },
  chatButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 10,
    marginTop: 20,
    alignItems: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 30,
  },
  approveButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 10,
    width: '40%',
    alignItems: 'center',
  },
  rejectButton: {
    backgroundColor: '#f44336',
    padding: 12,
    borderRadius: 10,
    width: '40%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

