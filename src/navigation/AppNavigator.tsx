import React from 'react';
import { View, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';

import CustomHeader from '../components/CustomHeader';
import Footer from '../components/Footer';

import MenuRegistroScreen from '../screens/MenuRegistroScreen';
import RegistroNuevoScreen from '../screens/RegistroNuevoScreen';
import AgregarFotosScreen from '../screens/AgregarFotoScreen';
import SyncQueueScreen from '../screens/SyncQueueScreen';

const Stack = createNativeStackNavigator();

function AppNavigator() {
  return (
    <NavigationContainer>
      <View style={styles.appContainer}>
        <CustomHeader title="MucosaView" subtitle="Recoleccion" />
        <View style={styles.content}>
          <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="MenuRegistro">
            <Stack.Screen name="MenuRegistro" component={MenuRegistroScreen} />
            <Stack.Screen name="RegistroNuevo" component={RegistroNuevoScreen} />
            <Stack.Screen name="AgregarFotos" component={AgregarFotosScreen} />
            <Stack.Screen name="SyncQueue" component={SyncQueueScreen} />
          </Stack.Navigator>
        </View>
        <Footer />
      </View>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});

export default AppNavigator;
