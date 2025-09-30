import { FontAwesome } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Button,
  Modal,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { useDataFetching } from '../../hooks/useDataFetching';
import * as api from '../../src/api';

LocaleConfig.locales['es'] = {
  monthNames: ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'],
  monthNamesShort: ['Ene.','Feb.','Mar.','Abr.','May.','Jun.','Jul.','Ago.','Sep.','Oct.','Nov.','Dic.'],
  dayNames: ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'],
  dayNamesShort: ['Dom.','Lun.','Mar.','Mié.','Jue.','Vie.','Sáb.'],
};
LocaleConfig.defaultLocale = 'es';

type CalendarEvent = { id: number; name: string; date: string };

export default function CalendarScreen() {
  const { data: allEvents, loading, onRefresh } = useDataFetching(api.fetchEvents);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [eventName, setEventName] = useState('');
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  const markedDates = useMemo(() => {
    return (allEvents || []).reduce((acc, event) => {
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
    await api.saveEvent({ name: eventName, date: selectedDate }, editingEvent?.id);
    setEventName('');
    setEditingEvent(null);
    setModalVisible(false);
    onRefresh();
  };

  const handleDelete = async (id: number) => {
    await api.deleteEvent(id);
    onRefresh();
  };

  const eventsForSelectedDate = (allEvents || []).filter(event => event.date === selectedDate);

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