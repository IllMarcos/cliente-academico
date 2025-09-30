import { FontAwesome } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Button, FlatList, Modal, Pressable, RefreshControl, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useDataFetching } from '../../hooks/useDataFetching';
import type { Course, Grade, Student } from '../../src/api';
import * as api from '../../src/api';

const studentFormFields = [{ key: 'name', placeholder: 'Nombre' }, { key: 'major', placeholder: 'Carrera' }];

export default function StudentsScreen() {
  const { data: students, loading, error, refreshing, onRefresh: refreshStudents } = useDataFetching(api.fetchStudents);
  const { data: allCourses } = useDataFetching(api.fetchCourses);

  // Estados consolidados
  const [modals, setModals] = useState({ edit: false, grades: false, enroll: false });
  const [activeStudent, setActiveStudent] = useState<Student | null>(null);
  const [formState, setFormState] = useState({ name: '', major: '' });
  const [gradesData, setGradesData] = useState<{ grades: Grade[]; gpa: number | null; enrolled: Course[] }>({ grades: [], gpa: null, enrolled: [] });
  const [gradeForm, setGradeForm] = useState({ courseId: '', score: '' });
  
  // Sincroniza el curso seleccionado por defecto en los pickers
  useEffect(() => {
    const firstEnrolledId = gradesData.enrolled[0]?.id;
    const firstAvailableId = allCourses?.[0]?.id;
    setGradeForm(f => ({ ...f, courseId: firstEnrolledId || firstAvailableId || '' }));
  }, [gradesData.enrolled, allCourses]);

  // Gestor centralizado de modales
  const openModal = async (modal: keyof typeof modals, student?: Student) => {
    setActiveStudent(student || null);
    if (modal === 'edit') setFormState(student ? { name: student.name, major: student.major } : { name: '', major: '' });
    if (modal === 'grades' && student) {
      try {
        const [grades, gpaData, enrolled] = await Promise.all([
          api.fetchGrades(student.id),
          api.fetchStudentGPA(student.id),
          api.fetchStudentEnrolledCourses(student.id),
        ]);
        setGradesData({ grades, gpa: gpaData.gpa, enrolled });
      } catch (err) { Alert.alert('Error', (err as Error).message); }
    }
    setModals(prev => ({ ...prev, [modal]: true }));
  };

  const closeModal = (modal: keyof typeof modals) => setModals(prev => ({ ...prev, [modal]: false }));

  const handleSaveStudent = () => api.saveStudent(formState, activeStudent?.id)
    .then(() => { closeModal('edit'); refreshStudents(); })
    .catch(() => Alert.alert('Error', 'No se pudo guardar el estudiante.'));

  const handleDeleteStudent = (id: string) => Alert.alert('Confirmar', '¿Eliminar a este estudiante?', [
    { text: 'Cancelar' },
    { text: 'Eliminar', style: 'destructive', onPress: () => api.deleteStudent(id).then(refreshStudents) },
  ]);
  
  const handleAddGrade = () => {
    if (!gradeForm.courseId || !gradeForm.score.trim() || !activeStudent) return Alert.alert("Datos incompletos", "Selecciona un curso y añade una calificación.");
    api.addGrade({ studentId: activeStudent.id, courseId: gradeForm.courseId, score: parseFloat(gradeForm.score) })
      .then(() => { setGradeForm(f => ({ ...f, score: '' })); openModal('grades', activeStudent); })
      .catch(err => Alert.alert('Error', (err as Error).message));
  };
  
  const handleEnroll = () => {
    if (!activeStudent || !gradeForm.courseId) return;
    api.enrollStudent(activeStudent.id, gradeForm.courseId)
      .then(() => { Alert.alert('Éxito', `${activeStudent.name} ha sido inscrito.`); closeModal('enroll'); })
      .catch(err => Alert.alert('Error de Inscripción', (err as Error).message));
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#007AFF" /></View>;
  if (error) return <View style={styles.center}><Text style={styles.errorText}>{error}</Text></View>;

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Estudiantes', headerRight: () => <Pressable onPress={() => openModal('edit')}><FontAwesome name="plus" size={25} color="blue" style={{ marginRight: 15 }} /></Pressable> }}/>
      
      <FlatList
        data={students}
      keyExtractor  ={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.studentItem}>
            <View style={styles.studentInfo}>
              <Text style={styles.studentName}>{item.name}</Text>
              <Text style={styles.studentMajor}>{item.major}</Text>
            </View>
            <View style={styles.studentActions}>
              <Pressable onPress={() => openModal('enroll', item)}><FontAwesome name="book" size={25} color="#28a745" /></Pressable>
              <Pressable onPress={() => openModal('grades', item)}><FontAwesome name="graduation-cap" size={25} color="#007AFF" /></Pressable>
              <Pressable onPress={() => openModal('edit', item)}><FontAwesome name="pencil" size={25} color="#555" /></Pressable>
              <Pressable onPress={() => handleDeleteStudent(item.id)}><FontAwesome name="trash" size={25} color="#E74C3C" /></Pressable>
            </View>
          </View>
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshStudents} />}
      />
      
      {/* Modal de Edición */}
      <Modal visible={modals.edit} transparent animationType="slide" onRequestClose={() => closeModal('edit')}>
        <View style={styles.modalContainer}><View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{activeStudent ? 'Editar' : 'Nuevo'} Estudiante</Text>
          {studentFormFields.map(({ key, placeholder }) => <TextInput key={key} style={styles.input} value={formState[key as keyof typeof formState]} onChangeText={t => setFormState(s => ({...s, [key]: t}))} placeholder={placeholder}/>)}
          <View style={styles.buttonGroup}>
            <Button title="Cancelar" onPress={() => closeModal('edit')} color="gray" />
            <Button title="Guardar" onPress={handleSaveStudent} />
          </View>
        </View></View>
      </Modal>

      {/* Modal de Calificaciones */}
      {activeStudent && <Modal visible={modals.grades} animationType="slide" onRequestClose={() => closeModal('grades')}>
        <SafeAreaView style={styles.modalView}>
          <Text style={styles.modalTitle}>Calificaciones de {activeStudent.name}</Text>
          {gradesData.gpa !== null && <Text style={styles.gpaText}>Promedio (GPA): {gradesData.gpa.toFixed(2)}</Text>}
          <FlatList
            data={gradesData.grades}
            keyExtractor={item => item.id.toString()}
            renderItem={({ item }) => <View style={styles.gradeItem}><Text style={styles.courseName}>{item.courseName}</Text><Text style={styles.score}>{item.score.toFixed(1)}</Text></View>}
            ListEmptyComponent={<Text style={styles.emptyText}>No hay calificaciones.</Text>}
            ListFooterComponent={<View style={styles.addGradeContainer}>
              <Text style={styles.addGradeTitle}>Añadir Calificación</Text>
              {gradesData.enrolled.length > 0 ? <>
                <Picker selectedValue={gradeForm.courseId} onValueChange={id => setGradeForm(f => ({...f, courseId: id}))}>
                  {gradesData.enrolled.map(c => <Picker.Item key={c.id} label={c.name} value={c.id} />)}
                </Picker>
                <TextInput style={styles.input} placeholder="Calificación (ej. 8.5)" keyboardType="numeric" value={gradeForm.score} onChangeText={t => setGradeForm(f => ({...f, score: t}))}/>
                <Button title="Añadir Calificación" onPress={handleAddGrade} />
              </> : <Text style={styles.emptyText}>No está inscrito en cursos.</Text>}
            </View>}
          />
          <Button title="Cerrar" onPress={() => closeModal('grades')} color="gray" />
        </SafeAreaView>
      </Modal>}
      
      {/* Modal de Inscripción */}
      <Modal visible={modals.enroll} transparent animationType="slide" onRequestClose={() => closeModal('enroll')}>
        <View style={styles.modalContainer}><View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Inscribir a {activeStudent?.name}</Text>
          {allCourses && allCourses.length > 0 ? (
            <Picker selectedValue={gradeForm.courseId} onValueChange={id => setGradeForm(f => ({...f, courseId: id as string}))}>
              {allCourses.map(c => <Picker.Item key={c.id} label={c.name} value={c.id} />)}
            </Picker>
          ) : <Text style={styles.emptyText}>No hay cursos disponibles.</Text>}
          <View style={styles.buttonGroup}>
            <Button title="Cancelar" onPress={() => closeModal('enroll')} color="gray" />
            <Button title="Inscribir" onPress={handleEnroll} disabled={!allCourses?.length} />
          </View>
        </View></View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  studentItem: { backgroundColor: '#fff', padding: 15, borderRadius: 8, marginVertical: 5, marginHorizontal: 10, elevation: 2, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  studentInfo: { flex: 1 },
  studentName: { fontSize: 18, fontWeight: 'bold' },
  studentMajor: { fontSize: 14, color: '#666', marginTop: 5 },
  studentActions: { flexDirection: 'row', gap: 15, paddingLeft: 10 },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 10, borderRadius: 5, marginBottom: 15, },
  errorText: { color: 'red', fontSize: 16, textAlign: 'center' },
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', },
  modalContent: { width: '90%', backgroundColor: 'white', borderRadius: 10, padding: 20, elevation: 10, },
  modalTitle: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 20, },
  gpaText: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 20, color: '#007AFF' },
  buttonGroup: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 10, },
  modalView: { flex: 1, padding: 10 },
  gradeItem: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, backgroundColor: 'white', borderBottomWidth: 1, borderColor: '#eee', },
  courseName: { fontSize: 16 },
  score: { fontSize: 16, fontWeight: 'bold' },
  addGradeContainer: { padding: 20, marginTop: 20, borderTopWidth: 1, borderColor: '#ddd', },
  addGradeTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, textAlign: 'center', },
  emptyText: { textAlign: 'center', color: 'gray', marginTop: 20 },
});