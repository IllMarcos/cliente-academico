// Archivo completo y corregido: app/(tabs)/calendar.tsx

import { FontAwesome } from '@expo/vector-icons';
import { Stack, useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Button, Modal, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { API_URL } from '../../src/config';

// Configurar el calendario en español
LocaleConfig.locales['es'] = {
  monthNames: ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'],
  monthNamesShort: ['Ene.','Feb.','Mar.','Abr.','May.','Jun.','Jul.','Ago.','Sep.','Oct.','Nov.','Dic.'],
  dayNames: ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'],
  dayNamesShort: ['Dom.','Lun.','Mar.','Mié.','Jue.','Vie.','Sáb.'],
  // --- CORRECCIÓN 1: Se elimina la propiedad 'today' que no es válida ---
};
LocaleConfig.defaultLocale = 'es';

type CalendarEvent = { id: number; name: string; date: string; };

export default function CalendarScreen() {
  const [allEvents, setAllEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [eventName, setEventName] = useState('');
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  // --- CORRECCIÓN 2: Se aplica el patrón correcto para funciones async en hooks ---
  useFocusEffect(
    useCallback(() => {
      const fetchEvents = async () => {
        try {
          if (allEvents.length === 0) setLoading(true);
          const response = await fetch(`${API_URL}/calendar/events`);
          const data = await response.json();
          setAllEvents(data);
        } catch (err) {
          Alert.alert("Error", "No se pudieron cargar los eventos.");
        } finally {
          setLoading(false);
        }
      };
      fetchEvents();
    }, [])
  );

  const markedDates = useMemo(() => {
    return allEvents.reduce((acc, event) => {
      acc[event.date] = { marked: true, dotColor: 'blue' };
      return acc;
    }, {} as { [key: string]: { marked: boolean, dotColor: string } });
  }, [allEvents]);

  const handleDayPress = (day: { dateString: string }) => {
    setSelectedDate(day.dateString);
    setEditingEvent(null);
    setEventName('');
    setModalVisible(true);
  };
  
  const openModalToEdit = (event: CalendarEvent) => {
    setEditingEvent(event);
    setEventName(event.name);
  };

  const handleSave = async () => {
    const isEditing = editingEvent !== null;
    const url = isEditing ? `${API_URL}/calendar/events/${editingEvent!.id}` : `${API_URL}/calendar/events`;
    const method = isEditing ? 'PUT' : 'POST';
    
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: eventName, date: selectedDate }),
    });
    setEventName('');
    setEditingEvent(null);
    // La lista se actualizará automáticamente en el siguiente focus
  };

  const handleDelete = async (id: number) => {
    await fetch(`${API_URL}/calendar/events/${id}`, { method: 'DELETE' });
    // La lista se actualizará automáticamente en el siguiente focus
  };

  const eventsForSelectedDate = allEvents.filter(event => event.date === selectedDate);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" /></View>;

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Calendario Académico' }} />
      
      <Calendar
        onDayPress={handleDayPress}
        markedDates={markedDates}
        monthFormat={'MMMM yyyy'}
        theme={{ todayTextColor: '#00adf5', arrowColor: 'blue' }}
      />

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Eventos para {new Date(selectedDate).toLocaleDateString('es-MX', { timeZone: 'UTC', year: 'numeric', month: 'long', day: 'numeric' })}
            </Text>

            {eventsForSelectedDate.length > 0 ? (
              eventsForSelectedDate.map(event => (
                <View key={event.id} style={styles.eventItem}>
                  <Text style={styles.eventName}>{editingEvent?.id === event.id ? '' : event.name}</Text>
                  <View style={styles.eventActions}>
                    <Pressable onPress={() => openModalToEdit(event)}><FontAwesome name="pencil" size={20} color="#555" /></Pressable>
                    <Pressable onPress={() => handleDelete(event.id)}><FontAwesome name="trash" size={20} color="#E74C3C" /></Pressable>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No hay eventos este día.</Text>
            )}

            <View style={styles.formContainer}>
              <TextInput 
                style={styles.input} 
                value={eventName} 
                onChangeText={setEventName} 
                placeholder={editingEvent ? "Editar nombre del evento" : "Nuevo nombre del evento"}
              />
              <Button title={editingEvent ? "Actualizar Evento" : "Añadir Evento"} onPress={handleSave} />
            </View>

            <Button title="Cerrar" onPress={() => setModalVisible(false)} color="gray" />
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { width: '90%', backgroundColor: 'white', borderRadius: 10, padding: 20, elevation: 10 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  eventItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderColor: '#eee' },
  eventName: { fontSize: 16, flex: 1 },
  eventActions: { flexDirection: 'row', gap: 20 },
  emptyText: { textAlign: 'center', color: 'gray', marginVertical: 20 },
  formContainer: { marginTop: 20, paddingTop: 20, borderTopWidth: 1, borderColor: '#eee' },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 10, borderRadius: 5, marginBottom: 15 },
});