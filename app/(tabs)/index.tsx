import { FontAwesome } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Button, FlatList, Modal, Pressable, RefreshControl, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useDataFetching } from '../../hooks/useDataFetching';
import * as api from '../../src/api';

type Course = { id: string; name: string; credits: number; professor: string };

// Configuración para los campos del formulario del modal
const modalFields = [
  { key: 'name', placeholder: 'Nombre del Curso' },
  { key: 'credits', placeholder: 'Créditos', keyboardType: 'numeric' as const },
  { key: 'professor', placeholder: 'Profesor' },
];

export default function CoursesScreen() {
  const { data: courses, loading, error, refreshing, onRefresh } = useDataFetching(api.fetchCourses);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [formState, setFormState] = useState({ name: '', credits: '', professor: '' });

  const openModal = (course?: Course) => {
    setEditingCourse(course || null);
    setFormState(course ? { name: course.name, credits: String(course.credits), professor: course.professor } : { name: '', credits: '', professor: '' });
    setModalVisible(true);
  };

  const handleSave = async () => {
    try {
      await api.saveCourse({ ...formState, credits: parseInt(formState.credits) || 0 }, editingCourse?.id);
      setModalVisible(false);
      onRefresh();
    } catch (err) {
      Alert.alert('Error', 'No se pudo guardar el curso.');
    }
  };

  const handleDelete = (id: string) => Alert.alert('Confirmar', '¿Eliminar este curso?', [
    { text: 'Cancelar' },
    { text: 'Eliminar', style: 'destructive', onPress: () => api.deleteCourse(id).then(onRefresh) },
  ]);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" /></View>;
  if (error) return <View style={styles.center}><Text style={styles.errorText}>{error}</Text></View>;

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Cursos Disponibles',
          headerRight: () => <Pressable onPress={() => openModal()}><FontAwesome name="plus" size={25} color="blue" style={{ marginRight: 15 }} /></Pressable>,
        }}
      />
      <FlatList
        data={courses}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.courseItem}>
            <View style={styles.courseInfo}>
              <Text style={styles.courseName}>{item.name} ({item.credits} créditos)</Text>
              <Text style={styles.courseProfessor}>{item.professor}</Text>
            </View>
            <View style={styles.courseActions}>
              <Pressable onPress={() => openModal(item)}><FontAwesome name="pencil" size={25} color="#555" /></Pressable>
              <Pressable onPress={() => handleDelete(item.id)}><FontAwesome name="trash" size={25} color="#E74C3C" /></Pressable>
            </View>
          </View>
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingCourse ? 'Editar Curso' : 'Nuevo Curso'}</Text>
            {modalFields.map(field => (
              <TextInput
                key={field.key}
                style={styles.input}
                value={formState[field.key as keyof typeof formState]}
                onChangeText={text => setFormState(s => ({ ...s, [field.key]: text }))}
                placeholder={field.placeholder}
                keyboardType={field.keyboardType}
              />
            ))}
            <View style={styles.buttonGroup}>
              <Button title="Cancelar" onPress={() => setModalVisible(false)} color="gray" />
              <Button title="Guardar" onPress={handleSave} />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  courseItem: { backgroundColor: '#fff', padding: 15, borderRadius: 8, marginVertical: 5, marginHorizontal: 10, elevation: 2, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  courseInfo: { flex: 1 },
  courseName: { fontSize: 18, fontWeight: 'bold' },
  courseProfessor: { fontSize: 14, color: '#666', marginTop: 5 },
  courseActions: { flexDirection: 'row', gap: 20, paddingLeft: 10 },
  errorText: { color: 'red', fontSize: 16, textAlign: 'center' },
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { width: '90%', backgroundColor: 'white', borderRadius: 10, padding: 20, elevation: 10 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 10, borderRadius: 5, marginBottom: 15 },
  buttonGroup: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 10 },
});