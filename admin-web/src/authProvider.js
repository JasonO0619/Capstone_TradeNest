import { signInWithEmailAndPassword, signOut} from 'firebase/auth';
import { auth } from './firebase';

const authProvider = {
    login: async ({ username, password }) => {
        try {
          const userCredential = await signInWithEmailAndPassword(auth, username, password);
          const token = await userCredential.user.getIdToken();
          console.log("login sccusefull, token:", token); 
          localStorage.setItem('token', token);
          return;
        } catch (error) {
          console.error("Login failed: ", error); 
          throw new Error("Login failed");
        }
      },      

  logout: async () => {
    await signOut(auth);
    localStorage.removeItem('token');
    return Promise.resolve();
  },

//   checkAuth: () => Promise.resolve(),
  checkAuth: () => {
    return localStorage.getItem('token') ? Promise.resolve() : Promise.reject();
  },

   checkError: (error) => {
    if (error.status === 401 || error.status === 403) {
      localStorage.removeItem('token');
      console.log(error)
      return Promise.reject();
    }
    return Promise.resolve();
  },

};

export default authProvider;
