import * as Linking from "expo-linking";
import { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Account, Client, Databases, ID, Models } from "react-native-appwrite";

let client: Client;
let account: Account;

client = new Client()
  .setEndpoint("https://fra.cloud.appwrite.io/v1")
  .setProject("6848496900278d29c721")
  .setPlatform("com.victor.auth");

account = new Account(client);
const databases = new Databases(client);

export default function Index() {
  const [loggedInUser, setLoggedInUser] =
    useState<Models.User<Models.Preferences> | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLogin, setIsLogin] = useState(true);

  useEffect(() => {
    const subscription = Linking.addEventListener("url", async ({ url }) => {
      const { queryParams } = Linking.parse(url);

      if (queryParams && "userId" in queryParams && "secret" in queryParams) {
        const { userId, secret } = queryParams as {
          userId: string;
          secret: string;
        };
        if (userId && secret) {
          try {
            await account.updateVerification(userId, secret);
            Alert.alert("Success", "Email verified successfully!");
          } catch (err) {
            Alert.alert("Error", "Failed to verify email. Please try again.");
            console.error(err);
          }
        }
      }
    });
    return () => subscription.remove();
  }, []);

  async function handleSignup(name: string, email: string, password: string) {
    try {
      await account.create(ID.unique(), email, password, name);

      await databases.createDocument(
        "684959a400107a9ff851",
        "68495a59001fac82c539",
        ID.unique(),
        { name, email, password }
      );

      await account.createVerification(
        "https://victorkipchirchirkibet.co.ke/verify"
      );
      Alert.alert(
        "Sign Up Successful",
        "Please check your email to verify your account."
      );
      await handleLogin(email, password);
    } catch (error: any) {
      console.error(error);
      Alert.alert("Sign Up Failed", error.message);
    }
  }

  async function handleLogin(email: string, password: string) {
    try {
      await account.createEmailPasswordSession(email, password);
      const user = await account.get();
      setLoggedInUser(user);
    } catch (err) {
      console.error(err);
      Alert.alert("Login Failed", (err as Error).message);
    }
  }

  async function resendVerification() {
    try {
      await account.createVerification(
        "https://victorkipchirchirkibet.co.ke/verify"
      );
      Alert.alert(
        "Verification Email Sent",
        "Please check your email to verify your account."
      );
    } catch (error: any) {
      console.error(error);
      Alert.alert("Error", error.message);
    }
  }

  async function handleLogout() {
    try {
      await account.deleteSession("current");
      setLoggedInUser(null);
      setEmail("");
      setPassword("");
      setName("");
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to logout.");
    }
  }

  const handleAuth = () => {
    if (isLogin) {
      handleLogin(email, password);
    } else {
      handleSignup(name, email, password);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 justify-center items-center bg-white"
    >
      <View className="bg-white rounded-2xl shadow-lg p-6 w-[90%] max-w-md">
        <Text className="text-2xl font-bold text-center mb-6">
          {loggedInUser
            ? `Logged in as ${loggedInUser.name}`
            : isLogin
            ? "Login"
            : "Sign Up"}
        </Text>
        {!loggedInUser && (
          <>
            {!isLogin && (
              <TextInput
                className="border border-gray-300 rounded-md p-2 mb-4"
                value={name}
                onChangeText={(text) => setName(text)}
                placeholder="Enter your name"
                autoCapitalize="none"
              />
            )}
            <TextInput
              className="border border-gray-300 rounded-md p-2 mb-4"
              value={email}
              onChangeText={(text) => setEmail(text)}
              placeholder="Enter your email"
              autoCapitalize="none"
            />
            <TextInput
              className="border border-gray-300 rounded-md p-2 mb-4"
              value={password}
              onChangeText={(text) => setPassword(text)}
              placeholder="Enter your password"
              secureTextEntry
            />
            <TouchableOpacity
              className="bg-blue-500 rounded-md py-3"
              onPress={handleAuth}
            >
              <Text className="text-white text-center font-medium">
                {isLogin ? "Login" : "Sign Up"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="mt-4"
              onPress={() => setIsLogin(!isLogin)}
            >
              <Text className="text-center text-blue-600 font-medium">
                {isLogin
                  ? "Don't have an account? Sign Up"
                  : "Already have an account? Login"}
              </Text>
            </TouchableOpacity>
          </>
        )}
        {loggedInUser && (
          <TouchableOpacity
            className="bg-red-500 rounded-md py-3 mt-4"
            onPress={handleLogout}
          >
            <Text className="text-white text-center">Logout</Text>
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
