import "../global.css";
import { Stack, useRouter, useSegments } from "expo-router";
import {
    useFonts,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold
} from '@expo-google-fonts/inter';
import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { View, ActivityIndicator } from 'react-native';

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
    const { user, isLoading, isLoggingOut } = useAuth();
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
        if (isLoading) return;

        const inAuthGroup = segments[0] === 'login' || segments[0] === 'otp';

        if (!user && !inAuthGroup) {
            // Chưa đăng nhập và không ở màn auth -> redirect về login
            router.replace('/login');
        } else if (user && inAuthGroup && !isLoggingOut) {
            // Đã đăng nhập mà đang ở màn auth -> redirect về home
            // CHỈ redirect nếu KHÔNG đang trong quá trình logout
            router.replace('/');
        }
    }, [user, isLoading, segments, isLoggingOut]);

    if (isLoading) {
        return (
            <View className="flex-1 items-center justify-center bg-slate-50">
                <ActivityIndicator size="large" color="#4F46E5" />
            </View>
        );
    }

    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="login" />
            <Stack.Screen name="otp" />
            <Stack.Screen name="index" />
            <Stack.Screen name="withdraw" />
            <Stack.Screen name="link-bank" />
            <Stack.Screen name="history" />
            <Stack.Screen name="success" />
        </Stack>
    );
}

export default function Layout() {
    const [loaded, error] = useFonts({
        'Inter-Regular': Inter_400Regular,
        'Inter-Medium': Inter_500Medium,
        'Inter-SemiBold': Inter_600SemiBold,
        'Inter-Bold': Inter_700Bold,
    });

    useEffect(() => {
        if (loaded || error) {
            SplashScreen.hideAsync();
        }
    }, [loaded, error]);

    if (!loaded && !error) {
        return null;
    }

    return (
        <AuthProvider>
            <RootLayoutNav />
        </AuthProvider>
    );
}
