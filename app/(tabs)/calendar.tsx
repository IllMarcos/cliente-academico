import { FontAwesome } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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

type CalendarEvent = { id: number; name: string; startDate: string; endDate: string };

export default function CalendarScreen() {
  const { data: allEvents, loading, onRefresh } = useDataFetching(api.fetchEvents);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedStartDate, setSelectedStartDate] = useState('');
  const [selectedEndDate, setSelectedEndDate] = useState('');
  const [eventName, setEventName] = useState('');
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  const markedDates = useMemo(() => {
    const markings: { [key: string]: any } = {};
    (allEvents || []).forEach(event => {
      if (!event.startDate || !event.endDate) return;

      const startDate = new Date(event.startDate + 'T00:00:00Z');
      const endDate = new Date(event.endDate + 'T00:00:00Z');
      let currentDate = new Date(startDate);

      while (currentDate <= endDate) {
        const dateString = currentDate.toISOString().split('T')[0];
        const isStart = dateString === event.startDate;
        const isEnd = dateString === event.endDate;

        const marking: any = {
          textColor: 'white',
        };

        if (isStart) {
          marking.startingDay = true;
          marking.color = 'blue';
        }
        if (isEnd) {
          marking.endingDay = true;
          marking.color = 'blue';
        }
        if (!isStart && !isEnd) {
          marking.color = 'lightblue';
        }

        markings[dateString] = marking;

        currentDate.setUTCDate(currentDate.getUTCDate() + 1);
      }
    });
    return markings;
  }, [allEvents]);

  const handleDayPress = (day: { dateString: string }) => {
    if (!selectedStartDate || (selectedStartDate && selectedEndDate)) {
      setSelectedStartDate(day.dateString);
      setSelectedEndDate('');
      setEditingEvent(null);
      setEventName('');
      setModalVisible(true);
    } else {
      setSelectedEndDate(day.dateString);
    }
  };
  
  const openModalToEdit = (event: CalendarEvent) => {
    setEditingEvent(event);
    setEventName(event.name);
    setSelectedStartDate(event.startDate);
    setSelectedEndDate(event.endDate);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!eventName.trim() || !selectedStartDate) {
      Alert.alert('Error', 'El nombre del evento y la fecha de inicio son obligatorios.');
      return;
    }
    try {
      await api.saveEvent({ name: eventName, startDate: selectedStartDate, endDate: selectedEndDate || selectedStartDate }, editingEvent?.id);
      setEventName('');
      setEditingEvent(null);
      setModalVisible(false);
      onRefresh();
      Alert.alert('Éxito', 'El evento se ha guardado correctamente.');
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar el evento.');
    }
  };

  const handleDelete = (id: number) => {
    Alert.alert(
      "Confirmar eliminación",
      "¿Estás seguro de que quieres eliminar este evento?",
      [
        {
          text: "Cancelar",
          style: "cancel"
        },
        { text: "Eliminar", onPress: async () => {
          try {
            await api.deleteEvent(id);
            onRefresh();
            Alert.alert('Éxito', 'El evento se ha eliminado correctamente.');
          } catch (error) {
            Alert.alert('Error', 'No se pudo eliminar el evento.');
          }
        }}
      ]
    );
  };

  const eventsForSelectedDate = (allEvents || []).filter(event => 
    new Date(selectedStartDate) >= new Date(event.startDate) && new Date(selectedStartDate) <= new Date(event.endDate)
  );

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" /></View>;

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Calendario Académico' }} />
      
      <Calendar
        onDayPress={handleDayPress}
        markedDates={markedDates}
        markingType={'period'}
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
              Eventos para {new Date(selectedStartDate).toLocaleDateString('es-MX', { timeZone: 'UTC', year: 'numeric', month: 'long', day: 'numeric' })}
              {selectedEndDate && ` - ${new Date(selectedEndDate).toLocaleDateString('es-MX', { timeZone: 'UTC', year: 'numeric', month: 'long', day: 'numeric' })}`}
            </Text>

            {eventsForSelectedDate.length > 0 && !editingEvent ? (
              eventsForSelectedDate.map(event => (
                <View key={event.id} style={styles.eventItem}>
                  <Text style={styles.eventName}>{event.name}</Text>
                  <View style={styles.eventActions}>
                    <Pressable onPress={() => openModalToEdit(event)}><FontAwesome name="pencil" size={20} color="#555" /></Pressable>
                    <Pressable onPress={() => handleDelete(event.id)}><FontAwesome name="trash" size={20} color="#E74C3C" /></Pressable>
                  </View>
                </View>
              ))
            ) : (
              !editingEvent && <Text style={styles.emptyText}>No hay eventos para este día.</Text>
            )}

            <View style={styles.formContainer}>
              <TextInput 
                style={styles.input} 
                value={eventName} 
                onChangeText={setEventName} 
                placeholder={editingEvent ? "Editar nombre del evento" : "Nuevo nombre del evento"}
              />
               <TextInput 
                style={styles.input} 
                value={selectedEndDate} 
                onChangeText={setSelectedEndDate} 
                placeholder={"Fecha de fin (YYYY-MM-DD)"}
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