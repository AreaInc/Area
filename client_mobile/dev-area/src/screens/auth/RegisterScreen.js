import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import GradientBackground from '../../components/GradientBackground';
import GlassCard from '../../components/GlassCard';
import { Mail, Lock, User, ArrowRight, Chrome } from 'lucide-react-native';

const RegisterScreen = ({ navigation }) => {
    const { signUp, signInWithGoogle } = useAuth();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        if (!name || !email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setLoading(true);
        const result = await signUp(name, email, password);
        setLoading(false);

        if (result.error) {
            Alert.alert('Registration Failed', result.error.message || 'Something went wrong');
        }
    };

    const handleGoogleRegister = async () => {
        setLoading(true);
        const result = await signInWithGoogle();
        setLoading(false);

        if (result.error) {
            Alert.alert('Google Registration Failed', result.error.message);
        }
    };

    return (
        <GradientBackground>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.container}
            >
                <View style={styles.content}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Create Account</Text>
                        <Text style={styles.subtitle}>Sign up to start automating</Text>
                    </View>

                    <GlassCard style={styles.formCard}>
                        <View style={styles.inputContainer}>
                            <User color="#94a3b8" size={20} style={styles.icon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Full Name"
                                placeholderTextColor="#64748b"
                                autoCapitalize="words"
                                value={name}
                                onChangeText={setName}
                            />
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.inputContainer}>
                            <Mail color="#94a3b8" size={20} style={styles.icon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Email"
                                placeholderTextColor="#64748b"
                                autoCapitalize="none"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                            />
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.inputContainer}>
                            <Lock color="#94a3b8" size={20} style={styles.icon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Password"
                                placeholderTextColor="#64748b"
                                secureTextEntry
                                value={password}
                                onChangeText={setPassword}
                            />
                        </View>
                    </GlassCard>

                    <TouchableOpacity
                        style={styles.button}
                        onPress={handleRegister}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Text style={styles.buttonText}>Sign Up</Text>
                                <ArrowRight color="#fff" size={20} />
                            </>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.button, styles.googleButton]}
                        onPress={handleGoogleRegister}
                        disabled={loading}
                    >
                        <Chrome color="#000" size={20} style={{ marginRight: 8 }} />
                        <Text style={[styles.buttonText, { color: '#000' }]}>Sign up with Google</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.linkContainer}>
                        <Text style={styles.linkText}>
                            Already have an account? <Text style={styles.linkBold}>Sign In</Text>
                        </Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </GradientBackground>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
    },
    content: {
        padding: 24,
        width: '100%',
    },
    header: {
        marginBottom: 32,
        alignItems: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#94a3b8',
    },
    formCard: {
        marginBottom: 24,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    icon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        color: '#fff',
        fontSize: 16,
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        marginLeft: 48,
    },
    button: {
        backgroundColor: '#3b82f6',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    googleButton: {
        backgroundColor: '#fff',
        marginBottom: 24,
        shadowColor: '#000',
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
        marginRight: 8,
    },
    linkContainer: {
        alignItems: 'center',
    },
    linkText: {
        color: '#94a3b8',
        fontSize: 14,
    },
    linkBold: {
        color: '#fff',
        fontWeight: 'bold',
    },
});

export default RegisterScreen;
