import { API_URL } from './config';

// --- Tipos de Datos ---
export type Course = { id: string; name: string; credits: number; professor: string };
export type Student = { id: string; name: string; major: string };
export type CalendarEvent = { id: number; name: string; startDate: string; endDate: string };
export type Grade = { id: number; courseName: string; score: number };
export type GradePayload = { studentId: string; courseId: string; score: number };
export type GPA = { gpa: number };

// --- Función de Solicitud Genérica ---
const request = async <T>(endpoint: string, options?: RequestInit): Promise<T> => {
  const response = await fetch(`${API_URL}${endpoint}`, options);
  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Error en la solicitud a ${endpoint}: ${errorBody || response.statusText}`);
  }
  if (response.status === 204) {
    return null as T;
  }
  return response.json();
};

// --- Servicio de Gestión de Cursos ---
export const fetchCourses = () => request<Course[]>('/courses');
export const saveCourse = (course: Omit<Course, 'id'>, id?: string) => {
  const method = id ? 'PUT' : 'POST';
  const endpoint = id ? `/courses/${id}` : '/courses';
  return request<Course>(endpoint, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(course),
  });
};
export const deleteCourse = (id: string) => request<void>(`/courses/${id}`, { method: 'DELETE' });

// --- Servicio de Gestión de Estudiantes ---
export const fetchStudents = () => request<Student[]>('/students');
export const saveStudent = (student: Omit<Student, 'id'>, id?: string) => {
  const method = id ? 'PUT' : 'POST';
  const endpoint = id ? `/students/${id}` : '/students';
  return request<Student>(endpoint, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(student),
  });
};
export const deleteStudent = (id: string) => request<void>(`/students/${id}`, { method: 'DELETE' });

// --- Servicio de Gestión de Calificaciones ---
export const fetchGrades = (studentId: string) => request<Grade[]>(`/students/${studentId}/grades`);
export const addGrade = (grade: GradePayload) => request<Grade>('/grades', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(grade),
});

// --- Servicio de Cómputo de Promedio (GPA) ---
export const fetchStudentGPA = (studentId: string) => request<GPA>(`/students/${studentId}/gpa`);


// --- Servicio de Inscripciones ---
export const enrollStudent = (studentId: string, courseId: string) => request<any>(`/enrollments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ studentId, courseId }),
});

// ¡NUEVO!
export const fetchStudentEnrolledCourses = (studentId: string) => request<Course[]>(`/students/${studentId}/courses`);

// --- Servicio de Calendario Académico ---
export const fetchEvents = () => request<CalendarEvent[]>('/calendar/events');
export const saveEvent = (event: Omit<CalendarEvent, 'id'>, id?: number) => {
  const method = id ? 'PUT' : 'POST';
  const endpoint = id ? `/calendar/events/${id}` : '/calendar/events';
  return request<CalendarEvent>(endpoint, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(event),
  });
};
export const deleteEvent = (id: number) => request<void>(`/calendar/events/${id}`, { method: 'DELETE' });