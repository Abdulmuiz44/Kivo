import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#000',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: 'Kivo Research',
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="research/[id]"
          options={{
            title: 'Research Results',
            headerShown: true,
          }}
        />
      </Stack>
    </>
  );
}
