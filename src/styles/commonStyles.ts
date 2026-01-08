// src/styles/commonStyles.ts
// Estilos compartidos para toda la aplicación
import { StyleSheet } from 'react-native';
import { COLORS } from './colors';

export const commonStyles = StyleSheet.create({
  // Contenedores
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  
  containerStart: {
    flex: 1,
    backgroundColor: COLORS.bg,
    padding: 24,
  },

  // Tipografía
  title: { 
    color: COLORS.text, 
    fontSize: 26, 
    fontWeight: '800' 
  },
  
  subtitle: { 
    color: COLORS.subtext, 
    marginTop: 8, 
    marginBottom: 12 
  },
  
  label: {
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: 6,
  },

  // Botones
  btn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  
  btnPrimary: { 
    backgroundColor: COLORS.primary 
  },
  
  btnSecondary: { 
    backgroundColor: COLORS.secondary 
  },
  
  btnGhost: { 
    backgroundColor: COLORS.ghostBg, 
    borderWidth: 1, 
    borderColor: COLORS.border 
  },
  
  btnWarn: { 
    backgroundColor: COLORS.warn 
  },
  
  btnDanger: { 
    backgroundColor: COLORS.danger 
  },

  btnSuccess: {
    backgroundColor: COLORS.success
  },

  btnText: { 
    color: '#FFFFFF', 
    fontWeight: '700', 
    fontSize: 15 
  },
  
  btnTextGhost: { 
    color: COLORS.primary, 
    fontWeight: '700', 
    fontSize: 15 
  },

  // Botones pequeños
  btnSm: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },

  // Inputs
  input: {
    backgroundColor: '#F9F5FF', // lila muy claro
    color: COLORS.text,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  inputError: {
    borderColor: COLORS.danger,
    borderWidth: 2,
  },

  // Modales
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(75,33,66,0.35)', // ciruela translúcido
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  modalCard: {
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 12,
    width: '88%',
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  // Cards
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },

  // Separadores
  divider: {
    height: 1,
    backgroundColor: '#2c2f3f',
    width: '100%',
    marginVertical: 20,
  },

  // Imágenes
  heroImg: {
    width: '80%',
    height: 160,
    marginTop: 4,
    marginBottom: 12,
    alignSelf: 'center',
  },

  // Layout helpers
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  spaceBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
