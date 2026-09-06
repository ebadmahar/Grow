import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { AuthProvider } from './src/context/AuthContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { Colors } from './src/theme';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('App Global Error Caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={errorStyles.container}>
          <Text style={errorStyles.title}>Application Error</Text>
          <Text style={errorStyles.message}>
            {this.state.error?.message || 'An unexpected error occurred.'}
          </Text>
          <TouchableOpacity
            style={errorStyles.button}
            onPress={() => this.setState({ hasError: false, error: null })}
          >
            <Text style={errorStyles.buttonText}>Reload App</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      // Dynamically load Plus Jakarta Sans & Material Icons fonts for exact web prototype parity
      const fontLink = document.createElement('link');
      fontLink.rel = 'stylesheet';
      fontLink.href = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800&display=swap';
      document.head.appendChild(fontLink);

      const iconLink = document.createElement('link');
      iconLink.rel = 'stylesheet';
      iconLink.href = 'https://fonts.googleapis.com/icon?family=Material+Icons+Round';
      document.head.appendChild(iconLink);

      // Set global body background
      document.body.style.backgroundColor = '#E5E8E0';
      document.body.style.margin = '0';
      document.body.style.padding = '0';
      document.body.style.fontFamily = "'Plus Jakarta Sans', -apple-system, sans-serif";
    }
  }, []);

  const isWeb = Platform.OS === 'web';

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <AuthProvider>
          <View style={isWeb ? styles.webOuter : styles.fullFlex}>
            <View style={isWeb ? styles.webShell : styles.fullFlex}>
              <NavigationContainer>
                <StatusBar style="dark" />
                <RootNavigator />
              </NavigationContainer>
            </View>
          </View>
        </AuthProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  fullFlex: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  webOuter: {
    flex: 1,
    backgroundColor: '#E5E8E0',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  webShell: {
    width: '100%',
    maxWidth: 430,
    height: '100%',
    maxHeight: 900,
    backgroundColor: Colors.surface,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#0F1512',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.20,
    shadowRadius: 32,
    elevation: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
});

const errorStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text1,
    marginBottom: 12,
  },
  message: {
    fontSize: 14,
    color: Colors.text2,
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    backgroundColor: Colors.ink,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
