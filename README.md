# 📱 AlquilER — Aplicación móvil

**Repositorio:** `alquiler-frontend-mobile`  
**Tecnologías:** React Native, Expo y Expo Router.

AlquilER es una aplicación móvil para explorar propiedades en alquiler e interactuar con la plataforma. Permite consultar detalles e imágenes de las propiedades, gestionar favoritos, enviar consultas, acceder a conversaciones, realizar reservas y consultar reseñas.

> **Importante:** este repositorio contiene el frontend móvil. Para utilizar las funcionalidades que dependen de datos, necesitás un backend compatible y una base de datos configurada, o una API remota accesible.

---

## 📚 Índice

1. Requisitos previos
2. Clonar el proyecto
3. Instalar dependencias
4. Configurar la conexión con la API
5. Preparar y ejecutar el backend
6. Iniciar la aplicación móvil
7. Probar en un teléfono físico
8. Probar en un emulador Android
9. Probar en web
10. Probar las funcionalidades
11. Generar un APK de prueba
12. Publicar una actualización OTA
13. Solución de problemas
14. Estructura del proyecto
15. Seguridad

---

## 1. Requisitos previos

Antes de comenzar, instalá las siguientes herramientas:

- **Git:** para clonar el repositorio.
- **Node.js LTS y npm:** para instalar y ejecutar las dependencias del proyecto.
- **Backend AlquilER:** local o remoto, con una base de datos configurada.
- **Expo Go:** opcional, para ejecutar la app en un teléfono sin generar un APK.
- **Android Studio:** opcional, para utilizar un emulador Android.
- **Cuenta de Expo:** necesaria si vas a utilizar EAS Build o EAS Update.

Verificá que Git, Node.js y npm estén instalados:

```bash
git --version
node --version
npm --version
```

Se recomienda utilizar una versión de Node.js compatible con la versión de Expo definida en `package.json`.

## 2. Clonar el proyecto

Abrí una terminal y ejecutá:

```bash
git clone <github.com/marnafer/AlquilER-frontend-mobile>
cd alquiler-frontend-mobile
```

Para comprobar que estás en la carpeta correcta:

```bash
git status
```

## 3. Instalar dependencias

Desde la raíz del proyecto, ejecutá:

```bash
npm ci
```

Este comando instala las versiones especificadas en `package-lock.json`.

Si el repositorio no contiene ese archivo, utilizá:

```bash
npm install
```

Si la instalación falla, revisá primero la versión de Node.js y el mensaje de error. No es recomendable actualizar todas las dependencias indiscriminadamente para resolver un problema de instalación.

## 4. Configurar la conexión con la API

La aplicación necesita conocer la dirección del backend para consultar propiedades, autenticar usuarios y utilizar las demás funcionalidades.

Creá un archivo llamado `.env` en la raíz del proyecto, al mismo nivel que `package.json`.

La variable utilizada por el proyecto es:

```dotenv
EXPO_PUBLIC_API_URL=http://HOST_DEL_BACKEND:8000/api
```

Reemplazá `HOST_DEL_BACKEND` según el entorno donde se ejecute la aplicación.

### A. Teléfono físico con Expo Go

Si el backend se ejecuta en tu computadora, necesitás utilizar la dirección IP local de esa computadora.

Ejemplo:

```dotenv
EXPO_PUBLIC_API_URL=http://192.168.1.100:8000/api
```

La dirección `192.168.1.100` es solamente un ejemplo. Para conocer tu IP local en Windows, ejecutá:

```powershell
ipconfig
```

Buscá la dirección IPv4 del adaptador conectado a la misma red que el teléfono.

El teléfono y la computadora deben estar conectados a la misma red local. Si es necesario, permití las conexiones entrantes al puerto 8000 en el firewall.

### B. Emulador Android

Si el backend se ejecuta en la misma computadora y utilizás el emulador estándar de Android Studio, normalmente podés acceder al servidor mediante `10.0.2.2`:

```dotenv
EXPO_PUBLIC_API_URL=http://10.0.2.2:8000/api
```

No uses `localhost` para referirte a la computadora desde el emulador, porque normalmente apunta al propio emulador.

### C. Aplicación web

Si el navegador y el backend se ejecutan en la misma computadora:

```dotenv
EXPO_PUBLIC_API_URL=http://localhost:8000/api
```

### D. Backend remoto

Si vas a utilizar una API alojada en un servidor remoto, configurá su URL real:

```dotenv
EXPO_PUBLIC_API_URL=https://tu-dominio.example/api
```

El dominio es ilustrativo y debe reemplazarse por la dirección real de la API. Incluí `/api` si esa es la ruta base configurada en el backend.

### Aplicar los cambios

Después de crear o modificar el archivo `.env`, reiniciá Expo:

```bash
npx expo start --clear
```

**Importante:** las variables que comienzan con `EXPO_PUBLIC_` quedan disponibles en el código del cliente. No incluyas contraseñas, tokens privados ni credenciales secretas en ellas.

## 5. Preparar y ejecutar el backend

La aplicación móvil necesita que el backend esté funcionando y que disponga de los endpoints que utiliza el frontend.

Si vas a ejecutar el backend localmente:

1. Cloná el repositorio del backend.
2. Instalá las dependencias de PHP con Composer.
3. Configurá las variables de entorno del backend.
4. Prepará la base de datos.
5. Ejecutá las migraciones o configurá el esquema requerido, según las instrucciones del backend.
6. Cargá datos de prueba si son necesarios.

Seguí el README del backend para conocer sus requisitos y procedimientos específicos.

Una vez configurado, si el proyecto está preparado para utilizar el servidor integrado de PHP, podés iniciarlo desde la carpeta del backend:

```bash
php -S 0.0.0.0:8000 -t public
```

La opción `0.0.0.0` permite que otros dispositivos de la red local puedan acceder al servidor. Utilizala únicamente para desarrollo y con las precauciones correspondientes. Si solamente vas a probar desde la misma computadora, podés utilizar `localhost`.

Comprobá que la API responda utilizando una ruta válida del backend, como el endpoint público del listado de propiedades si está disponible.

> Iniciar PHP no configura automáticamente la base de datos. El backend debe tener conexión a una base de datos válida, las tablas necesarias y los datos de prueba correspondientes.

## 6. Iniciar la aplicación móvil

Con las dependencias instaladas, el archivo `.env` configurado y el backend disponible, desde la raíz del frontend ejecutá:

```bash
npx expo start
```

Expo iniciará el servidor de desarrollo y mostrará un código QR junto con las opciones disponibles para abrir la aplicación.

Si aparecen problemas de caché o los cambios no se reflejan correctamente:

```bash
npx expo start --clear
```

## 7. Probar en un teléfono físico

Para ejecutar la aplicación en un teléfono Android o iPhone mediante Expo Go:

1. Instalá Expo Go desde la tienda oficial del dispositivo.
2. Conectá el teléfono y la computadora a la misma red Wi-Fi.
3. Configurá `EXPO_PUBLIC_API_URL` con la IP local de la computadora y el puerto del backend.
4. Iniciá Expo con `npx expo start`.
5. Escaneá el código QR con Expo Go.
6. Esperá a que la aplicación cargue.
7. Probá las pantallas y verificá que puedan consultar los datos de la API.

Si el teléfono no logra conectarse al servidor de desarrollo de Expo, podés probar:

```bash
npx expo start --tunnel
```

El túnel facilita la conexión entre el teléfono y Expo, pero **no vuelve accesible automáticamente el backend PHP**. El teléfono también necesita poder conectarse a la dirección configurada en `EXPO_PUBLIC_API_URL`.

## 8. Probar en un emulador Android

Para utilizar un dispositivo virtual:

1. Instalá Android Studio.
2. Abrí Device Manager.
3. Creá un dispositivo virtual e iniciá el emulador.
4. Verificá que el backend esté funcionando.
5. Configurá la URL de la API con `http://10.0.2.2:8000/api` si el backend corre en la computadora anfitriona.
6. Ejecutá `npx expo start`.
7. Presioná `a` en la terminal para abrir la aplicación en el emulador.

La primera configuración puede requerir descargar una imagen del sistema Android y otras herramientas desde Android Studio.

## 9. Probar en web

Si las dependencias y la configuración del proyecto admiten web, ejecutá:

```bash
npx expo start --web
```

También podés iniciar Expo normalmente y presionar `w` si esa opción está disponible.

Si el backend se ejecuta en la misma computadora, podés utilizar `localhost` en la URL de la API.

Si aparecen errores CORS, revisá la configuración del backend y confirmá que el origen del frontend esté permitido. También verificá que no se esté intentando acceder a un recurso HTTP desde una página HTTPS.

No todas las funciones nativas del teléfono están necesariamente disponibles en la versión web.

## 10. Probar las funcionalidades

La disponibilidad de cada funcionalidad depende de los endpoints existentes en el backend, los permisos de la cuenta y los datos de prueba.

Se recomienda seguir este orden:

1. **Navegación:** abrir la aplicación y recorrer las pantallas principales.
2. **Listado de propiedades:** comprobar que se carguen propiedades desde la API.
3. **Detalle de propiedad:** revisar imágenes, características, ubicación, servicios y descripción.
4. **Reseñas:** comprobar que se muestren las reseñas disponibles y que la pantalla gestione correctamente los casos sin reseñas.
5. **Registro e inicio de sesión:** utilizar una cuenta de prueba válida.
6. **Favoritos:** agregar y quitar propiedades de favoritos.
7. **Consultas y mensajes:** probar el acceso a consultas y conversaciones con cuentas compatibles.
8. **Reservas:** probar las operaciones que permita el backend y los estados disponibles.
9. **Publicación de propiedades:** probar el formulario y la carga de imágenes.
10. **Manejo de errores:** en desarrollo, detener temporalmente el backend y comprobar que la app gestione el problema de conexión.

Para probar funciones autenticadas, utilizá cuentas de prueba y datos que puedas modificar o eliminar sin afectar información real.

## 11. Generar un APK de prueba

Para generar un APK Android instalable mediante EAS Build, necesitás configurar EAS y contar con un perfil de compilación que genere APK.

Iniciá sesión en Expo:

```bash
npx eas-cli@latest login
```

Si el proyecto todavía no está configurado para EAS:

```bash
npx eas-cli@latest build:configure
```

Revisá el archivo `eas.json`. Un perfil de ejemplo para generar un APK es:

```json
{
  "build": {
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

Este ejemplo es ilustrativo. Integralo con la configuración existente, sin reemplazar el archivo completo antes de revisar sus otros perfiles.

Cuando el perfil esté preparado, ejecutá:

```bash
npx eas-cli@latest build --platform android --profile preview
```

EAS iniciará la compilación y, cuando termine, mostrará un enlace para descargar el APK e instalarlo en un dispositivo Android compatible.

Antes de distribuirlo, verificá que la URL de la API incluida en la compilación sea accesible desde el teléfono. No utilices `localhost` ni `10.0.2.2` en un APK destinado a teléfonos físicos fuera del entorno local.

## 12. Publicar una actualización OTA

Si el proyecto está configurado con `expo-updates`, podés publicar determinados cambios JavaScript y de interfaz sin generar un APK nuevo.

Por ejemplo:

```bash
npx eas-cli@latest update --branch preview --message "Agrega reseñas y mejora el detalle de propiedades"
```

Antes de publicar, verificá:

- Que la rama `preview` sea la correspondiente a las instalaciones que querés actualizar.
- Que el canal de actualización de esas compilaciones esté asociado a esa rama.
- Que el `runtimeVersion` de la actualización sea compatible con la aplicación instalada.
- Que los cambios no requieran una nueva compilación nativa.

Una actualización OTA no instala la aplicación desde cero. Si modificaste dependencias nativas o configuraciones que requieren recompilación, generá y distribuí un APK nuevo.

## 13. Solución de problemas

### La aplicación abre, pero no carga propiedades

- Confirmá que el backend esté funcionando.
- Revisá `EXPO_PUBLIC_API_URL` y que incluya la ruta base correcta, como `/api`.
- Probá un endpoint válido del backend desde el navegador o una herramienta HTTP.
- Verificá que la base de datos tenga las tablas y los datos necesarios.
- Reiniciá Expo con `npx expo start --clear`.

### El teléfono no puede conectarse al backend

- No uses `localhost` para referirte a la computadora desde el teléfono.
- Utilizá la IPv4 local de la computadora.
- Confirmá que ambos dispositivos estén conectados a la misma red.
- Revisá el firewall y el puerto del servidor PHP.
- Confirmá que PHP esté escuchando en una interfaz accesible desde la red local.

### El emulador Android no puede conectarse

- Utilizá `10.0.2.2` para acceder al servidor de la computadora anfitriona desde el emulador estándar.
- Verificá que PHP esté ejecutándose en el puerto configurado.
- Revisá la URL completa, incluido el esquema HTTP y la ruta `/api`.

### Aparece un error CORS en web

- Confirmá que el backend permita el origen del frontend.
- Revisá si el navegador bloquea contenido HTTP desde una página HTTPS.
- Comprobá que la API sea accesible por separado.

### Expo no toma las variables del archivo `.env`

- Verificá que `.env` esté en la raíz del frontend.
- Confirmá que el nombre de la variable sea `EXPO_PUBLIC_API_URL`.
- Reiniciá Expo con `npx expo start --clear`.
- No coloques credenciales secretas en variables públicas.

### La APK no recibe una actualización OTA

- Revisá la rama y el canal de actualización.
- Verificá la configuración de `expo-updates` y `runtimeVersion`.
- Confirmá que la aplicación tenga conexión a Internet.
- Si el cambio requiere código nativo, generá una nueva APK.

### Falla la instalación de dependencias

- Comprobá la versión de Node.js.
- Si existe `package-lock.json`, utilizá `npm ci`.
- Revisá el primer error relevante antes de modificar las dependencias.

## 14. Estructura del proyecto

La estructura exacta puede variar según la versión del repositorio. En un proyecto Expo con Expo Router, podés encontrar una organización similar a esta:

```text
alquiler-frontend-mobile/
├── app/                 # Rutas y navegación
├── components/          # Componentes reutilizables
├── screens/             # Pantallas
├── services/            # Comunicación con la API
├── theme/               # Colores, tamaños y estilos
├── assets/              # Imágenes, iconos y recursos
├── .env                 # Variables locales; no subir al repositorio
├── app.json             # Configuración de Expo
├── eas.json             # Perfiles EAS, si está configurado
├── package.json         # Dependencias y scripts
└── package-lock.json    # Versiones bloqueadas
```

Tomá la estructura real del repositorio como referencia si alguno de estos directorios no existe.

## 15. Seguridad

- No subas contraseñas, tokens ni claves privadas al repositorio.
- No incluyas secretos en variables `EXPO_PUBLIC_*`, ya que pueden leerse desde el cliente.
- Utilizá cuentas ficticias y datos de prueba.
- Para desarrollo, preferí una base de datos separada de producción.
- No ejecutes migraciones ni operaciones destructivas sobre producción para probar la aplicación.
- Para una distribución pública, utilizá una URL HTTPS accesible y estable para la API.
- Confirmá que el backend aplique autenticación y autorización a las operaciones protegidas.

---

## ✅ Lista de comprobación

Antes de dar por terminada la instalación, verificá:

- [ ] Git, Node.js y npm están instalados.
- [ ] El repositorio fue clonado correctamente.
- [ ] Las dependencias se instalaron sin errores.
- [ ] El archivo `.env` contiene una URL de API accesible desde el dispositivo.
- [ ] El backend y la base de datos están funcionando.
- [ ] La aplicación se abre mediante Expo Go, emulador o APK.
- [ ] El listado y el detalle de propiedades cargan correctamente.
- [ ] Las reseñas se muestran correctamente, incluso cuando no hay resultados.
- [ ] Las funciones autenticadas se probaron con una cuenta de prueba.

¡Listo! Con el frontend, el backend y la base de datos preparados, ya podés comenzar a probar AlquilER.