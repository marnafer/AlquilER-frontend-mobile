# 📱 Aplicación Móvil de Alquiler (`alquiler-frontend-mobile`)

Este repositorio contiene la aplicación móvil desarrollada en **React Native** (utilizando la biblioteca Expo) para la gestión e interacción en tiempo real con la plataforma de alquileres de propiedades AlquilER. Permite a los inquilinos y propietarios explorar inmuebles, gestionar favoritos, enviar consultas, realizar reservas y consultar reseñas.

---

## ⚡ Guía Rápida para Probar el Proyecto

Sigue estos 4 pasos para poner a funcionar la aplicación móvil en tu equipo:

### 1. Requisitos Previos
Asegúrate de tener corriendo previamente el servidor backend PHP (`alquiler-backend`):

# En el directorio del backend
php -S localhost:8000 -t public

### 2. Instalación de Dependencias
Abre una terminal en la carpeta raíz del proyecto móvil:

cd alquiler-frontend-mobile
npm install

### 3. Configurar la Conexión con la API (.env)
Crea un archivo .env en la raíz del proyecto para definir la dirección IP según tu entorno de ejecución:

# OPCIÓN A: Emulador Android  (Android Studio)
EXPO_PUBLIC_API_URL=http://10.2.2:8000/api

# OPCIÓN B: Simulador iOS o Vista Previa en Navegador Web
EXPO_PUBLIC_URL=http://localhost:8000/api

### 4. Iniciar el Servidor de Desarrollo

npx expo start

### 5. Abrir la Aplicación
Dispositivo físico: Escanea el código QR desde la aplicación Expo Go (disponible en Play Store/App Store).
Emulador Android: Presiona a en la terminal (requiere Android Studio con un dispositivo virtual abierto).
Emulador iOS: Presiona i en la terminal (requiere Xcode en macOS).
Web: Presiona w para probar una vista preliminar en el navegador.