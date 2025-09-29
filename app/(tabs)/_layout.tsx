// En el archivo: app/(tabs)/_layout.tsx
import { FontAwesome } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: 'blue' }}>
      <Tabs.Screen
        name="index" // Archivo: index.tsx
        options={{
          title: 'Cursos',
          tabBarIcon: ({ color }) => <FontAwesome size={28} name="book" color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore" // Archivo: explore.tsx
        options={{
          title: 'Estudiantes',
          tabBarIcon: ({ color }) => <FontAwesome size={28} name="users" color={color} />,
        }}
      />
      {/* --- INICIO DE LA MODIFICACIÓN --- */}
      <Tabs.Screen
        name="calendar" // Este será nuestro nuevo archivo: calendar.tsx
        options={{
          title: 'Calendario',
          tabBarIcon: ({ color }) => <FontAwesome size={28} name="calendar" color={color} />,
        }}
      />
      {/* --- FIN DE LA MODIFICACIÓN --- */}
    </Tabs>
  );
}