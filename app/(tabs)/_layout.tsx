import { FontAwesome } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: 'blue' }}>
      <Tabs.Screen
        name="index" 
        options={{
          title: 'Cursos',
          tabBarIcon: ({ color }) => <FontAwesome size={28} name="book" color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore" 
        options={{
          title: 'Estudiantes',
          tabBarIcon: ({ color }) => <FontAwesome size={28} name="users" color={color} />,
        }}
      />
      {/* --- INICIO DE LA MODIFICACIÓN --- */}
      <Tabs.Screen
        name="calendar" 
        options={{
          title: 'Calendario',
          tabBarIcon: ({ color }) => <FontAwesome size={28} name="calendar" color={color} />,
        }}
      />
      {/* --- FIN DE LA MODIFICACIÓN --- */}
    </Tabs>
  );
}