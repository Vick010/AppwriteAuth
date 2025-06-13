import * as Linking from "expo-linking";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Account, Client, Databases, ID, Models } from "react-native-appwrite";
import { SafeAreaView } from "react-native-safe-area-context";

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
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const subscription = Linking.addEventListener("url", async ({ url }) => {
      const { queryParams } = Linking.parse(url);
      console.log("Incoming URL:", url);
      console.log("Parsed queryParams:", queryParams);

      if (queryParams && "userId" in queryParams && "secret" in queryParams) {
        const { userId, secret } = queryParams as {
          userId: string;
          secret: string;
        };

        try {
          setIsLoading(true);
          await account.updateVerification(userId, secret);
          Alert.alert("Success", "Email verified successfully!");

          const updatedUser = await account.get();
          setLoggedInUser(updatedUser);
        } catch (err) {
          console.error("Verification error:", err);
          Alert.alert("Error", "Failed to verify email. Please try again.");
        } finally {
          setIsLoading(false);
        }
      }
    });

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    checkCurrentUser();
  }, []);

  useEffect(() => {
    if (loggedInUser && !loggedInUser.emailVerification) {
      Alert.alert(
        "Email not verified",
        "Please verify your email to access all features.",
        [
          {
            text: "Resend Verification",
            onPress: () => resendVerification(),
          },
          {
            text: "Later",
            style: "cancel",
          },
        ]
      );
    }
  }, [loggedInUser]);

  const checkCurrentUser = async () => {
    try {
      const user = await account.get();
      setLoggedInUser(user);
    } catch (error) {
      console.log("No active session");
    }
  };

  const sendVerificationEmail = async () => {
    try {
      const redirectUrl = "https://victorkipchirchirkibet.co.ke/verify";
      await account.createVerification(redirectUrl);
      console.log("Verification email sent");
      Alert.alert(
        "Verification Email Sent",
        "Please check your email and click the verification link."
      );
    } catch (error) {
      console.error("Error sending verification email:", error);
      Alert.alert("Error", "Failed to send verification email.");
    }
  };

  const resendVerification = async () => {
    try {
      setIsLoading(true);
      const redirectUrl = "https://victorkipchirchirkibet.co.ke/verify";
      await account.createVerification(redirectUrl);
      Alert.alert(
        "Verification Email Sent",
        "Please check your email and click the verification link."
      );
    } catch (error: any) {
      console.error(error);
      Alert.alert("Error", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  async function handleSignup(name: string, email: string, password: string) {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    try {
      setIsLoading(true);

      await account.create(ID.unique(), email, password, name);

      await databases.createDocument(
        "684959a400107a9ff851",
        "68495a59001fac82c539",
        ID.unique(),
        { name, email, password }
      );
      await sendVerificationEmail();

      await handleLogin(email, password);

      router.push("/verify");
      Alert.alert(
        "Sign Up Successful",
        "Please check your email to verify your account."
      );
    } catch (error: any) {
      console.error(error);
      Alert.alert("Sign Up Failed", error.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleLogin(email: string, password: string) {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Please enter both email and password.");
      return;
    }

    try {
      setIsLoading(true);
      await account.createEmailPasswordSession(email, password);
      const user = await account.get();
      setLoggedInUser(user);
    } catch (err: any) {
      console.error(err);
      Alert.alert("Login Failed", err.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleLogout() {
    try {
      setIsLoading(true);
      await account.deleteSession("current");
      setLoggedInUser(null);
      setEmail("");
      setPassword("");
      setName("");
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to logout.");
    } finally {
      setIsLoading(false);
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
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <SafeAreaView className="h-full bg-gray-50">
        <StatusBar barStyle="dark-content" backgroundColor="white" />
        <ScrollView
          className="px-5 m-6"
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          <View className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-md mx-auto">
            <Text className="text-2xl font-bold text-center mb-6 text-gray-800">
              {loggedInUser
                ? `Welcome, ${loggedInUser.name}`
                : isLogin
                ? "Login"
                : "Sign Up"}
            </Text>

            {loggedInUser && (
              <View className="mb-6">
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-gray-600">Email Status:</Text>
                  <View
                    className={`px-3 py-1 rounded-full ${
                      loggedInUser.emailVerification
                        ? "bg-green-100"
                        : "bg-yellow-100"
                    }`}
                  >
                    <Text
                      className={`text-sm font-medium ${
                        loggedInUser.emailVerification
                          ? "text-green-800"
                          : "text-yellow-800"
                      }`}
                    >
                      {loggedInUser.emailVerification
                        ? "Verified"
                        : "Unverified"}
                    </Text>
                  </View>
                </View>

                <Text className="text-gray-600 mb-2">
                  Email: {loggedInUser.email}
                </Text>

                {!loggedInUser.emailVerification && (
                  <TouchableOpacity
                    className="bg-blue-500 rounded-md py-2 px-4 mb-3"
                    onPress={resendVerification}
                    disabled={isLoading}
                  >
                    <Text className="text-white text-center font-medium">
                      {isLoading ? "Sending..." : "Resend Verification Email"}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {!loggedInUser && (
              <>
                {!isLogin && (
                  <TextInput
                    className="border border-gray-300 rounded-md p-3 mb-4 bg-gray-50"
                    value={name}
                    onChangeText={setName}
                    placeholder="Enter your name"
                    autoCapitalize="words"
                    editable={!isLoading}
                  />
                )}
                <TextInput
                  className="border border-gray-300 rounded-md p-3 mb-4 bg-gray-50"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  editable={!isLoading}
                />
                <TextInput
                  className="border border-gray-300 rounded-md p-3 mb-6 bg-gray-50"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  secureTextEntry
                  editable={!isLoading}
                />
                <TouchableOpacity
                  className={`rounded-md py-3 ${
                    isLoading ? "bg-gray-400" : "bg-blue-500"
                  }`}
                  onPress={handleAuth}
                  disabled={isLoading}
                >
                  <Text className="text-white text-center font-medium">
                    {isLoading
                      ? "Processing..."
                      : isLogin
                      ? "Login"
                      : "Sign Up"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="mt-4"
                  onPress={() => setIsLogin(!isLogin)}
                  disabled={isLoading}
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
                className={`rounded-md py-3 mt-4 ${
                  isLoading ? "bg-gray-400" : "bg-red-500"
                }`}
                onPress={handleLogout}
                disabled={isLoading}
              >
                <Text className="text-white text-center font-medium">
                  {isLoading ? "Signing out..." : "Logout"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
