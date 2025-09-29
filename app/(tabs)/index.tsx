// Archivo completo: app/(tabs)/index.tsx

import { FontAwesome } from '@expo/vector-icons';
import { Stack, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Button, FlatList, Modal, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';
import { API_URL } from '../../src/config';

type Course = { id: string; name: string; credits: number; professor: string; };

export default function CoursesScreen() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // --- Estados para el Modal y el Formulario ---
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [courseName, setCourseName] = useState('');
  const [courseCredits, setCourseCredits] = useState('');
  const [courseProfessor, setCourseProfessor] = useState('');

  // --- Lógica de Fetching ---
  useFocusEffect(
    useCallback(() => {
      const fetchCourses = async () => {
        try {
          if (courses.length === 0) setLoading(true);
          const response = await fetch(`${API_URL}/courses`);
          if (!response.ok) throw new Error('Error al conectar');
          const data = await response.json();
          setCourses(data);
          setError(null);
        } catch (err) {
          setError('No se pudieron cargar los cursos.');
        } finally {
          setLoading(false);
        }
      };
      fetchCourses();
    }, [])
  );

  // --- Funciones para abrir y cerrar el Modal ---
  const openModalToCreate = () => {
    setEditingCourse(null);
    setCourseName('');
    setCourseCredits('');
    setCourseProfessor('');
    setModalVisible(true);
  };

  const openModalToEdit = (course: Course) => {
    setEditingCourse(course);
    setCourseName(course.name);
    setCourseCredits(String(course.credits));
    setCourseProfessor(course.professor);
    setModalVisible(true);
  };

  // --- Funciones del CRUD ---
  const handleSave = async () => {
    const isEditing = editingCourse !== null;
    const url = isEditing ? `${API_URL}/courses/${editingCourse!.id}` : `${API_URL}/courses`;
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: courseName,
          credits: parseInt(courseCredits) || 0,
          professor: courseProfessor,
        }),
      });
      if (!response.ok) throw new Error(isEditing ? 'Error al actualizar' : 'Error al crear');
      setModalVisible(false);
    } catch (err) {
      Alert.alert('Error', (err as Error).message);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert("Confirmar", "¿Eliminar este curso?", [
      { text: "Cancelar" },
      { text: "Eliminar", style: 'destructive', onPress: async () => {
        await fetch(`${API_URL}/courses/${id}`, { method: 'DELETE' });
      }}
    ]);
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" /></View>;
  if (error) return <View style={styles.center}><Text style={styles.errorText}>{error}</Text></View>;

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Cursos Disponibles',
          headerRight: () => (
            <Pressable onPress={openModalToCreate}>
              <FontAwesome name="plus" size={25} color="blue" style={{ marginRight: 15 }} />
            </Pressable>
          ),
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
              <Pressable onPress={() => openModalToEdit(item)}><FontAwesome name="pencil" size={25} color="#555" /></Pressable>
              <Pressable onPress={() => handleDelete(item.id)}><FontAwesome name="trash" size={25} color="#E74C3C" /></Pressable>
            </View>
          </View>
        )}
      />

      {/* --- EL MODAL PARA CREAR Y EDITAR --- */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingCourse ? 'Editar Curso' : 'Nuevo Curso'}</Text>
            <TextInput style={styles.input} value={courseName} onChangeText={setCourseName} placeholder="Nombre del Curso" />
            <TextInput style={styles.input} value={courseCredits} onChangeText={setCourseCredits} keyboardType="numeric" placeholder="Créditos" />
            <TextInput style={styles.input} value={courseProfessor} onChangeText={setCourseProfessor} placeholder="Profesor" />
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
  courseItem: { 
    backgroundColor: '#fff', padding: 15, borderRadius: 8, marginBottom: 10,
    marginHorizontal: 10, elevation: 2, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'
  },
  courseInfo: { flex: 1 },
  courseName: { fontSize: 18, fontWeight: 'bold' },
  courseProfessor: { fontSize: 14, color: '#666', marginTop: 5 },
  courseActions: { flexDirection: 'row', gap: 20, paddingLeft: 10 },
  errorText: { color: 'red', fontSize: 16, textAlign: 'center' },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1, borderColor: '#ddd', padding: 10,
    borderRadius: 5, marginBottom: 15,
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
});