import 'react-native-url-polyfill/auto';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import CreateProjectScreen from './src/screens/CreateProjectScreen';
import GenerateReportScreen from './src/screens/GenerateReportScreen';
import LoginScreen from './src/screens/LoginScreen';
import ProjectDetailScreen from './src/screens/ProjectDetailScreen';
import ProjectsScreen from './src/screens/ProjectsScreen';
import ReportViewerScreen from './src/screens/ReportViewerScreen';

const Stack = createNativeStackNavigator();

function LoadingView() {
  return (
    <View style={{ flex: 1, backgroundColor: '#0C1A2A', justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator color="#4C9FFF" />
    </View>
  );
}

function AuthenticatedStack() {
  return (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: '#0C1A2A' }, headerTintColor: '#FFFFFF' }}>
      <Stack.Screen name="Projects" component={ProjectsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="CreateProject" component={CreateProjectScreen} options={{ title: 'New Project' }} />
      <Stack.Screen name="ProjectDetail" component={ProjectDetailScreen} options={{ title: 'Project' }} />
      <Stack.Screen name="GenerateReport" component={GenerateReportScreen} options={{ title: 'Generate Report' }} />
      <Stack.Screen name="ReportViewer" component={ReportViewerScreen} options={{ title: 'Quick Research Report' }} />
    </Stack.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  );
}

function RootNavigator() {
  const { session, loading } = useAuth();

  if (loading) {
    return <LoadingView />;
  }

  return session ? <AuthenticatedStack /> : <AuthStack />;
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
