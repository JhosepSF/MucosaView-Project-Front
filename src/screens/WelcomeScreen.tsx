// src/screens/WelcomeScreen.tsx
import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Image,
  ScrollView,
  BackHandler,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { COLORS } from '../styles';

export default function WelcomeScreen() {
  const navigation = useNavigation<any>();

  // Interceptar el botón de retroceso en Android
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        // Mostrar alerta para confirmar salida de la app
        Alert.alert(
          '¿Salir de MucosaView?',
          '¿Estás seguro que deseas cerrar la aplicación?',
          [
            {
              text: 'Cancelar',
              onPress: () => null,
              style: 'cancel'
            },
            {
              text: 'Salir',
              onPress: () => BackHandler.exitApp()
            }
          ]
        );
        return true; // Prevenir el comportamiento por defecto
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => subscription.remove();
    }, [])
  );

  return (
    <View style={styles.container}>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Image */}
        <Image
          source={require('../../assets/Obstetra.png')}
          style={styles.heroImage}
          resizeMode="contain"
        />

        {/* Welcome Text */}
        <Text style={styles.welcomeText}>Bienvenido a</Text>
        <Text style={styles.appName}>MucosaView</Text>
        <Text style={styles.description}>
          Sistema inteligente de detección de anemia mediante análisis de mucosas
        </Text>

        {/* Action Buttons */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={[styles.button, styles.buttonPrimary]}
            onPress={() => navigation.navigate('MenuRegistro')}
          >
            <Ionicons name="camera" size={28} color="#fff" style={styles.buttonIcon} />
            <View>
              <Text style={styles.buttonTitle}>Registrar Paciente</Text>
              <Text style={styles.buttonSubtitle}>Captura de datos y fotos</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.buttonSecondary]}
            onPress={() => navigation.navigate('SyncQueue')}
          >
            <Ionicons name="sync" size={28} color="#fff" style={styles.buttonIcon} />
            <View>
              <Text style={styles.buttonTitle}>Sincronización</Text>
              <Text style={styles.buttonSubtitle}>Ver registros pendientes</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.buttonTertiary]}
            onPress={() => {
              // TODO: Navegar a pantalla de diagnóstico IA cuando esté lista
              navigation.navigate('MenuRegistro');
            }}
          >
            <Ionicons name="analytics" size={28} color="#fff" style={styles.buttonIcon} />
            <View>
              <Text style={styles.buttonTitle}>Diagnóstico Inteligente</Text>
              <Text style={styles.buttonSubtitle}>Análisis de anemia por IA</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  heroImage: {
    width: 200,
    height: 200,
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 18,
    color: COLORS.subtext,
    marginBottom: 8,
    fontWeight: '500',
  },
  appName: {
    fontSize: 42,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: COLORS.subtext,
    textAlign: 'center',
    marginBottom: 40,
    paddingHorizontal: 20,
    lineHeight: 22,
  },
  buttonsContainer: {
    width: '100%',
    gap: 16,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  buttonPrimary: {
    backgroundColor: COLORS.greenBtn,
  },
  buttonSecondary: {
    backgroundColor: COLORS.blueBtn,
  },
  buttonTertiary: {
    backgroundColor: COLORS.pinkBtn,
  },
  buttonIcon: {
    marginRight: 16,
  },
  buttonTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  buttonSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  footer: {
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.ghostBg,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginBottom: 12,
    gap: 8,
  },
  footerText: {
    fontSize: 12,
    color: COLORS.text,
    fontWeight: '500',
    flex: 1,
  },
  copyright: {
    fontSize: 11,
    color: COLORS.subtext,
    fontWeight: '600',
    letterSpacing: 1,
  },
});