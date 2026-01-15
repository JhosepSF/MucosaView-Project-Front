import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, NavigationProp, ParamListBase } from "@react-navigation/native";

type CustomHeaderProps = {
  title: string;
  subtitle?: string;
};

const CustomHeader: React.FC<CustomHeaderProps> = ({ title, subtitle }) => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp<ParamListBase>>();

  const handleLogoPress = () => {
    navigation.navigate("MenuRegistro");
  };

  return (
    <View style={[styles.headerContainer, { paddingTop: insets.top + 10 }]}>
      {/* Logo */}
      <TouchableOpacity onPress={handleLogoPress} style={styles.logoContainer}>
        <Image source={require("../../assets/logo.webp")} style={styles.logo} />
      </TouchableOpacity>

      {/* Título principal y subtítulo */}
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
    </View>
  );
};

/** 🎨 Colores suaves que combinan con el logo (teal/azules) */
const COLORS = {
  headerBg: '#E8E4FF', // violet-50 (más limpio y luminoso)
  border:   '#E9D5FF', // violet-200
  title:    '#3B0764', // violet-950
  subtitle: '#7C3AED', // violet-600 (vibrante)
};

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: COLORS.headerBg,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    elevation: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  logoContainer: { marginRight: 10 },
  logo: { width: 30, height: 30, borderRadius: 5 },
  textContainer: { flex: 1 },
  title: { color: COLORS.title, fontSize: 18, fontWeight: "bold" },         // antes: blanco
  subtitle: { color: COLORS.subtitle, fontSize: 12 },                       // antes: rgba blanco
});

export default CustomHeader;
