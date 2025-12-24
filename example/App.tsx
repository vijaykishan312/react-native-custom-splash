import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import SplashScreen from 'react-native-custom-splash';

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    async function prepare() {
      try {
        // Simulate loading resources
        console.log('📦 Starting app initialization...');
        
        // Simulate multiple loading steps
        const steps = [
          { name: 'Loading fonts...', delay: 500 },
          { name: 'Fetching data...', delay: 800 },
          { name: 'Preparing UI...', delay: 600 },
          { name: 'Almost ready...', delay: 400 },
        ];

        for (let i = 0; i < steps.length; i++) {
          console.log(steps[i].name);
          setLoadingProgress(((i + 1) / steps.length) * 100);
          await new Promise(resolve => setTimeout(resolve, steps[i].delay));
        }

        console.log('✅ App initialization complete!');
      } catch (e) {
        console.warn('⚠️ Error during initialization:', e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  useEffect(() => {
    if (appIsReady) {
      // Hide splash screen with animation when app is ready
      console.log('🎬 Hiding splash screen with animation...');
      SplashScreen.hide(true).then(() => {
        console.log('✅ Splash screen hidden successfully!');
      });
    }
  }, [appIsReady]);

  const handleShowSplash = () => {
    console.log('📱 Showing splash screen manually...');
    SplashScreen.show();
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      SplashScreen.hide(true);
    }, 3000);
  };

  const handleHideSplash = (animated: boolean) => {
    console.log(`📱 Hiding splash screen (animated: ${animated})...`);
    SplashScreen.hide(animated);
  };

  if (!appIsReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>
          Loading... {Math.round(loadingProgress)}%
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>🎨 Splash Screen Demo</Text>
          <Text style={styles.subtitle}>
            react-native-custom-splash
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>📱 About This Example</Text>
          <Text style={styles.cardText}>
            This app demonstrates the react-native-custom-splash package.
            The splash screen appeared automatically when you launched the app
            and hid with a smooth animation after loading completed.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>🎮 Try It Out</Text>
          <Text style={styles.cardText}>
            Use the buttons below to manually control the splash screen:
          </Text>
        </View>

        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleShowSplash}
          >
            <Text style={styles.buttonText}>Show Splash (3s)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={() => handleHideSplash(true)}
          >
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>
              Hide with Animation
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={() => handleHideSplash(false)}
          >
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>
              Hide Instantly
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>✨ Features</Text>
          <View style={styles.featuresList}>
            <Text style={styles.featureItem}>✅ Auto-show on app launch</Text>
            <Text style={styles.featureItem}>✅ Smooth fade animations</Text>
            <Text style={styles.featureItem}>✅ Manual show/hide control</Text>
            <Text style={styles.featureItem}>✅ iOS & Android support</Text>
            <Text style={styles.featureItem}>✅ Expo compatible</Text>
            <Text style={styles.featureItem}>✅ TypeScript support</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>📚 API Reference</Text>
          <View style={styles.codeBlock}>
            <Text style={styles.codeText}>
              {`// Show splash screen\nSplashScreen.show();\n\n// Hide with animation\nawait SplashScreen.hide(true);\n\n// Hide instantly\nawait SplashScreen.hide(false);`}
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Built with ❤️ using React Native
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  scrollContent: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'monospace',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  cardText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  buttonsContainer: {
    marginBottom: 16,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButtonText: {
    color: '#007AFF',
  },
  featuresList: {
    gap: 8,
  },
  featureItem: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  codeBlock: {
    backgroundColor: '#F5F5F7',
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  codeText: {
    fontFamily: 'monospace',
    fontSize: 14,
    color: '#1C1C1E',
    lineHeight: 20,
  },
  footer: {
    alignItems: 'center',
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E7',
  },
  footerText: {
    fontSize: 14,
    color: '#999',
  },
});
