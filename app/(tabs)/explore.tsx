// Archivo completo: app/(tabs)/explore.tsx

import { FontAwesome } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { Stack, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Button, FlatList, Modal, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';
import { API_URL } from '../../src/config';

// --- Tipos de Datos ---
type Student = { id: string; name: string; major: string; };
type Course = { id: string; name: string; credits: number; professor: string; };
type Grade = { id: number; courseName: string; score: number; };

export default function StudentsScreen() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Estados para el Modal de Edición ---
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [studentName, setStudentName] = useState('');
  const [studentMajor, setStudentMajor] = useState('');
  
  // --- Estados para el Modal de Calificaciones ---
  const [gradesModalVisible, setGradesModalVisible] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentGrades, setStudentGrades] = useState<Grade[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string | undefined>();
  const [newScore, setNewScore] = useState('');

  // --- Lógica de Fetching Principal ---
  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        try {
          if (students.length === 0) setLoading(true);
          const [studentsRes, coursesRes] = await Promise.all([
            fetch(`${API_URL}/students`),
            fetch(`${API_URL}/courses`),
          ]);
          if (!studentsRes.ok || !coursesRes.ok) throw new Error('Error al conectar con el servidor');
          const studentsData = await studentsRes.json();
          const coursesData = await coursesRes.json();
          setStudents(studentsData);
          setAllCourses(coursesData);
          if (coursesData.length > 0 && !selectedCourseId) {
            setSelectedCourseId(coursesData[0].id);
          }
          setError(null);
        } catch (err) {
          setError('No se pudieron cargar los datos.');
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }, [])
  );

  // --- CRUD del Estudiante ---
  const openEditModal = (student: Student) => {
    setEditingStudent(student);
    setStudentName(student.name);
    setStudentMajor(student.major);
    setEditModalVisible(true);
  };

  const handleSaveStudent = async () => {
    const isEditing = editingStudent !== null;
    const url = isEditing ? `${API_URL}/students/${editingStudent!.id}` : `${API_URL}/students`;
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: studentName, major: studentMajor }),
      });
      if (!response.ok) throw new Error(isEditing ? 'Error al actualizar' : 'Error al crear');
      setEditModalVisible(false);
    } catch (err) {
      Alert.alert('Error', (err as Error).message);
    }
  };

  const handleDeleteStudent = (id: string) => {
    Alert.alert("Confirmar", "¿Eliminar a este estudiante?", [
      { text: "Cancelar" },
      { text: "Eliminar", style: 'destructive', onPress: async () => {
        await fetch(`${API_URL}/students/${id}`, { method: 'DELETE' });
      }}
    ]);
  };

  // --- Lógica para el Modal de Calificaciones ---
  const openGradesModal = async (student: Student) => {
    setSelectedStudent(student);
    try {
      const response = await fetch(`${API_URL}/students/${student.id}/grades`);
      if (!response.ok) throw new Error('No se pudieron cargar las calificaciones');
      const data = await response.json();
      setStudentGrades(data);
      setGradesModalVisible(true);
    } catch (err) {
      Alert.alert('Error', (err as Error).message);
    }
  };

  const handleAddGrade = async () => {
    if (!selectedCourseId || !newScore.trim() || !selectedStudent) {
      Alert.alert('Error', 'Por favor, selecciona un curso y escribe una calificación.');
      return;
    }
    try {
      const response = await fetch(`${API_URL}/grades`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: selectedStudent.id,
          courseId: selectedCourseId,
          score: parseFloat(newScore),
        }),
      });
      if (!response.ok) throw new Error('No se pudo añadir la calificación.');
      
      setNewScore('');
      
      // Refrescar la lista de calificaciones del modal
      const updatedGradesRes = await fetch(`${API_URL}/students/${selectedStudent.id}/grades`);
      const updatedGradesData = await updatedGradesRes.json();
      setStudentGrades(updatedGradesData);

    } catch (err) {
      Alert.alert('Error', (err as Error).message);
    }
  };
  
  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#007AFF" /></View>;
  if (error) return <View style={styles.center}><Text style={styles.errorText}>{error}</Text></View>;

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Estudiantes',
          headerRight: () => (
            <Pressable onPress={() => { setEditingStudent(null); setStudentName(''); setStudentMajor(''); setEditModalVisible(true); }}>
              <FontAwesome name="plus" size={25} color="blue" style={{ marginRight: 15 }} />
            </Pressable>
          ),
        }}
      />

      <FlatList
        data={students}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.studentItem}>
            <View style={styles.studentInfo}>
              <Text style={styles.studentName}>{item.name}</Text>
              <Text style={styles.studentMajor}>{item.major}</Text>
            </View>
            <View style={styles.studentActions}>
              <Pressable onPress={() => openGradesModal(item)}>
                <FontAwesome name="graduation-cap" size={25} color="#007AFF" />
              </Pressable>
              <Pressable onPress={() => openEditModal(item)}>
                <FontAwesome name="pencil" size={25} color="#555" />
              </Pressable>
              <Pressable onPress={() => handleDeleteStudent(item.id)}>
                <FontAwesome name="trash" size={25} color="#E74C3C" />
              </Pressable>
            </View>
          </View>
        )}
      />

      {/* --- Modal de Edición/Creación de Estudiante --- */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingStudent ? 'Editar Estudiante' : 'Nuevo Estudiante'}</Text>
            <TextInput style={styles.input} value={studentName} onChangeText={setStudentName} placeholder="Nombre del Estudiante" />
            <TextInput style={styles.input} value={studentMajor} onChangeText={setStudentMajor} placeholder="Carrera" />
            <View style={styles.buttonGroup}>
              <Button title="Cancelar" onPress={() => setEditModalVisible(false)} color="gray" />
              <Button title="Guardar" onPress={handleSaveStudent} />
            </View>
          </View>
        </View>
      </Modal>

      {/* --- Modal para Calificaciones --- */}
      {selectedStudent && (
        <Modal
          animationType="slide"
          visible={gradesModalVisible}
          onRequestClose={() => setGradesModalVisible(false)}
        >
          <SafeAreaView style={styles.modalView}>
            <Text style={styles.modalTitle}>Calificaciones de {selectedStudent.name}</Text>
            
            <FlatList
              data={studentGrades}
              keyExtractor={item => item.id.toString()}
              renderItem={({ item }) => (
                <View style={styles.gradeItem}>
                  <Text style={styles.courseName}>{item.courseName}</Text>
                  <Text style={styles.score}>{item.score.toFixed(1)}</Text>
                </View>
              )}
              ListEmptyComponent={<Text style={styles.emptyText}>No hay calificaciones registradas.</Text>}
              ListFooterComponent={
                <View style={styles.addGradeContainer}>
                  <Text style={styles.addGradeTitle}>Añadir Nueva Calificación</Text>
                  <Picker
                    selectedValue={selectedCourseId}
                    onValueChange={(itemValue) => setSelectedCourseId(itemValue)}
                  >
                    {allCourses.map(course => (
                      <Picker.Item key={course.id} label={course.name} value={course.id} />
                    ))}
                  </Picker>
                  <TextInput
                    style={styles.input}
                    placeholder="Calificación (ej. 8.5)"
                    keyboardType="numeric"
                    value={newScore}
                    onChangeText={setNewScore}
                  />
                  <Button title="Añadir Calificación" onPress={handleAddGrade} />
                </View>
              }
            />
            <Button title="Cerrar" onPress={() => setGradesModalVisible(false)} color="gray" />
          </SafeAreaView>
        </Modal>
      )}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  studentItem: {
    backgroundColor: '#fff', padding: 15, borderRadius: 8, marginBottom: 10,
    marginHorizontal: 10, elevation: 2, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'
  },
  studentInfo: { flex: 1 },
  studentName: { fontSize: 18, fontWeight: 'bold' },
  studentMajor: { fontSize: 14, color: '#666', marginTop: 5 },
  studentActions: { flexDirection: 'row', gap: 20, paddingLeft: 10 },
  input: {
    borderWidth: 1, borderColor: '#ddd', padding: 10,
    borderRadius: 5, marginBottom: 15,
  },
  errorText: { color: 'red', fontSize: 16, textAlign: 'center' },
  // Estilos para modales
  modalContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '90%', backgroundColor: 'white', borderRadius: 10,
    padding: 20, elevation: 10,
  },
  modalTitle: {
    fontSize: 22, fontWeight: 'bold', textAlign: 'center',
    marginVertical: 20,
  },
  buttonGroup: {
    flexDirection: 'row', justifyContent: 'space-around',
    marginTop: 10,
  },
  // Estilos para el modal de calificaciones
  modalView: { flex: 1, padding: 10 },
  gradeItem: {
    flexDirection: 'row', justifyContent: 'space-between', padding: 15,
    backgroundColor: 'white', borderBottomWidth: 1, borderColor: '#eee',
  },
  courseName: { fontSize: 16 },
  score: { fontSize: 16, fontWeight: 'bold' },
  addGradeContainer: {
    padding: 20, marginTop: 20,
    borderTopWidth: 1, borderColor: '#ddd',
  },
  addGradeTitle: {
    fontSize: 18, fontWeight: 'bold', marginBottom: 10,
    textAlign: 'center',
  },
  emptyText: { textAlign: 'center', color: 'gray', marginTop: 20 },
});