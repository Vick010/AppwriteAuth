import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Account, Client, Models } from "react-native-appwrite";
import { SafeAreaView } from "react-native-safe-area-context";

let client: Client;
let account: Account;

client = new Client()
  .setEndpoint("https://fra.cloud.appwrite.io/v1")
  .setProject("6848496900278d29c721")
  .setPlatform("com.victor.auth");

account = new Account(client);

export default function Verify() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<
    "pending" | "success" | "error" | "resending"
  >("pending");
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(
    null
  );
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    checkCurrentUser();
  }, []);

  useEffect(() => {
    // Handle deep link verification
    const { userId, secret } = params;
    if (
      userId &&
      secret &&
      typeof userId === "string" &&
      typeof secret === "string"
    ) {
      handleEmailVerification(userId, secret);
    }
  }, [params]);

  const checkCurrentUser = async () => {
    try {
      const currentUser = await account.get();
      setUser(currentUser);
    } catch (error) {
      console.log("No active session");
    }
  };

  const handleEmailVerification = async (userId: string, secret: string) => {
    setIsVerifying(true);
    try {
      await account.updateVerification(userId, secret);
      setVerificationStatus("success");

      // Refresh user data to get updated verification status
      if (user) {
        const updatedUser = await account.get();
        setUser(updatedUser);
      }
    } catch (error: any) {
      console.error("Verification error:", error);
      setVerificationStatus("error");
      setErrorMessage(error.message || "Verification failed");
    } finally {
      setIsVerifying(false);
    }
  };

  const resendVerificationEmail = async () => {
    if (!user) {
      Alert.alert("Error", "Please log in first to resend verification email.");
      return;
    }

    setVerificationStatus("resending");
    try {
      const redirectUrl = "https://victorkipchirchirkibet.co.ke/verify";
      await account.createVerification(redirectUrl);
      Alert.alert(
        "Email Sent",
        "A new verification email has been sent to your inbox."
      );
      setVerificationStatus("pending");
    } catch (error: any) {
      console.error("Resend error:", error);
      Alert.alert("Error", "Failed to resend verification email.");
      setVerificationStatus("error");
      setErrorMessage(error.message);
    }
  };

  const goToHome = () => {
    router.replace("/");
  };

  const openEmailApp = async () => {
    try {
      const url = "message://";
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Info", "Please check your email app manually.");
      }
    } catch (error) {
      Alert.alert("Info", "Please check your email app manually.");
    }
  };

  const renderContent = () => {
    if (isVerifying) {
      return (
        <View className="items-center">
          <ActivityIndicator size="large" color="#3B82F6" className="mb-4" />
          <Text className="text-lg font-medium text-gray-800 mb-2">
            Verifying your email...
          </Text>
          <Text className="text-gray-600 text-center">
            Please wait while we verify your email address.
          </Text>
        </View>
      );
    }

    if (verificationStatus === "success") {
      return (
        <View className="items-center">
          <View className="w-20 h-20 bg-green-100 rounded-full items-center justify-center mb-6">
            <Ionicons name="checkmark-circle" size={48} color="#10B981" />
          </View>
          <Text className="text-2xl font-bold text-gray-800 mb-2">
            Email Verified!
          </Text>
          <Text className="text-gray-600 text-center mb-6">
            Your email has been successfully verified. You now have full access
            to your account.
          </Text>
          <TouchableOpacity
            className="bg-green-500 rounded-md py-3 px-6 w-full"
            onPress={goToHome}
          >
            <Text className="text-white text-center font-medium">
              Continue to App
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (verificationStatus === "error") {
      return (
        <View className="items-center">
          <View className="w-20 h-20 bg-red-100 rounded-full items-center justify-center mb-6">
            <Ionicons name="close-circle" size={48} color="#EF4444" />
          </View>
          <Text className="text-2xl font-bold text-gray-800 mb-2">
            Verification Failed
          </Text>
          <Text className="text-gray-600 text-center mb-4">
            {errorMessage ||
              "We couldn't verify your email. The link may have expired or been used already."}
          </Text>
          <TouchableOpacity
            className="bg-blue-500 rounded-md py-3 px-6 w-full mb-3"
            onPress={resendVerificationEmail}
            disabled={!user}
          >
            <Text className="text-white text-center font-medium">
              Resend Verification Email
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="bg-gray-500 rounded-md py-3 px-6 w-full"
            onPress={goToHome}
          >
            <Text className="text-white text-center font-medium">
              Back to Home
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (verificationStatus === "resending") {
      return (
        <View className="items-center">
          <ActivityIndicator size="large" color="#3B82F6" className="mb-4" />
          <Text className="text-lg font-medium text-gray-800 mb-2">
            Sending verification email...
          </Text>
          <Text className="text-gray-600 text-center">
            Please wait while we send a new verification email.
          </Text>
        </View>
      );
    }

    // Default pending state
    return (
      <View className="items-center">
        <View className="w-20 h-20 bg-blue-100 rounded-full items-center justify-center mb-6">
          <Ionicons name="mail" size={48} color="#3B82F6" />
        </View>
        <Text className="text-2xl font-bold text-gray-800 mb-2">
          Check Your Email
        </Text>
        <Text className="text-gray-600 text-center mb-6">
          We've sent a verification link to your email address. Click the link
          to verify your account.
        </Text>

        {user && !user.emailVerification && (
          <View className="w-full">
            <TouchableOpacity
              className="bg-blue-500 rounded-md py-3 px-6 w-full mb-3"
              onPress={openEmailApp}
            >
              <Text className="text-white text-center font-medium">
                Open Email App
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-gray-500 rounded-md py-3 px-6 w-full mb-3"
              onPress={resendVerificationEmail}
            >
              <Text className="text-white text-center font-medium">
                Resend Verification Email
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity className="mt-4" onPress={goToHome}>
          <Text className="text-blue-600 text-center font-medium">
            Back to Home
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView className="h-full bg-gray-50">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          paddingHorizontal: 20,
          paddingVertical: 40,
        }}
      >
        <View className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md mx-auto">
          {user && (
            <View className="mb-6 p-4 bg-gray-50 rounded-lg">
              <Text className="text-sm text-gray-600 mb-1">Logged in as:</Text>
              <Text className="font-medium text-gray-800">{user.name}</Text>
              <Text className="text-sm text-gray-600">{user.email}</Text>
              <View className="flex-row items-center mt-2">
                <View
                  className={`px-2 py-1 rounded-full ${
                    user.emailVerification ? "bg-green-100" : "bg-yellow-100"
                  }`}
                >
                  <Text
                    className={`text-xs font-medium ${
                      user.emailVerification
                        ? "text-green-800"
                        : "text-yellow-800"
                    }`}
                  >
                    {user.emailVerification ? "Verified" : "Unverified"}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {renderContent()}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
