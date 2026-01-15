// src/screens/MenuRegistroScreen.tsx
import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { commonStyles, COLORS } from '../styles';

export default function MenuRegistroScreen() {
  const navigation = useNavigation<any>();

  return (
    <ScrollView 
      style={{ flex: 1, backgroundColor: COLORS.bg }} 
      contentContainerStyle={{ 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: 24, 
        paddingBottom: 40 
      }}
    >
      <Image
        source={require('../../assets/Obstetra2.png')} 
        style={localStyles.heroImage}
        resizeMode="contain"
      />
      <Text style={[commonStyles.subtitle, { fontSize: 18, marginBottom: 30 }]}>Selecciona una opción</Text>

      <View style={{ width: '100%', gap: 20 }}>
        <TouchableOpacity style={[commonStyles.btn, localStyles.btnGreen]} onPress={() => navigation.navigate('RegistroNuevo')}>
          <Ionicons name="person-add" size={22} color="#fff" style={localStyles.icon} />
          <View style={{ flex: 1 }}>
            <Text style={commonStyles.btnText}>Primera Visita</Text>
            <Text style={localStyles.btnSubtext}>Registra un nuevo paciente con datos completos y fotos</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={[commonStyles.btn, localStyles.btnBlue]} onPress={() => navigation.navigate('AgregarFotos')}>
          <Ionicons name="camera-outline" size={22} color="#fff" style={localStyles.icon} />
          <View style={{ flex: 1 }}>
            <Text style={commonStyles.btnText}>Agregar Nueva Visita</Text>
            <Text style={localStyles.btnSubtext}>Registra una visita adicional de un paciente existente</Text>
          </View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const localStyles = StyleSheet.create({
  // 🎨 IMAGEN - Ajusta width y height para cambiar el tamaño
  heroImage: {
    width: 280,      // ← Cambia este valor (ejemplo: 250, 300, 350)
    height: 280,     // ← Cambia este valor para la altura
    marginTop: 20,   // ← Espacio arriba de la imagen
    marginBottom: 30, // ← Espacio abajo de la imagen
  },
  
  // 🟢 BOTÓN VERDE (Primera Visita)
  btnGreen: { 
    backgroundColor: COLORS.greenBtn, 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingLeft: 16,
    paddingVertical: 18,  // ← Cambia para hacer el botón más alto/bajo
  },
  
  // 🔵 BOTÓN AZUL (Agregar Visita)
  btnBlue: { 
    backgroundColor: COLORS.blueBtn, 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingLeft: 16,
    paddingVertical: 18,  // ← Cambia para hacer el botón más alto/bajo
  },
  
  icon: { 
    marginRight: 12,
  },
  
  // Texto pequeño debajo del título del botón
  btnSubtext: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
  },
});
